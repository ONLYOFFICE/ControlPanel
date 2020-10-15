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


const baseController = require('./base.js'),
    router = require('express').Router(),
    Model = require('../model/base.js'),
    pug = require('pug'),
    path = require('path'),
    auditCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'audittrail.pug'));

router
    .use(require('../middleware/quota.js')("audit"))
    .get("/", function (req, res) {
        res.setHeader('content-type', 'text/html');
        res.end(auditCompiled(new Model(req, req.resources.controlPanelResource.AuditTrail)));
    })
    .get("/getEvents", baseController.get.bind(baseController, 'security/audit/events/last.json'))
    .post("/createReport", baseController.post.bind(baseController, 'security/audit/events/report.json'));

module.exports = router;