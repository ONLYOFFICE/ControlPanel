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


const baseModel = require('./base.js');
const config = require("../../config");
const executeHelper = require("../executeHelper.js");
const semver = require("semver");
const updateActionType = require('./updateActionType.js');
const updateActionFactory = require('./updateAction.js');
const log = require("../log.js");
const fileManager = require("../fileManager.js");
const apiRequestManager = require("../apiRequestManager.js").apiManager;
const request = require("request");
const co = require("co");

let imagePath = "";

fileManager.getDataDirPath(config.get("web:image-path"))
    .then((result) => {
        imagePath = result;
    });

const serverType = {
    ControlPanel: 3,
    CommunityServer: 0,
    DocumentServer: 1,
    MailServer: 2,
    XmppServer: 4
};

class UpdateItemBase {
    constructor(cpResource, name = "", helper = "", sType = "CommunityServer") {
        this.cpResource = cpResource;
        this.name = name;
        this.helper = helper;
        this.serverType = serverType[sType];
        this.serverTypeAsString = sType;
        this.downloadUrl = "";

        this.setCurrentVersion(null);
        this.setNewVersion(null);
        this.setUpdateAction(updateActionType.None);
        this.setChangeLogUrl();
    }

    getVersionText(version) {
        return version ? version : this.cpResource.UnknownVersion;
    }

    setCurrentVersion(newCurrentVersion) {
        this.currentVersion = newCurrentVersion;
        this.currentInstalledVersionText = this.getVersionText(newCurrentVersion);
    }

    setNewVersion(newAvailableVersion) {
        this.newVersion = newAvailableVersion;
        this.availableVersionText = this.getVersionText(newAvailableVersion);
    }

    setUpdateAction(newUpdateAction) {
        this.updateAction = updateActionFactory(newUpdateAction);
        this.buttonText = this.updateAction.getButtonText(this.cpResource);
    }

    setChangeLogUrl() {
        const helpcenter = config.get("helpcenter");
        const type = this.serverTypeAsString.toLowerCase().replace("server","");
        this.changeLogUrl = helpcenter ? this.cpResource.ChangeLogLink.replace("{0}", helpcenter).replace("{1}", type) : null;
    }

    getValidVersion(version) {
        if (semver.valid(version)) return version;

        const match = /^(\S+)(\.)([0-9]*)$/g.exec(version);
        if (match && match.length === 4) {
            version = match[1] + "-" + match[3];
            if (semver.valid(version)) {
                return version;
            }
        }

        return undefined;
    }
}

class UpdateItem extends UpdateItemBase {
    constructor(cpResource, name = "", helper = "", sType = "CommunityServer", enterprise = false) {
        super(cpResource, name, helper, sType);

        const dockerConfig = config.get("docker");
        const docker = dockerConfig[sType];
        if (docker) {
            this.installScript = docker.script;
            this.image = (enterprise ? docker.enterpriseImage : "") || docker.image;
            this.container = docker.container;
        }
    }

    getUpdateAction(tariff) {
        return new Promise((resolve) => {
            if (!this.newVersion ||
                !this.image ||
                this.currentVersion === "" ||
                this.currentVersion === this.newVersion ||
                this.newVersion === "latest" ||
                this.currentVersion === "latest") {
                resolve(updateActionType.None);
                return;
            }

            if (this.serverType === serverType.DocumentServer && new Date(tariff.licenseDate) < new Date()) {
                resolve(updateActionType.None);
                return;
            }

            if (this.currentVersion === null) {
                const image = this.image;
                executeHelper('tools/check-image.sh', this.image, this.newVersion)
                    .then((isDownloaded) => {
                        resolve(isDownloaded.indexOf(image) >= 0 ? updateActionType.Install : updateActionType.Download);
                    })
                    .catch((err) => {
                        log.error(err);
                        resolve(updateActionType.None);
                    });
                return;
            }

            let currentVersion = this.getValidVersion(this.currentVersion);
            let newVersion = this.getValidVersion(this.newVersion);

            if (!currentVersion || !newVersion) {
                resolve(updateActionType.None);
                return;
            }

            if (semver.gt(newVersion, currentVersion)) {
                const self = this;
                executeHelper('tools/check-image.sh', this.image, this.newVersion)
                    .then((isDownloaded) => {
                        resolve(isDownloaded.indexOf(self.image) >= 0
                            ? updateActionType.Update
                            : updateActionType.Download);
                    })
                    .catch((err) => {
                        log.error(err);
                        resolve(updateActionType.None);
                    });
                return;
            }

            resolve(updateActionType.None);
        });
    }

    start(req) {
        const self = this;
        co(function*() {
                const result = yield self.updateAction.start(self, req);
                self.updateAction.finish(result);
                const uAction = yield self.getUpdateAction(req.session.tariff);
                self.setUpdateAction(uAction);
            })
            .catch((err) => {
                log.error(err);
                self.updateAction.finish(err);
            });
    }

    static getItem(sType, cpResource, tariff, enterprise) {
        let result;
        switch (serverType[sType]) {
        case serverType.CommunityServer:
            result = new UpdateItem(cpResource,
                cpResource.CommunityServer,
                cpResource.CommunityServerHelper,
                sType,
                enterprise);
            break;
        case serverType.DocumentServer:
            result = new UpdateItem(cpResource,
                cpResource.DocumentServer,
                cpResource.DocumentServerHelper,
                sType,
                enterprise);
            break;
        case serverType.MailServer:
            result = new UpdateItem(cpResource,
                cpResource.MailServer,
                cpResource.MailServerHelper,
                sType,
                enterprise);
            break;
        case serverType.ControlPanel:
            result = new UpdateItem(cpResource,
                cpResource.ControlPanel,
                cpResource.ControlPanelHelper,
                sType,
                enterprise);
            break;
        default:
            result = new UpdateItem();
            break;
        }

        const dockerAuth = config.get("docker:auth");

        const currentVersionPromise = executeHelper("tools/get-current-version.sh", result.container)
            .catch((err) => {
                log.error(err);

                if (err.indexOf("No such image or container") >= 0 || err.indexOf("No such object") >= 0) {
                    return null;
                }

                if (err.indexOf("client is newer than server") >= 0) {
                    return "";
                }

                return "";
            });
        const newVersionPromise = executeHelper("tools/get-available-version.sh",
            "-i",
            `${result.image}`,
            "-path",
            imagePath,
            config.isOfflineMode ? "-o" : "",
            config.isOfflineMode ? "true" : "",
            dockerAuth && dockerAuth.hub ? "-hub" : "",
            dockerAuth && dockerAuth.hub ? `${dockerAuth.hub}` : "",
            dockerAuth && dockerAuth.login ? "-u" : "",
            dockerAuth && dockerAuth.login ? `${dockerAuth.login}` : "",
            dockerAuth && dockerAuth.password ? "-p" : "",
            dockerAuth && dockerAuth.password ? `${dockerAuth.password}` : ""
        );

        return co(function*() {
                const [currentVersion, newVersion] = yield [currentVersionPromise, newVersionPromise];
                result.setCurrentVersion(currentVersion);
                result.setNewVersion(newVersion);
                const uAction = yield result.getUpdateAction(tariff);
                result.setUpdateAction(uAction);
                return result;
            })
            .catch((err) => {
                log.error(err);
                return result;
            });
    }

    linkContainer(req) {
        if (this.serverType === serverType.DocumentServer) {
            const dockerDocumentServerServices = config.get("docker:DocumentServerServices");

            apiRequestManager.makeRequest("files/docservice",
                req,
                {
                    method: "PUT",
                    body: {
                        docServiceUrl: dockerDocumentServerServices.apiUrl,
                        docServiceUrlInternal: dockerDocumentServerServices.internalUrl,
                        docServiceUrlPortal: dockerDocumentServerServices.portalUrl
                    },
                    json: true
                })
                .then((result) => { log.info(result); })
                .catch((err) => { log.error(err); });

        } else if (this.serverType === serverType.MailServer) {
            const mailServerContainerName = this.container;
            const dockerMailServerSqlAuth = config.get("docker:MailServerSqlAuth");
            const currentVersionPromise = executeHelper("tools/get-current-version.sh", dockerMailServerSqlAuth.host)
                .catch((err) => { return null; });

            return co(function* () {
                const currentVersion = yield currentVersionPromise;

                log.info(dockerMailServerSqlAuth.host + " version: " + currentVersion);

                if (currentVersion) {
                    apiRequestManager.makeRequest("mail/mailservice/connectandsavepartitional",
                        req,
                        {
                            method: "POST",
                            body: {
                                mailHost: mailServerContainerName,
                                mysqlHost: dockerMailServerSqlAuth.host,
                                mysqlDatabase: dockerMailServerSqlAuth.database,
                                mysqlUser: dockerMailServerSqlAuth.user,
                                mysqlPassword: dockerMailServerSqlAuth.password
                            },
                            json: true
                        })
                        .then((result) => { log.info(result); })
                        .catch((err) => { log.error(err); });
                } else {
                    apiRequestManager.makeRequest("mail/mailservice/connectandsave",
                        req,
                        {
                            method: "POST",
                            body: {
                                host: mailServerContainerName,
                                database: dockerMailServerSqlAuth.database,
                                user: dockerMailServerSqlAuth.user,
                                password: dockerMailServerSqlAuth.password
                            },
                            json: true
                        })
                        .then((result) => { log.info(result); })
                        .catch((err) => { log.error(err); });
                }
            })
            .catch((err) => {
                log.error(err);
            });
        }
    }
}

class UpdateItemWin extends UpdateItemBase {
    getUpdateAction(tariff) {
        return new Promise((resolve) => {
            if (!this.newVersion ||
                this.currentVersion === "" ||
                this.currentVersion === this.newVersion ||
                this.newVersion === "latest" ||
                this.currentVersion === "latest") {
                resolve(updateActionType.None);
                return;
            }

            if (this.serverType === serverType.DocumentServer && new Date(tariff.licenseDate) < new Date()) {
                resolve(updateActionType.None);
                return;
            }

            const currentVersion = this.getValidVersion(this.currentVersion);
            const newVersion = this.getValidVersion(this.newVersion);

            if (!currentVersion || !newVersion) {
                resolve(updateActionType.None);
                return;
            }

            if (semver.gt(newVersion, currentVersion)) {
                resolve(updateActionType.Download);
                return;
            }

            resolve(updateActionType.None);
        });
    }
    static getItem(sType, cpResource) {
        switch (serverType[sType]) {
        case serverType.CommunityServer:
            return new UpdateItemWin(cpResource, cpResource.CommunityServer, cpResource.CommunityServerHelper, sType);
        case serverType.DocumentServer:
            return new UpdateItemWin(cpResource, cpResource.DocumentServer, cpResource.DocumentServerHelper, sType);
        case serverType.MailServer:
            return new UpdateItemWin(cpResource, cpResource.MailServer, cpResource.MailServerHelper, sType);
        case serverType.ControlPanel:
            return new UpdateItemWin(cpResource, cpResource.ControlPanel, cpResource.ControlPanelHelper, sType);
        case serverType.XmppServer:
            return new UpdateItemWin(cpResource, cpResource.XmppServer, cpResource.XmppServerHelper, sType);
        }
        return null;
    }

    static getUpdates(req) {
        const currentVersionPromise = apiRequestManager.get("settings/version/build.json", req);
        const newVersionPromise = new Promise((resolve, reject) => {
            var url = config.get("version:available-url");
            if (!url) {
                resolve("");
                return;
            }
            var options = {
                uri: url
            }
            request(options,
                (error, response, body) => {
                    if (!error) {
                        if (body === "Unauthorized") {
                            log.error(options.uri, "Unauthorized");
                            reject(400);
                            return;
                        }
                        let result = {};
                        try {
                            result = typeof body === "string" ? JSON.parse(body.substr(body.indexOf("{"))) : body;
                            if (result.error && result.error.message) {
                                reject(result.error.message);
                                return;
                            }
                        } catch (err) {
                            log.error(options.uri, err);
                        }

                        if (response.statusCode > 400) {
                            reject(response.statusCode);
                            return;
                        }

                        resolve(result);
                    } else {
                        log.error(options.uri, error);
                        reject(error);
                    }
                });
        });

        return Promise.all([currentVersionPromise, newVersionPromise]);
    }
}

class UpdateModel extends baseModel {
    constructor(req, title) {
        super(req, title);
    }
    static getItems(req) {
        const items = [];
        const cpResource = req.resources.controlPanelResource;
        const tariff = req.session.tariff;
        const enterprise = req.session.tenantExtra ? req.session.tenantExtra.enterprise : req.session.quota.id != -1;

        if (config.isMono) {
            for (let item in serverType) {
                if (serverType[item] == serverType.XmppServer) continue;
                items.push(UpdateItem.getItem(item, cpResource, tariff, enterprise));
            }
            return Promise.all(items);
        } 

        for (let item in serverType) {
            items.push(UpdateItemWin.getItem(item, cpResource));
        }

        const getPropValue = (obj, propName) => {
            for (let prop in obj) {
                if (prop.toLowerCase() === propName.toLowerCase()) {
                    return obj[prop];
                }
            }
            return null;
        };

        return co(function*() {
                let [currentVersion, newVersion] = yield UpdateItemWin.getUpdates(req);

                for(let item of items) {
                    if (item.serverType === serverType.ControlPanel) {
                        item.setCurrentVersion(config.get("version:current"));
                    } else {
                        for (let s in currentVersion) {
                            if (s.toLowerCase() === item.serverTypeAsString.toLowerCase()) {
                                item.setCurrentVersion(currentVersion[s]);
                            }
                        }
                    }

                    let newItemVersion = getPropValue(newVersion, item.serverTypeAsString);

                    if (enterprise) {
                        newItemVersion = getPropValue(newVersion, item.serverTypeAsString + "Enterprise") || newItemVersion;
                    }

                    if (newItemVersion) {
                        item.setNewVersion(newItemVersion.version);
                        item.downloadUrl = newItemVersion.url;
                    }

                    const uAction = yield item.getUpdateAction(tariff);
                    item.setUpdateAction(uAction);
                }
                return items;
            })
            .catch((err) => {
                log.error(err);
                return result;
            });
    }
}

module.exports = UpdateModel;