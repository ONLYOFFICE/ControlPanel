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


const fs = require('fs'),
    path = require('path'),
    app = require('express')(),
    uglifyjs = require('uglify-js'),
    config = require('../config'),
    log = require("./log.js");

let links = [
        "vars", "layout", "tl-combobox", "common", "common_style", "header", "paragraph", "link", "button", "forms",
        "toastr", "action-menu", "phonecontroller", "whitelabel", "site", "login", "update", "gift", "backup", "restore",
        "loginhistory", "audittrail", "migration", "multiportals", "ldapsettings", "ssosettings", "search", "storage", "jqCron",
        "rebranding", "privacyroom", "activate"
    ];

function getLinks() {
    if (app.get('env') === 'development') {
        return links.map((item) => config.makePath(`/stylesheets/${item}.css`));
    }

    const combinedName = `combined.${config.get('version:current').replace(/\./g, '')}`;
    links = links.map((item) => `@import "${item}";`);

    const filePath = path.join(__dirname, `../public/stylesheets/${combinedName}.less`);

    if (fs.existsSync(filePath)) {
        return [config.makePath(`/stylesheets/${combinedName}.css`)];
    }

    fs.writeFileSync(filePath,
        links.reduce((previousValue, currentValue) => `${previousValue}${currentValue}`));

    return [config.makePath(`/stylesheets/${combinedName}.css`)];
}
    
function getScripts() {
    var baseFolder = '/javascripts/';
        
    function getFiles(folder) {
        const files = fs.readdirSync(path.join(__dirname, '../public', baseFolder, folder));

        return files.map((item) => `${baseFolder}${folder}/${item}`);
    }

    const thirdparty = getFiles('third-party'),
        plugins = getFiles('plugins'),
        views = getFiles('views');
        
    const scripts = [...thirdparty, ...plugins, baseFolder + 'common.js', baseFolder + 'upload.js', baseFolder + 'asc.socketio.js', ...views];

    if (app.get('env') === 'development') {
        return scripts.map((item) => config.makePath(item));
    }

    const combinedName = `combined.${config.get('version:current').replace(/\./g, '')}.js`;
    var combinedPath = path.join(__dirname, `../public/javascripts/${combinedName}`);

    if (fs.existsSync(combinedPath)) {
        return [config.makePath(`/javascripts/${combinedName}`)];
    }

    log.info(`bundle generation from ${scripts.length} files:`);

    scripts.forEach(function (item, index) {
        let data;
        item = path.join(__dirname, '../public', item);

        log.info(`${index} ${item}`);

        if (item.endsWith(".min.js")) {
            data = fs.readFileSync(item);
        } else {
            data = uglifyjs.minify(fs.readFileSync(item, "utf8")).code;
        }

        fs.appendFileSync(combinedPath, data);
    });

    return [config.makePath(`/javascripts/${combinedName}`)];
}

module.exports = { links: getLinks(), scripts: getScripts() };