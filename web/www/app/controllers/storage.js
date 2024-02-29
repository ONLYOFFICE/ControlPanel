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
    Model = require('../model/base.js'),
    pug = require('pug'),
    path = require('path'),
    storageCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'storage.pug')),
    fullAccess = require('../middleware/fullAccess.js'),
    notCustomMode = require('../middleware/notCustomMode.js'),
    apiSystemManager = require('../apiRequestManager.js').apiSystemManager;

function onError(response, error) {
    response.status(500);
    response.send(error);
}
function onSuccess(response, result) {
    response.send({
        success: true,
        data: result
    });
    response.end();
}

router
    .use(fullAccess())
    .use(notCustomMode())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(storageCompiled(new Model(req, req.resources.controlPanelResource.Storage)));
    })
    .get("/getAllStorages", baseController.get.bind(baseController, 'settings/storage.json'))
    .get("/getAllCdnStorages", baseController.get.bind(baseController, 'settings/storage/cdn.json'))
    .get("/encryptionSettings", baseController.get.bind(baseController, 'settings/encryption/settings.json'))
    .get("/getLinkedPortals", (req, res) => {
        apiSystemManager.get("portal/get", req)
            .then((result) => { onSuccess(res, result); })
            .catch((error) => { onError(res, error); });
    })
    .put("/quota", (req, res) => {
        req.body.features = req.session.quota.features;

        apiSystemManager.put("tariff/set", req)
            .then((result) => { onSuccess(res, result); })
            .catch((error) => { onError(res, error); });
    })
    .put("/setTenantQuotaSettings", baseController.put.bind(baseController, 'settings/tenantquotasettings'))
    .put("/updateStorage", baseController.put.bind(baseController, 'settings/storage.json'))
    .put("/updateCdnStorage", baseController.put.bind(baseController, 'settings/storage/cdn.json'))
    .delete("/resetStorageToDefault", baseController.dlt.bind(baseController, 'settings/storage.json'))
    .delete("/resetCdnStorageToDefault", baseController.dlt.bind(baseController, 'settings/storage/cdn.json'))
    .post("/encryptionStart", baseController.post.bind(baseController, 'settings/encryption/start.json'));

module.exports = router;