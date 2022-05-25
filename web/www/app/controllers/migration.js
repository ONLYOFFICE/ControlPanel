const {
    error
} = require('console');

const apiRequestManager = require('../apiRequestManager.js').apiManager,
    router = require('express').Router(),
    Model = require('../model/base.js'),
    pug = require('pug'),
    path = require('path'),
    migrationCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'migration.pug')),
    fileManager = require('../fileManager'),
    formidable = require('formidable'),
    co = require('co'),
    config = require('../../config'),
    migrateFolder = config.get("migration"),
    log = require("../log.js"),
    portalManager = require('../portalManager.js'),
    csContainer = config.get("docker:CommunityServer:container"),
    executeHelper = require('../executeHelper.js');

function upload(req, res, ext) {
    const form = new formidable.IncomingForm();
    fileManager.getDataDirPath(migrateFolder).then((result) => {
        form.uploadDir = result;
        form.parse(req, function (err, fields, files) {
            co(function* () {
                const uploaded = files["files[]"];
                const resPath = path.join(form.uploadDir, uploaded.name);

                if (err || !uploaded || !uploaded.name.endsWith(ext)) {
                    res.send({
                        success: false
                    });
                    res.end();
                    return;
                }

                yield fileManager.copyFile(uploaded.path, resPath, true);
                yield fileManager.deleteFile(uploaded.path);

                res.send({
                    success: true,
                    file: resPath
                });
                res.end();
            }).catch((err) => {
                log.error("migration upload", err);
                res.status(500);
                res.send({
                    success: false
                });
                res.end();
            });
        });
    });
}

function uploadComplete(req, res) {
    co(function* () {
        const tmpPath = yield apiRequestManager.get("migration/backuptmp", req);
        const uploadedPath = req.body.file;
        const uploadedName = path.basename(uploadedPath);

        let to = path.join(tmpPath, uploadedName);
        let move = config.isMono;
        if (config.isMono) {
            const result = yield executeHelper("tools/check-docker.sh");
            move = result == "true";
        }
        if (move) {
            yield executeHelper('tools/move.sh',
                "-cc", csContainer,
                "-f", uploadedPath,
                "-t", to);
        } else {
            yield fileManager.moveFile(uploadedPath, to);
        }
        res.status(200);
        res.send({
            success: true,
            path: tmpPath,
            name: uploadedName
        });
        res.end();

    }).catch((err) => {
        log.error("migration uploadComplete", err);
        res.status(500);
        res.send({
            success: false
        });
        res.end();
    });
}

function getLogosHandler(req, res) {
    co(function* () {
            const getLogoText = apiRequestManager.get("settings/whitelabel/logotext.json?isDefault=" + req.query.isDefault, req);

            const logoText = yield getLogoText;

            res.send({
                success: true,
                logoText
            });
            res.end();
        })
        .catch((error) => {
            res.send({
                success: false,
                message: error
            });
        });
}

router
    .get("/", function (req, res) {
        res.setHeader('content-type', 'text/html');
        res.end(migrationCompiled(new Model(req, req.resources.controlPanelResource.Migration)));
    })
    .get("/getLogos", getLogosHandler)
    .get("/getBaseUrlDownload", (req, res) => {
        res.send({
            baseUri: portalManager.getExternalPortalUrl(req)
        });
        res.end();
    })
    .get("/status", (req, res) => {
        apiRequestManager.makeRequest("migration/status", req, {
                method: "GET",
                JSON: true
            })
            .then((result) => {
                res.send(result);
            })
            .catch((error) => {
                res.statusCode = 500;
                log.error("migration status", error);
                res.send(error);
            });
    })
    .post("/finish", (req, res) => {
        apiRequestManager.makeRequest("migration/finish", req, {
                method: "POST",
                body: {
                    isSendWelcomeEmail: !!req.body.isSendWelcomeEmail
                },
                json: true
            })
            .catch((error) => {
                log.error("migration cancel", error);
                res.send(error);
            });
        res.send({
            success: true
        });
        res.end();
    })
    .post("/cancel", (req, res) => {
        apiRequestManager.makeRequest("migration/cancel", req, {
                method: "POST",
                JSON: true
            })
            .catch((error) => {
                log.error("migration cancel", error);
                res.send(error);
            });
        res.send({
            success: true
        });
        res.end();
    })
    .post("/upload", (req, res) => {
        upload(req, res, ".zip");
    })
    .post("/uploadComplete", (req, res) => {
        uploadComplete(req, res);
    })
    .post("/migrate", (req, res) => {
        apiRequestManager.makeRequest("migration/migrate", req, {
                method: "POST",
                body: {
                    info: req.body.info
                },
                json: true
            })
            .catch((error) => {
                log.error("migration migrate", error);
                res.send(error);
            });
        res.send({
            success: true
        });
        res.end();
    })
    .post("/NextcloudMigrate", (req, res) => {
        apiRequestManager.makeRequest("migration/init/NextcloudMigrate", req, {
                method: "POST",
                body: {
                    path: req.body.path
                },
                json: true
            })
            .catch((error) => {
                log.error("migration NextcloudMigrate ", error);
                res.send(error);
            });
        res.end();
    })
    .post("/OwncloudMigrate", (req, res) => {
        apiRequestManager.makeRequest("migration/init/OwncloudMigrate", req, {
                method: "POST",
                body: {
                    path: req.body.path
                },
                json: true
            })
            .catch((error) => {
                log.error("migration OwncloudMigrate ", error);
                res.send(error);
            });
        res.end();
    })
    .post("/GoogleWorkspace", (req, res) => {
        apiRequestManager.makeRequest("migration/init/GoogleWorkspace", req, {
                method: "POST",
                body: {
                    path: req.body.path
                },
                json: true
            })
            .catch((error) => {
                log.error("migration GoogleWorkspace", error);
                res.send(error);
            });
        res.end();
    });

module.exports = router;