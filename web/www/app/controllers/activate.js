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


const router = require('express').Router(),
    Model = require('../model/rebranding.js')
    pug = require('pug'),
    path = require('path'),
    activateCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'activate.pug')),
    fullAccess = require('../middleware/fullAccess.js'),
    tenantExtra = require('../middleware/tenantExtra.js'),
    enableTariffPage = require('../middleware/enableTariffPage.js'),
    arm = require('../apiRequestManager.js'),
    apiSystemManager = arm.apiSystemManager,
    apiManager = arm.apiManager,
    formidable = require('formidable'),
    fs = require('fs'),
    moment = require('moment');

const cacheMinutes = 15;
let onGetComponentsDate = new Date();
let components = null;
let quotaUsers = null;

function uploadLicense(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        let licenseFile = files["license"];

        let params = {
            method: "POST",
            formData: {
                file: fs.createReadStream(licenseFile.filepath)
            },
            json: true
        };

        apiManager.makeRequest("portal/uploadlicense", req, params)
            .then((result) => {
                result.data = licenseFile.originalFilename;
                res.send(result);
                res.end();
            })
            .catch((error) => {
                res.send({ success: false, message: error });
                res.end();
            });
    });
}

function activateLicense(req, res) {
    apiManager.post("portal/activatelicense.json", req)
        .then((result) => {
            if (result.success) {
                result.message = req.resources.controlPanelResource.ActivateLicenseActivated
                req.session.quota = null;
                req.session.tariff = null;
            }
            res.send(result);
            res.end();
        })
        .catch((error) => {
            res.send({ success: false, message: error });
            res.end();
        });
}

function getReport(req, res) {
    const filename = req.resources.controlPanelResource.format("ActivateReportFileName", moment().format("L LTS"));

    let content = req.resources.controlPanelResource.ActivateReportFileHeader + "\n";

    for (let prop in req.session.tenantExtra.docServerUserQuota) {
        let date = moment.utc(req.session.tenantExtra.docServerUserQuota[prop]).format('L LTS');
        let user = quotaUsers.find(item => item.id === prop);
        if (user) {
            content += user.id + "," + user.name + "," + user.email + "," + user.link + "," + date + "\n";
        } else {
            content += prop + ",,,," + date + "\n";
        }
    }

    const params = {
        method: "POST",
        body: Buffer.from(content, "utf8")
    };

    apiManager.makeRequest("files/@my/insert?createNewIfExist=true&title=" + encodeURIComponent(filename), req, params)
        .then((result) => {
            res.send({ success: true, url: result.webUrl });
            res.end();
        })
        .catch((error) => {
            res.send({ success: false, message: error });
            res.end();
        });
}

router
    .use(fullAccess())
    .use(tenantExtra())
    .use(enableTariffPage())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');

        const title = (req.session.tenantExtra.enterprise && !(req.session.tenantExtra.trial || req.session.tenantExtra.defaultTariff))
            ? req.resources.controlPanelResource.ActivateRenewSubscription : req.resources.controlPanelResource.ActivateUpgradeToEnterprise;

        const data = new Model(req, title);
        const additionalSettingsPromise = apiManager.get("settings/rebranding/additional.json", req);
        const mailSettingsPromise = apiManager.get("settings/rebranding/mail.json", req);

        const userIds = req.session.tenantExtra.docServerUserQuota ? Object.keys(req.session.tenantExtra.docServerUserQuota) : [];

        const findPeoplePromise = apiSystemManager.makeRequest("people/find", req,
        {
            method: "POST",
            body: userIds,
            json: true
        });

        Promise.all([additionalSettingsPromise, mailSettingsPromise, findPeoplePromise])
            .then((result) => {
                quotaUsers = result[2];

                Object.assign(data, {
                    additionalSettings: result[0],
                    mailSettings: result[1],
                    docServerUserQuotaLength: userIds.length,
                    docServerUsersCount: quotaUsers.length
                });

                if (req.session.tenantExtra.enterprise) {
                    data.documentServerInstalled = true;
                    res.end(activateCompiled(data));
                } else {

                    if ((new Date() - onGetComponentsDate) > cacheMinutes * 60 * 1000) {
                        components = null;
                    }

                    if (components != null) {
                        data.documentServerInstalled = components.documentServer != null;
                        res.end(activateCompiled(data));
                        return;
                    }

                    apiManager.get("settings/version/build.json", req)
                        .then((result) => {
                            components = result;
                            onGetComponentsDate = new Date();
                            data.documentServerInstalled = components.documentServer != null;
                            res.end(activateCompiled(data));
                        })
                        .catch((error) => {
                            data.errorMessage = error.message;
                            res.end(activateCompiled(data));
                        });
                }
            })
            .catch((error) => {
                data.errorMessage = error.message;
                res.end(activateCompiled(data));
            });
    })
    .post("/uploadlicense", uploadLicense)
    .post("/activatelicense", activateLicense)
    .get("/report", getReport);

module.exports = router;