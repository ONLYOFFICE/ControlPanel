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
    formidable = require('formidable'),
    co = require('co'),
    pug = require('pug'),
    path = require('path'),

    apiRequestManager = require('../apiRequestManager.js').apiManager,
    Model = require('../model/base.js'),
    restoreCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'restore.pug')),
    fileManager = require('../fileManager'),
    executeHelper = require('../executeHelper.js'),
    config = require('../../config'),
    restoreFolder = config.get("restore"),
    csContainer = config.get("docker:CommunityServer:container"),
    fullAccess = require('../middleware/fullAccess.js');

function upload(req, res, ext) {
    const form = new formidable.IncomingForm();
    fileManager.getDataDirPath(restoreFolder).then((result) =>
    {
        form.uploadDir = result;
        form.parse(req, function (err, fields, files) {
            co(function*() {
                const uploaded = files["backup"];
                const resPath = path.join(form.uploadDir, uploaded.name);

                yield fileManager.copyFile(uploaded.path, resPath, true);
                yield fileManager.deleteFile(uploaded.path);
                
                if (err || !uploaded || !uploaded.name.endsWith(ext)) {
                    res.send({ success: false });
                    res.end();
                    return;
                }

                res.send({ success: true, file: resPath });
                res.end();
            }).catch(() =>{
                res.status(500);
                res.send({ success: false });
                res.end();
            });
        });
    });
}

function uploadComplete(req, res) {
        co(function*() {
            const tmpPath = yield apiRequestManager.get("portal/backuptmp", req);
            const uploadedPath = req.body.file;
            const uploadedName = path.basename(uploadedPath);

            let to = path.join(tmpPath, uploadedName);
            let move = config.isMono;
            if(config.isMono){
                const result = yield executeHelper("tools/check-docker.sh");
                move = result == "true";
            }
            if(move){
                yield executeHelper('tools/move.sh', 
                "-cc", csContainer, 
                "-f", uploadedPath, 
                "-t", to);
            }
            else{
                yield fileManager.moveFile(uploadedPath, to);
            }
            res.status(200);
            res.send({ success: true, path: to, name: uploadedName });
            res.end();

        }).catch(() =>{
            res.status(500);
            res.send({ success: false });
            res.end();
        });
}

router
    .use(fullAccess())
    .get("/", function (req, res) {
        res.setHeader('content-type', 'text/html');
        res.end(restoreCompiled(new Model(req, req.resources.controlPanelResource.Restore)));
    })
    .get("/getAllThirdParty", baseController.get.bind(baseController, 'files/thirdparty/capabilities.json'))
    .get("/getBackupHistory", baseController.get.bind(baseController, 'portal/getbackuphistory.json'))
    .get("/getProgress", baseController.get.bind(baseController, 'portal/getRestoreProgress.json'))

    .post("/start", baseController.post.bind(baseController, 'portal/startRestore.json'))
    .post("/upload", (req, res) => {
        upload(req, res, ".tar.gz");
    })
    .post("/uploadComplete", (req, res) => {
        uploadComplete(req, res);
    })
    .delete("/deleteBackup",
    function (req, res) {
        baseController.dlt('portal/deletebackup/' + req.body.backupId + '.json', req, res);
    })
    .delete("/deleteBackupHistory", baseController.dlt.bind(baseController, 'portal/deletebackuphistory.json'));

module.exports = router;