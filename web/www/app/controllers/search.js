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
    searchCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'search.pug')),
    fullAccess = require('../middleware/fullAccess.js');

router
    .use(fullAccess())
    .get("/", function (req, res) {
        res.setHeader('content-type', 'text/html');
        res.end(searchCompiled(new Model(req, req.resources.controlPanelResource.Search)));
    })
    .get("/setting", baseController.get.bind(baseController, 'portal/search.json'))
    .get("/state", baseController.get.bind(baseController, 'portal/search/state.json'))
    .post("/setting", baseController.post.bind(baseController, 'portal/search.json'))
    .post("/reindex", baseController.post.bind(baseController, 'portal/search/reindex.json'));

module.exports = router;