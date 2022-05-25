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


const baseController = require('./base.js'),
    router = require('express').Router(),
    Model = require('../model/rebranding.js'),
    pug = require('pug'),
    apiManager = require('../apiRequestManager.js').apiManager,
    path = require('path'),
    rebrandingCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'rebranding.pug')),
    companySettingsApiUrl = "settings/rebranding/company.json",
    additionalSettingsApiUrl = "settings/rebranding/additional.json",
    mailSettingsApiUrl = "settings/rebranding/mail.json",
    fullAccess = require('../middleware/fullAccess.js'),
    tenantExtra = require('../middleware/tenantExtra.js'),
    notCustomMode = require('../middleware/notCustomMode.js');

router
    .use(fullAccess())
    .use(tenantExtra())
    .use(notCustomMode())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');

        const data = new Model(req, req.resources.controlPanelResource.WhiteLabel);
        const companySettingsPromise = apiManager.get(companySettingsApiUrl, req);
        const additionalSettingsPromise = apiManager.get(additionalSettingsApiUrl, req);
        const mailSettingsPromise = apiManager.get(mailSettingsApiUrl, req);

        Promise.all([companySettingsPromise, additionalSettingsPromise, mailSettingsPromise])
            .then((result) => {
                Object.assign(data, {
                    companySettings: result[0],
                    additionalSettings: result[1],
                    mailSettings: result[2]
                });
                res.end(rebrandingCompiled(data));
            })
            .catch((error) => {
                data.errorMessage = error.message;
                res.end(rebrandingCompiled(data));
            });
    })
    .post("/company", baseController.post.bind(baseController, companySettingsApiUrl))
    .post("/additional", baseController.post.bind(baseController, additionalSettingsApiUrl))
    .post("/mail", baseController.post.bind(baseController, mailSettingsApiUrl))
    .delete("/company", baseController.dlt.bind(baseController, companySettingsApiUrl))
    .delete("/additional", baseController.dlt.bind(baseController, additionalSettingsApiUrl))
    .delete("/mail", baseController.dlt.bind(baseController, mailSettingsApiUrl))
    .put("/mail", baseController.put.bind(baseController, mailSettingsApiUrl));

module.exports = router;