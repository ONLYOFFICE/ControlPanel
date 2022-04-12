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


const nconf = require('nconf');
const path = require('path');
const os = require('os');
const dns = require('dns');
const fs = require('fs');

class Size {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    getSizeByType(general) {
        return new Size(
            general ? this.width / 2 : this.width,
            general ? this.height / 2 : this.height);
    }
}

nconf.argv().env();

if (nconf.get('NODE_ENV'))
    nconf.file(nconf.get('NODE_ENV'),{ file: path.join(__dirname, nconf.get('NODE_ENV')+'.json') });

nconf.file("base", path.join(__dirname, 'config.json'));

const appPath = nconf.get("web:appPath").replace(/\/$/g, '');
nconf.makePath = function (relative = "/") {
    return `${appPath}/${relative.replace(/^\/|\/$/g, '')}`;
}

const productName = nconf.get("product:name");
nconf.getProductDir = function (dir) {
    const val = nconf.get(`product:${dir}`) || '';
    return val.replace('${name}', productName);
}

nconf.defaultPortalName = "localhost";
nconf.defaultDomain = "localhost";
nconf.regxMailDomain = /(?=^.{5,254}$)(^(?:(?!\d+\.)[a-zA-Z0-9_\-]{1,63}\.?)+\.(?:[a-zA-Z]{2,})$)/;

nconf.logoLightSize = new Size(432, 70);
nconf.logoLightSmallSize = new Size(284, 46);
nconf.logoDarkSize = new Size(432, 70);
nconf.logoFaviconSize = new Size(32, 32);
nconf.logoDocsEditorSize = new Size(172, 40);
nconf.logoDocsEditorEmbedSize = new Size(172, 40);

nconf.getSize = function (logotype, general)
{
    switch (logotype) {
        case 0: return this.logoLightSize.getSizeByType(general);
        case 1: return this.logoLightSmallSize.getSizeByType(general);
        case 2: return this.logoDarkSize.getSizeByType(general);
        case 3: return this.logoFaviconSize.getSizeByType(general);
        case 4: return this.logoDocsEditorSize.getSizeByType(general);
        case 5: return this.logoDocsEditorEmbedSize.getSizeByType(general);
    }
    return new Size(0, 0);
}

nconf.isMono = os.platform() !== "win32";
nconf.isOfflineMode = false;
nconf.rebranding = nconf.get("web:rebranding");

dns.resolve('hub.docker.com', (err) => {
    nconf.isOfflineMode = typeof err == typeof Error;
});

const hiddenController = nconf.get("hiddenControllers") || [];
nconf.controllers = fs.readdirSync(path.join(__dirname, '../app/controllers'))
    .filter((item) => {
        return !hiddenController.includes(item);
    });

module.exports = nconf;
