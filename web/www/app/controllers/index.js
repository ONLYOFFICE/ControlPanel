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
    portalManager = require('../portalManager.js'),
    apiRequestManager = require('../apiRequestManager.js').apiManager,
    BaseModel = require('../model/base.js'),
    pug = require('pug'),
    path = require('path'),
    co = require('co');

const indexCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'index.pug'));

function setPortalUrl(req, res) {
    const body = req.body;
    co(function* () {
        yield portalManager.setPortalUrl(body);
        const response = yield apiRequestManager.post('authentication.json', req);
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        res.cookie('asc_auth_key', response.token, { expires: expires });
        res.status(200);
        res.send({ success: typeof response.token === "string" && response.token.length });
        res.end();
    }).catch((error) => {
        res.status(200);
        res.send({ success: false, message: error });
    });
}

router
    .get('/', (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(indexCompiled(new BaseModel(req, req.resources.controlPanelResource.AuthTitle)));
    })
    .post('/', setPortalUrl);
module.exports = router;