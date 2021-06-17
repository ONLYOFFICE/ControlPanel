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
    privacyRoomCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'privacyRoom.pug')),
    tenantExtra = require('../middleware/tenantExtra.js'),
    notCustomMode = require('../middleware/notCustomMode.js');

router
    .use(require('../middleware/quota.js')("privacyroom"))
    .use(tenantExtra())
    .use(notCustomMode())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(privacyRoomCompiled(new Model(req, req.resources.controlPanelResource.PrivacyRoom)));
    })
    .get("/getEncryptionStatus", baseController.get.bind(baseController, 'privacyroom.json'))
    .put("/setEncryptionStatus", baseController.put.bind(baseController, 'privacyroom.json'));

module.exports = router;