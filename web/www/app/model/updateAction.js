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


const updateActionType = require('./updateActionType.js');
const executeHelper = require('../executeHelper.js');
const config = require('../../config');
const fileManager = require("../fileManager.js");
const imagePath = fileManager.getDataDirPath(config.get("web:image-path"), false);
const log = require("../log.js");

class BaseAction {
    constructor(uAType) {
        this.type = uAType;
        this.started = false;
    }
    getButtonText() {
        return "";
    }
    start() {
        this.started = true;
    }
    finish(status) {
        this.started = false;
        this.status = status;
    }
}

class NoneAction extends BaseAction {
    constructor() {
        super(updateActionType.None);
    }
    getButtonText(cpResource) {
        return cpResource.UpdateButtonText;
    }
}

class UpdateAction extends BaseAction {
    constructor() {
        super(updateActionType.Update);
    }
    getButtonText(cpResource) {
        return cpResource.UpdateButtonText;
    }
    start(item) {
        super.start();

        return executeHelper(item.installScript,
            "-u",
            "-i", item.image,
            "-v", item.newVersion,
            "-c", item.container,
            "-path", imagePath,
            "-cc", item.serverType === 0 ? config.get("docker:ControlPanel:container") : config.get("docker:CommunityServer:container"),
            item.domainName ? "--domain" : "", item.domainName ? item.domainName : "",
            "-mysql",  config.get("docker:MysqlServer:container"),
            "-product",  config.get("product:name"),
            "-hostdir",  config.getProductDir("hostDir"),
            item.serverType === 0 ? "-dc" : "", item.serverType === 0 ? config.get("docker:DocumentServer:container") : "",
            item.serverType === 0 ? "-mc" : "", item.serverType === 0 ? config.get("docker:MailServer:container") : ""
        ).then((result) => {
            log.info(result);
            item.setCurrentVersion(item.newVersion);
            return result;
        })
        .catch((err) => { log.error(err); });
    }
}

class DownloadAction extends BaseAction {
    constructor() {
        super(updateActionType.Download);
    }
    getButtonText(cpResource) {
        return cpResource.Download;
    }

    start(item) {
        super.start();

        const dockerAuth = config.get("docker:auth");

        return executeHelper("tools/download-image.sh",
            "-i", `${item.image}`,
            "-v", `${item.newVersion}`,
            "-path", imagePath,
            dockerAuth && dockerAuth.hub ? "-hub" : "", dockerAuth && dockerAuth.hub ? dockerAuth.hub : "",
            dockerAuth && dockerAuth.login ? "-u" : "", dockerAuth && dockerAuth.login ? dockerAuth.login : "", 
            dockerAuth && dockerAuth.login ? "-p" : "", dockerAuth && dockerAuth.password ? dockerAuth.password : ""
        );

    }
}

class InstallAction extends BaseAction {
    constructor() {
        super(updateActionType.Install);
    }
    getButtonText(cpResource) {
        return cpResource.Install;
    }
    start(item, req) {
        super.start();
        const newVersion = item.newVersion;
        return executeHelper(item.installScript,
            "-i", item.image,
            "-v", newVersion,
            "-c", item.container,
            "-path", imagePath,
            "-cc", item.serverType === 0 ? config.get("docker:ControlPanel:container") : config.get("docker:CommunityServer:container"),
            item.domainName ? "--domain" : "", item.domainName ? item.domainName : "",
            item.serverType === 1 ? "--protocol" : "", item.serverType === 1 ? req.protocol : "",
            "-mysql",  config.get("docker:MysqlServer:container"),
            "-product",  config.get("product:name"),
            "-hostdir",  config.getProductDir("hostDir"),
            item.serverType === 0 ? "-dc" : "", item.serverType === 0 ? config.get("docker:DocumentServer:container") : "",
            item.serverType === 0 ? "-mc" : "", item.serverType === 0 ? config.get("docker:MailServer:container") : ""
        ).then((result) => {
            log.info(result);
            item.linkContainer(req);
            item.setCurrentVersion(newVersion);
            return result;
        })
        .catch((err) => { log.error(err); });
    }
}

class RestartAction extends BaseAction {
    constructor() {
        super(updateActionType.Restart);
    }
}

class RefreshAction extends BaseAction {
    constructor() {
        super(updateActionType.Refresh);
    }
}

module.exports = (uAType) => {
    switch (uAType) {
        case updateActionType.None: return new NoneAction();
        case updateActionType.Update: return new UpdateAction();
        case updateActionType.Download: return new DownloadAction();
        case updateActionType.Install: return new InstallAction();
        case updateActionType.Restart: return new RestartAction();
        case updateActionType.Refresh: return new RefreshAction();
    }
};