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


const
    router = require('express').Router(),
    Model = require('../model/base.js'),
    pug = require('pug'),
    apiManager = require('../apiRequestManager.js').apiManager,
    formidable = require('formidable'),
    fileManager = require('../fileManager.js'),
    quota = require('../quota.js'),
    path = require('path'),
    whiteLabelCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'whitelabel.pug')),
    sizeOf = require('image-size'),
    conf = require('../../config'),
    fs = require('fs'),
    co = require('co');

let uploadDir;

function checkSize(imagePath, requiredSize, errorImageSize) {
    return new Promise((resolve, reject) => {
        sizeOf(imagePath,
        (err, dimension) => {
            if (err) {
                reject(err.message);
                return;
            }
            if (dimension.width !== requiredSize.width || dimension.height !== requiredSize.height) {
                reject(errorImageSize);
                return;
            }
            resolve();
        });
    });
}

function getLogosHandler(req, res) {
    co(function*() {
            if (!uploadDir) {
                uploadDir = yield getUploadDir();
            }

            const getLogo = apiManager.get("settings/whitelabel/logos.json?retina=true&isDefault=" + req.query.isDefault, req);
            const getLogoText = apiManager.get("settings/whitelabel/logotext.json?isDefault=" + req.query.isDefault, req);

            const [logos, logoText] = yield [getLogo, getLogoText];

            res.send({
                success: true,
                message: "",
                logos,
                logoText
            });
            res.end();
        })
        .catch((error) => {
            res.send({
                success: false,
                message: error
            });
        });
}

function restoreDefaultLogos(req, res) {
    co(function*() {
            const value = yield apiManager.put("settings/whitelabel/restore.json?isDefault=" + req.query.isDefault, req);
            res.send({ success: true, message: "", value });
            res.end();
        })
        .catch((err) => {
            res.send({ success: false, message: err });
            res.end();
        });
}

function uploadLogo(req, res) {
    const form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;

    const logotype = req.query.logotype;
    const requiredSize = conf.getSize(parseInt(logotype));

    form.parse(req,
        function (err, fields, files) {
            const uploaded = files["logoUploader_" + logotype];

            if (err || !uploaded) {
                res.send({ success: false });
                res.end();
                return;
            }
            const newName = logotype + path.extname(uploaded.name);

            co(function*() {
                    yield checkSize(uploaded.path, requiredSize, req.resources.cpWhiteLabelResource.ErrorImageSize);
                    const filePath = path.join(form.uploadDir, newName);
                    yield fileManager.moveFile(uploaded.path, filePath);
                    res.send({
                        success: true,
                        message: `${conf.makePath(conf.rebranding)}/${newName}`,
                        logotype,
                        filePath: newName
                    });
                    res.end();
                })
                .catch((err) => {
                    co(function*() {
                        yield fileManager.deleteFile(uploaded.path);
                        res.send({
                            success: false,
                            message: err || req.resources.cpWhiteLabelResource.ErrorImageSize,
                            logotype
                        });
                        res.end();

                    }).catch((error) => {
                        res.end();
                    });
                });
        });
}

function saveLogos(req, res) {
    let logo = [],
        files = [];

    if (req.body.logo) {
        req.body.logo.forEach((item) => {
            if (item.value === "") return;

            if (item.value.startsWith("data:image/png;base64,")) {
                logo.push(item);
                return;
            }

            files.push(path.join(uploadDir, item.value));
        });
    }
    co(function*() {
            let params = {
                method: "POST",
                body: {
                    logoText: req.body.logoText,
                    logo
                },
                json: true
            };

            yield apiManager.makeRequest("settings/whitelabel/save.json?isDefault=" + req.query.isDefault, req, params);

            if (files.length === 0) {
                res.send({
                    success: true,
                    message: ''
                });
                res.end();
                return;
            }
            
            params = {
                method: "POST",
                formData: { },
                json: true
            };

            files.forEach((file) => params.formData[path.basename(file, '.png')] = fs.createReadStream(file));

            yield apiManager.makeRequest("settings/whitelabel/savefromfiles.json?isDefault=" + req.query.isDefault, req, params);

            res.send({
                success: true,
                message: ''
            });
            res.end();
        })
        .catch((err) => {
            res.send({
                success: false,
                message: err
            });
            res.end();
        });
}

function getUploadDir() {
    return new Promise(function(resolve, reject){ 
        fileManager.getDataDirPath(conf.rebranding)
            .then((result) => {
                resolve(result);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

router
    .use(require('../middleware/quota.js')("whiteLabel"))
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        if (!uploadDir) {
            getUploadDir().then((result) => {
                uploadDir = result;
                res.end(whiteLabelCompiled(new Model(req, req.resources.controlPanelResource.WhiteLabel)));
            });
        } else {
            res.end(whiteLabelCompiled(new Model(req, req.resources.controlPanelResource.WhiteLabel)));
        }
    })
    .get("/getLogos", getLogosHandler)
    .post("/restoreDefaultLogos", restoreDefaultLogos)
    .post("/uploadLogo", uploadLogo)
    .post("/saveLogos", saveLogos);

module.exports = router;