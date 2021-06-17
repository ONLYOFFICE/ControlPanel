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
    Model = require('../model/rebranding.js'),
    pug = require('pug'),
    path = require('path'),
    giftCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'gift.pug')),
    fullAccess = require('../middleware/fullAccess.js'),
    tenantExtra = require('../middleware/tenantExtra.js'),
    apiManager = require('../apiRequestManager.js').apiManager,
    additionalSettingsApiUrl = "settings/rebranding/additional.json",
    mailSettingsApiUrl = "settings/rebranding/mail.json";

router
    .use(fullAccess())
    .use(tenantExtra())
    .get("/", (req, res) => {
        if (req.session.tenantExtra.enterprise) {
            res.status(403);
            res.end();
            return;
        }

        res.setHeader('content-type', 'text/html');

        const data = new Model(req, req.resources.controlPanelResource.Gift);
        const additionalSettingsPromise = apiManager.get(additionalSettingsApiUrl, req);
        const mailSettingsPromise = apiManager.get(mailSettingsApiUrl, req);

        Promise.all([additionalSettingsPromise, mailSettingsPromise])
            .then((result) => {
                Object.assign(data, {
                    additionalSettings: result[0],
                    mailSettings: result[1]
                });
                res.end(giftCompiled(data));
            })
            .catch((error) => {
                data.errorMessage = error.message;
                res.end(giftCompiled(data));
            });
    });

module.exports = router;