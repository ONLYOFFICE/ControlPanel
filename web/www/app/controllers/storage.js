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
    notCustomMode = require('../middleware/notCustomMode.js');

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
    .put("/updateStorage", baseController.put.bind(baseController, 'settings/storage.json'))
    .put("/updateCdnStorage", baseController.put.bind(baseController, 'settings/storage/cdn.json'))
    .delete("/resetStorageToDefault", baseController.dlt.bind(baseController, 'settings/storage.json'))
    .delete("/resetCdnStorageToDefault", baseController.dlt.bind(baseController, 'settings/storage/cdn.json'))
    .post("/encryptionStart", baseController.post.bind(baseController, 'settings/encryption/start.json'));

module.exports = router;