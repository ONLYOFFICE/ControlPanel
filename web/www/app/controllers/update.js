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


const router = require('express').Router(),
    Model = require('../model/update.js'),
    updateActionType = require('../model/updateActionType.js'),
    pug = require('pug'),
    path = require('path'),
    updateCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'update.pug')),
    fullAccess = require('../middleware/fullAccess.js');

const config = require("../../config");

let updateList = [], ongetUpdatesDate = new Date();
const cacheMinutes = 15;

function ongetUpdates(req, res) {
    let list = updateList.map(item => Object.assign({}, item)).filter(obj => (delete obj.cpResource));
    res.send({
        updateList: list,
        updateAvailable: list.some((item) => item.currentVersion !== "" && item.updateActionType !== 0),
        updateQueueItems: list.filter((item) => item.updateAction.started)
    });
    res.end();
}

router
    .use(fullAccess())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(updateCompiled(new Model(req, req.resources.controlPanelResource.Update)));
    })
    .get("/getUpdates", (req, res) => {
        if ((new Date() - ongetUpdatesDate) > cacheMinutes * 60 * 1000) {
            updateList = [];
        }

        if (updateList.length) {
            ongetUpdates(req, res);
            return;
        }

        Model.getItems(req)
            .then((result) => {
                updateList = result.filter((item) => item.currentVersion || item.newVersion || config.isOfflineMode);
                ongetUpdatesDate = new Date();
                ongetUpdates(req, res);
            })
            .catch((err) => {
                res.end();
            });
    })
    .post("/start", (req, res) => {
        const updateStarted = updateList.some((item) => item.updateAction.started && (item.updateAction.type == updateActionType.Update || item.updateAction.type == updateActionType.Install));
        if (updateStarted) {
            res.send({ success: false, message: req.resources.controlPanelResource.ErrorUpdateAlreadyStarted });
            res.end();
        }
        const updateItem = updateList.find((item) => item.serverType == req.body.serverType);
        if (req.body.domainName) {
            updateItem.domainName = req.body.domainName;
        }
        updateItem.start(req);
        res.send({ success: true, message: "" });
        res.end();
    });

module.exports = router;