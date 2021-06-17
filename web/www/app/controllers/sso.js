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


(function() {
    'use strict';

    const baseController = require('./base.js'),
        router = require('express').Router(),
        Model = require('../model/sso.js'),
        apiRequestManager = require('../apiRequestManager.js').apiManager,
        pug = require('pug'),
        path = require('path'),
        fs = require('fs'),
        formidable = require('formidable'),
        ssoCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'sso.pug')),
        portalManager = require('../portalManager.js'),
        fileManager = require('../fileManager.js'),
        config = require('../../config');

    function uploadMetadata(req, res) {
        function formParse(err, fields, files) {

            if (err) {
                res.status(500).send(err).end();
                return;
            }

            if (!files || !files.metadata) {
                res.status(500).send(req.resources.cpSsoResource.SsoMetadataFileNotTransfered).end();
                return;
            }

            if (!files.metadata.name.toLowerCase().endsWith(".xml")) {
                fileManager.deleteFile(files.metadata.path);
                res.status(500).send(req.resources.controlPanelResource.SsoMetadataFileTypeError).end();
                return;
            }

            var params = {
                method: "POST",
                formData: { 
                    metadata: null
                },
                json: true
            };

            params.formData.metadata = fs.createReadStream(files.metadata.path);
            params.formData.metadata.name = files.metadata.name;

            fileManager.deleteFile(files.metadata.path);

            apiRequestManager.makeRequest(portalManager.getAbsolutePortalUrl('sso/uploadmetadata'), req, params)
                .then(onSuccess.bind(null, res))
                .catch(onError.bind(null, res));
        }

        const form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;
        form.parse(req, formParse);
    }

    function onSuccess(response, result) {
        response.status(200);

        if (typeof result === "string") {
            response.send({ "data": result });
            return;
        }

        response.send(result);
    }

    function onError(response, error) {
        response.status(500);
        response.send(error);
    }

    let uploadDir = "";

    router
        .use(require('../middleware/quota.js')("sso"))
        .get("/", (req, res) => {
            res.setHeader('content-type', 'text/html');
            const data = new Model(req, req.resources.controlPanelResource.Sso);
            const folderPromise = fileManager.getDataDirPath();
            const currentSettingsPromise = apiRequestManager.get("settings/ssov2", req);
            const defaultSettingsPromise = apiRequestManager.get("settings/ssov2/default", req);
            const constantsPromise = apiRequestManager.get("settings/ssov2/constants", req);

            Promise.all([folderPromise, currentSettingsPromise, defaultSettingsPromise, constantsPromise])
                .then((result) => {
                    uploadDir = result[0];
                    Object.assign(data, {
                        currentSettings: result[1],
                        defaultSettings: result[2],
                        constants: result[3],
                        metadata: config.get("sso")
                    });
                    res.end(ssoCompiled(data));
                })
                .catch((error) => {
                    data.errorMessage = error.message;
                    res.end(ssoCompiled(data));
                });
        })
        .get("/settings", baseController.get.bind(baseController, 'settings/ssov2.json'))
        .post("/settings", baseController.post.bind(baseController, 'settings/ssov2.json'))
        .delete("/settings", baseController.dlt.bind(baseController, 'settings/ssov2.json'))

        .post("/uploadmetadata", uploadMetadata)
        .post("/loadmetadata", baseController.post.bind(baseController, portalManager.getAbsolutePortalUrl('sso/loadmetadata')))
        .post("/validatecerts", baseController.post.bind(baseController, portalManager.getAbsolutePortalUrl('sso/validatecerts')))
        .get("/generatecert", baseController.get.bind(baseController, portalManager.getAbsolutePortalUrl('sso/generatecert')));


    module.exports = router;
})();