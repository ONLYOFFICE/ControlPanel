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


const 
    router = require('express').Router(),
    Model = require('../model/base.js'),
    pug = require('pug'),
    path = require('path'),
    contactCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'contactSupport.pug')),
    formidable = require('formidable'),
    fileManager = require('../fileManager.js');

let uploadDir = "";

router
    .use(require('../middleware/quota.js')("support"))
    .get("/", (req, res) => {
        fileManager.getDataDirPath()
            .then((result) => {
                uploadDir = result;
                res.setHeader('content-type', 'text/html');
                res.end(contactCompiled(new Model(req, req.resources.controlPanelResource.ContactSupport)));
            });

    })
    .post("/uploadAttachments", (req, res) => {
        const form = new formidable.IncomingForm();
        form.uploadDir = result;

        form.parse(req, (err, fields, files) => {
            res.status(200);
            const uploaded = files["attachments"];

            if (err || !uploaded) {
                res.send({ success: false });
                res.end();
                return;
            }
            const filePath = path.join(form.uploadDir, uploaded.name);

            fileManager.moveFile(uploaded.path, filePath)
                .then(() => {
                    res.send({ success: true, filePath: uploaded.name });
                    res.end();
                })
                .catch((ex) => {
                    res.send({ success: false });
                    res.end();
                });
        });
    });

module.exports = router;