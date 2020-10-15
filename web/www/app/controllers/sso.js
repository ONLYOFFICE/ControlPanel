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


(function() {
    'use strict';

    const baseController = require('./base.js'),
        router = require('express').Router(),
        Model = require('../model/sso.js'),
        apiRequestManager = require('../apiRequestManager.js').apiManager,
        pug = require('pug'),
        path = require('path'),
        ssoCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'sso.pug')),
        samlify = require("samlify"),
        formidable = require('formidable'),
        fileManager = require('../fileManager.js'),
        forge = require('node-forge'),
        config = require('../../config'),
        uuid = require('uuid'),
        fs = require('fs');

    let uploadDir = "";

    const selfSignedDomain = "myselfsigned.crt";

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

            const idp = samlify.IdentityProvider({
                metadata: fs.readFileSync(files.metadata.path)
            });
            const idpMetadata = idp.entityMeta;

            if (!idpMetadata ||
                !idpMetadata.meta ||
                !idpMetadata.meta.entityDescriptor ||
                !idpMetadata.meta.singleSignOnService) {
                fileManager.deleteFile(files.metadata.path);
                res.status(500).send(req.resources.cpSsoResource.SsoInvalidMetadataFile).end();
                return;
            }

            fileManager.deleteFile(files.metadata.path);
            res.status(200).send(idpMetadata).end();
        }

        const form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;
        form.parse(req, formParse);
    }

    function generateCertificate() {
        const pki = forge.pki;

        let keys = pki.rsa.generateKeyPair(2048);
        let cert = pki.createCertificate();

        cert.publicKey = keys.publicKey;
        cert.serialNumber = "01";
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        let attr = [{
            name: "commonName",
            value: selfSignedDomain
        }];

        cert.setSubject(attr);
        cert.setIssuer(attr);

        cert.sign(keys.privateKey);

        let crt = pki.certificateToPem(cert);
        let key = pki.privateKeyToPem(keys.privateKey);

        return {
            crt: crt,
            key: key
        };
    }

    function validateCertificate(certs) {
        const result = [];
        const pki = forge.pki;

        certs.forEach(function (data) {
            if (!data.crt)
                throw "Empty public certificate";

            if (data.crt[0] !== "-")
                data.crt = "-----BEGIN CERTIFICATE-----\n" + data.crt + "\n-----END CERTIFICATE-----";

            const cert = pki.certificateFromPem(data.crt);

            const publicKey = cert.publicKey;
            if (!publicKey)
                throw "Invalid public cert";

            if (data.key) {
                const privateKey = pki.privateKeyFromPem(data.key);
                if (!privateKey)
                    throw "Invalid private key";

                const md = forge.md.sha1.create();
                md.update('sign this', 'utf8');
                const signature = privateKey.sign(md);

                // verify data with a public key
                // (defaults to RSASSA PKCS#1 v1.5)
                const verified = publicKey.verify(md.digest().bytes(), signature);

                if (!verified)
                    throw "Invalid key-pair (unverified signed data test)";
            }

            const domainName = cert.subject.getField("CN").value || cert.issuer.getField("CN").value;
            const startDate = cert.validity.notBefore.toISOString().split(".")[0] + "Z";
            const expiredDate = cert.validity.notAfter.toISOString().split(".")[0] + "Z";

            result.push({
                selfSigned: domainName === selfSignedDomain,
                crt: data.crt,
                key: data.key,
                action: data.action,
                domainName: domainName,
                startDate: startDate,
                expiredDate: expiredDate
            });
        });

        return result;
    }

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
        .post("/loadmetadata", (req, res) => {
            try {
                const filePath = path.join(uploadDir, uuid.v1() + ".xml");

                fileManager.downloadFile(req.body.url, filePath)
                    .then((result) => {
                        const idp = samlify.IdentityProvider({
                            metadata: fs.readFileSync(result)
                        });
                        const idpMetadata = idp.entityMeta;

                        if (!idpMetadata ||
                            !idpMetadata.meta ||
                            !idpMetadata.meta.entityDescriptor ||
                            !idpMetadata.meta.singleSignOnService) {
                            fileManager.deleteFile(result);
                            res.status(500).send(req.resources.cpSsoResource.SsoInvalidMetadataFile).end();
                            return;
                        }

                        fileManager.deleteFile(result);
                        res.status(200).send(idpMetadata).end();
                    })
                    .catch((error) => {
                        fileManager.deleteFile(filePath);
                        res.status(500).send(req.resources.cpSsoResource.SsoMetadataFileNotTransfered);
                    });
            }
            catch (error) {
                res.status(500).send(error);
            }
        })
        .post("/validatecerts", (req, res) => {
            try {
                res.status(200).send(validateCertificate(req.body.certs));
            }
            catch (error) {
                res.status(500).send(req.resources.cpSsoResource.SsoInvalidCertificate);
            }
        })
        .get("/generatecert", (req, res) => {
            try {
                res.status(200).send(generateCertificate());
            }
            catch (error) {
                res.status(500).send(req.resources.cpSsoResource.SsoCannotGenerateCertificate);
            }
        });

    module.exports = router;
})();