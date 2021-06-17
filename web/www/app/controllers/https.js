/*
 *
 * (c) Copyright Ascensio System Limited 2010-2021
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const x509 = require('x509.js');
const co = require('co');

const app = require('express')();
const router = require('express').Router();
const httpsCompiled = require('pug').compileFile(path.join(__dirname, '..', '..', 'views', 'https.pug'));
const httpsInfoCompiled = require('pug').compileFile(path.join(__dirname, '..', '..', 'views', 'httpsInfo.pug'));
const Model = require('../model/base.js');
const baseController = require("./base.js");

const config = require('../../config');
const fileManager = require('../fileManager.js');
const executeHelper = require('../executeHelper.js');
const log = require('../log.js');
const fullAccess = require('../middleware/fullAccess.js');

const csContainer = config.get("docker:CommunityServer:container");
const productName = config.get("product:name");
const crtFileName = `${productName}.crt`;
const keyFileName = `${productName}.key`;
const requestFileName = `${productName}.csr`;
const pfxFileName = `${productName}.pfx`;
const pfxPassword = `${productName}`;

let httpsFolder = config.get("web:https");
let httpsTempFolder = path.join(httpsFolder, 'tmp');
let isDocker = undefined;

function createHttpsDir() {
    return co(function*() {
        if (app.get('env') === 'development')
            return null;
      
        httpsFolder = yield fileManager.getDataDirPath(httpsFolder);
        httpsTempFolder = yield fileManager.getDataDirPath(httpsTempFolder);
        const dataDir = yield fileManager.getDataDirPath();

        yield executeHelper('tools/get.sh', 
                "-cc", csContainer, 
                "-f", path.join(config.getProductDir("httpsDir"), config.get("web:https")), 
                "-t", dataDir);

        return;
    });
}

function filesExistsHandler(req, res) {
    const crtPath = path.join(httpsFolder, crtFileName);
    const crtFileExist = fileManager.checkFileExist(crtPath),
        keyFileExist = fileManager.checkFileExist(path.join(httpsFolder, keyFileName)),
        crtTmpFileExist = fileManager.checkFileExist(path.join(httpsTempFolder, crtFileName)),
        keyTmpFileExist = fileManager.checkFileExist(path.join(httpsTempFolder, keyFileName)),
        checkDomainPromise = checkDomain(crtPath);

    co(function*() {
            const result = yield {
                certificate: crtFileExist,
                key: keyFileExist,
                certificateTmp: crtTmpFileExist,
                keyTmp: keyTmpFileExist,
                domain: checkDomainPromise
            };

            res.send(result);
        })
        .catch((err) => {
            log.error("https ", err);
            res.status(500);
            res.send({ error: err });
            res.end();
        });
}

function copy(from, to) {
    return [crtFileName, keyFileName, pfxFileName].map((item) => {
        return fileManager.copyFile(path.join(from, item), path.join(to, item));
    });
}

function deleteFrom(folder) {
    return [crtFileName, keyFileName, pfxFileName].map((item) => {
        return fileManager.deleteFile(path.join(folder, item));
    });
}

function checkDomain(pathToCert) {
    return co(function* () {
        const exists = yield fileManager.checkFileExist(pathToCert);
        if (!exists) return "";

        return new Promise((resolve) => {
            fs.readFile(pathToCert, (err, data) => {
                if (err) resolve("");
                try {
                    var parsedData = x509.parseCert(data);
                    resolve(parsedData.subject.commonName);
                } catch (e) {
                    log.error(e);
                    resolve("");
                }
            });
        });
    });
}

function upload(req, res, ext, filePath) {
    const form = new formidable.IncomingForm();
    form.uploadDir = httpsTempFolder;

    form.parse(req, function (err, fields, files) {
        res.status(200);
        const uploaded = files["files[]"];

        if (err || !uploaded || !uploaded.name.endsWith(ext)) {
            res.send({ success: false });
            res.end();
            return;
        }

        fileManager.moveFile(uploaded.path, filePath)
            .then(() => {
                res.send({ success: true, file: filePath });
                res.end();
            })
            .catch(() => {
                res.send({ success: false });
                res.end();
            });
    });
}

function generateSelfSignedCertificate(req) {
    if (!baseController.validateIPaddress(req.headers.host)) {
        return baseController.generateLetsEncryptCertificate(req, false);
    }
    return co(function*() {
        yield executeHelper('tools/openssl.sh',
            "-k", path.join(httpsTempFolder, keyFileName),
            "-c", path.join(httpsTempFolder, crtFileName),
            "-r", path.join(httpsTempFolder, requestFileName));
        yield applyCertificate(req);
    });
}

function applyCertificate(req) {
    return co(function*() {
        const isEq = yield executeHelper('tools/compare-certs.sh', path.join(httpsTempFolder, crtFileName), path.join(httpsTempFolder, keyFileName));
        if(isEq !== "true"){
            throw req.resources.controlPanelResource.HttpsCertificateCrtKeyCompareError;
        }

        var pfxExist = yield fileManager.checkFileExist(path.join(httpsTempFolder, pfxFileName));
        if(!pfxExist){
            yield executeHelper('tools/createpfx.sh',
            "-k", path.join(httpsTempFolder, keyFileName),
            "-c", path.join(httpsTempFolder, crtFileName),
            "-pfx", path.join(httpsTempFolder, pfxFileName),
            "-p", path.join(httpsTempFolder, pfxPassword));
        }

        yield copy(httpsTempFolder, httpsFolder);

        yield executeHelper('tools/apply-certificate.sh', csContainer, productName, httpsFolder, config.getProductDir('httpsDir'));
    });
}

router
    .use(fullAccess())
    .get("/", (req, res) => {
        const data = new Model(req, req.resources.controlPanelResource.Https);
        res.setHeader('content-type', 'text/html');

        if (config.isMono) {
            if(isDocker !== undefined) {
                res.end(isDocker ? httpsCompiled(data) : httpsInfoCompiled(data));
            } else {
                executeHelper("tools/check-docker.sh")
                    .then((result) => {
                        console.log("check-docker.sh return " + result);
                        isDocker = (result == "true");

                        if (isDocker) {
                            createHttpsDir()
                                .then((result) => {
                                    res.end(httpsCompiled(data));
                                });
                        } else {
                            res.end(httpsInfoCompiled(data));
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        isDocker = false;
                        res.end(httpsInfoCompiled(data));
                    });
            }
        } else {
            res.end(httpsInfoCompiled(data));
        }
    })
    .get("/filesExists", filesExistsHandler)
    .post("/uploadCertificate", (req, res) => {
        upload(req, res, ".crt", path.join(httpsTempFolder, crtFileName));
    })
    .post("/uploadKey", (req, res) => {
        upload(req, res, ".key", path.join(httpsTempFolder, keyFileName));
    })
    .post("/generateSelfSignedCertificate", (req, res) => {
        generateSelfSignedCertificate(req)
            .then(() => {
                filesExistsHandler(req, res);
            })
            .catch((err) => {
                log.error("generateSelfSignedCertificate", err);
                res.status(200);
                res.send({ success: false, message: err });
                res.end();
            });
    })
    .post("/applyCertificate", (req, res) => {
        co(function* () {
            yield applyCertificate(req);
            filesExistsHandler(req, res);
        }).catch((txt) => {
            log.error(txt);
            res.status(500);
            res.send(txt);
            res.end();
        });
    })
    .delete("/deleteCertificate", (req, res) => {
        const cleanHttpsFolder = deleteFrom(httpsFolder);

        co(function*() {
            yield cleanHttpsFolder;
            yield executeHelper('tools/remove-certificate.sh', csContainer, productName, path.join(config.getProductDir("httpsDir"), config.get("web:https")));
            filesExistsHandler(req, res);
        })
        .catch((err) => {
            console.log(err);
            filesExistsHandler(req, res);
        });
    });

module.exports = router;