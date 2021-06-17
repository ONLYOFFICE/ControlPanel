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


const formidable = require('formidable');
const router = require('express').Router();
const path = require('path');
const httpsCompiled = require('pug').compileFile(path.join(__dirname, '..', '..', 'views', 'httpsWin.pug'));
const Model = require('../model/base.js');
const baseController = require('./base.js');
const fullAccess = require('../middleware/fullAccess.js');

function upload(req, res, ext) {
    const form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        res.status(200);
        const uploaded = files["files[]"];

        if (err || !uploaded || !uploaded.name.endsWith(ext)) {
            res.send({ success: false });
            res.end();
            return;
        }
        res.send({ success: true, file: uploaded.path });
        res.end();
    });
}

router
    .use(fullAccess())
    .get("/", (req, res) => {
        const data = new Model(req, req.resources.controlPanelResource.Https);
        res.setHeader('content-type', 'text/html');
        res.end(httpsCompiled(data));
    })
    .post("/processUpload", (req, res) => { upload(req, res, ".pfx"); })
    .get("/checkAttachment", baseController.get.bind(baseController, 'settings/https/check.json'))
    .post("/uploadCertificate", baseController.put.bind(baseController, 'settings/https/upload.json'));

module.exports = router;