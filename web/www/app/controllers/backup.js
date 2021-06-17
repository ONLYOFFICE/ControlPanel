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
    Model = require('../model/backup.js'),
    pug = require('pug'),
    path = require('path'),
    backupCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'backup.pug')),
    fullAccess = require('../middleware/fullAccess.js');

router
    .use(fullAccess())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(backupCompiled(new Model(req, req.resources.controlPanelResource.Backup)));
    })
    .get("/getThirdParty", baseController.get.bind(baseController, 'files/thirdparty/common.json'))
    .get("/getSchedule", baseController.get.bind(baseController, 'portal/getbackupschedule.json'))
    .get("/getProgress", baseController.get.bind(baseController, 'portal/getBackupProgress.json'))
    .get("/getFoldersInCommonFolder",
        baseController.get.bind(baseController,
            'files/@common.json?filterType=2&userIdOrGroupId=00000000-0000-0000-0000-000000000000'))
    .get("/getFolderPath", (req, res) => {
        baseController.get('files/folder/' + req.query.folderId + '/path.json', req, res);
    })
    .get("/getStorages", baseController.get.bind(baseController, 'settings/storage/backup.json'))
    .get("/getAllThirdParty", baseController.get.bind(baseController, 'files/thirdparty/capabilities.json'))
    .post("/createSchedule", baseController.post.bind(baseController, 'portal/createbackupschedule.json'))
    .post("/start", baseController.post.bind(baseController, 'portal/startbackup.json'))
    .delete("/deleteSchedule", baseController.dlt.bind(baseController, 'portal/deletebackupschedule.json'));

module.exports = router;