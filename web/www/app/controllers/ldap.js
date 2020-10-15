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


const baseController = require('./base.js');
const Model = require('../model/ldap.js');
const apiRequestManager = require('../apiRequestManager.js').apiManager;
const pug = require('pug');
const path = require('path');
const ldapCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'ldap.pug'));
const router = require('express').Router();
const log = require('../log.js');

function getStatus(req, res) {
    apiRequestManager.get('settings/ldap/status', req)
        .then((result) => {
            log.info("settings/ldap/status", result);
            if (!result) {
                res.statusCode = 200;
                res.end();
                return;
            }

            if (result.error) {
                if(result.certificateConfirmRequest && result.certificateConfirmRequest.certificateErrors) {
                    var errors = result.certificateConfirmRequest.certificateErrors
                        .map((item) => Model.mapError(item, req.resources.cpLdapResource));
                    result.certificateConfirmRequest.certificateErrors = errors;
                }
            }

            res.statusCode = 200;
            res.send(result);
        })
        .catch((error) => {
            res.end();
        });
}

router
    .use(require('../middleware/quota.js')("ldap"))
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        const data = new Model(req, req.resources.controlPanelResource.Ldap);
        apiRequestManager.get("settings/ldap", req)
            .then((result) => {
                Object.assign(data, result);
                return apiRequestManager.get("settings/ldap/cron", req);
            }).then((result) => {
                data.cron = Object.keys(result).length === 0 ? "" : result;
                res.end(ldapCompiled(data));
            }).catch((error) => {
                data.errorMessage = error;
                res.end(ldapCompiled(new Model(req, req.resources.controlPanelResource.Ldap)));
            });
    })
    .get("/defaultSettings", baseController.get.bind(baseController, 'settings/ldap/default'))
    .get("/sync", baseController.get.bind(baseController, 'settings/ldap/sync'))
    .post("/settings", (req, res) => {
        apiRequestManager.makeRequest("settings/ldap", req,
            {
                method: "POST",
                body: {
                    settings: JSON.stringify(req.body.settings),
                    acceptCertificate: !!req.body.acceptCertificate
                },
                json: true
            })
            .then((result) => {
                res.status(200);
                res.send(result);
            })
            .catch((error) => {
                res.status(500);
                res.send(error);
            });
    })
    .post("/cron", (req, res) => {
        apiRequestManager.makeRequest("settings/ldap/cron", req,
            {
                method: "POST",
                body: {
                    cron: req.body.cron
                },
                json: true
            })
            .then((result) => {
                res.status(200);
                res.send(result);
            })
            .catch((error) => {
                res.status(500);
                res.send(error);
            });
    })
    .get("/status", getStatus);

module.exports = router;