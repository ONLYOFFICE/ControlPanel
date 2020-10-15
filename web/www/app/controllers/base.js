/*
 *
 * (c) Copyright Ascensio System Limited 2010-2020
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


const apiRequestManager = require('../apiRequestManager.js').apiManager;
const apiSystemManager = require('../apiRequestManager.js').apiSystemManager;
const executeHelper = require('../executeHelper.js');
const fileManager = require('../fileManager.js');
const co = require('co');
const config = require('../../config');
const csContainer = config.get("docker:CommunityServer:container");
const fs = require('fs');
const path = require('path');
const x509 = require('x509.js');
const log = require('../log.js');
const httpsDir = config.getProductDir("httpsDir")
const productName = config.get("product:name");
const crtFileName = `${productName}.crt`;

function onSuccess(response, result) {
    response.status(200);

    if (typeof result === "string") {
        response.send({ "data": result });
        return;
    }

    response.send(result);
}

function onError(response, error) {
    response.status(500);
    response.send(error);
}

function getIssuer(pathToCert) {
    return co(function* () {
        const exists = yield fileManager.checkFileExist(pathToCert);
        if (!exists) return "";

        return new Promise((resolve) => {
            fs.readFile(pathToCert, (err, data) => {
                if (err) resolve("");
                try {
                    var parsedData = x509.parseCert(data);
                    resolve(parsedData.issuer.organizationName);
                } catch (e) {
                    log.error(e);
                    resolve("");
                }
            });
        });
    });
}

class BaseController {
    constructor() {}

    get(method, req, res) {
        apiRequestManager.get(method, req)
            .then(onSuccess.bind(null, res))
            .catch(onError.bind(null, res));
    }

    post(method, req, res) {
        apiRequestManager.post(method, req)
            .then(onSuccess.bind(null, res))
            .catch(onError.bind(null, res));
    }

    dlt(method, req, res) {
        apiRequestManager.dlt(method, req)
            .then(onSuccess.bind(null, res))
            .catch(onError.bind(null, res));
    }

    put(method, req, res) {
        apiRequestManager.put(method, req)
            .then(onSuccess.bind(null, res))
            .catch(onError.bind(null, res));
    }
    generateLetsEncryptCertificate(req, checkIssuer = true) {
        const self = this;
        return co(function*() {
                if (self.validateIPaddress(req.headers.host)) return;

                if (checkIssuer) {
                    const issuer = yield getIssuer(path.join(httpsDir, crtFileName));
                    if (issuer !== "Let's Encrypt") {
                        return;
                    }
                }

                let portals = yield apiSystemManager.get("portal/get", req);
                const settings = yield apiSystemManager.get("settings/get?tenantId=-1&key=BaseDomain", req);
                portals = portals.tenants.filter((item) => item.portalName !== "localhost").map((item) => item.domain);
                if (settings && settings.settings) {
                    const baseDomain = settings.settings;
                    if (baseDomain !== "localhost") {
                        portals.unshift(baseDomain);
                    }
                } else {
                    portals.unshift(req.headers.host);
                }

                yield executeHelper('tools/letsencrypt.sh', csContainer, productName, path.join(config.getProductDir("httpsDir"), config.get("web:https")), fileManager.getDataDirPath('', false), ...portals);
            })
            .catch((err) => {
                log.error(err);
                return;
            });
    }

    validateIPaddress(ipaddress) {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress);
    }
}

module.exports = new BaseController();