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
      co = require("co"),
      http = require("http"),
      https = require("https");

const log = require("./log.js"),
      config = require('../config'),
      appDataDirPath = path.join(__dirname, config.get("web:data"));

function getDataDirPath(subdir = "", createIfNotExist = true) {
    var fullPath = path.join(appDataDirPath, subdir);
    if (!createIfNotExist) return fullPath;

    return co(function*() {
        yield createDir(appDataDirPath);
        return createDir(fullPath);
    });
}

function createDir(pathToDir) {
    return co(function* () {
        const exist = yield checkDirExist(pathToDir);
        if (exist) {
            return pathToDir;
        }
        return new Promise((resolve, reject) => {
            fs.mkdir(pathToDir,
            (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(pathToDir);
            });
        });
    }).catch((err) => {
        log.error("Create App_Data error", err);
    });
}

function checkDirExist(pathToDir) {
    return new Promise((resolve, reject) => {
        fs.stat(pathToDir,
            function (err, stats) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                    return;
                }

                resolve(stats.isDirectory());
            });
    });
}

function checkFileExist(pathToFile) {
    return new Promise((resolve, reject) => {
        fs.stat(pathToFile,
            function (err, stats) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                    return;
                }

                resolve(stats.isFile());
            });
    });
}

function copyFile(source, target, append = false){
    return new Promise(function (resolve, reject) {
        var rd = fs.createReadStream(source);
        rd.on('error', rejectCleanup);

        const writeOptions = { flags: append ? 'a' : 'w'};
        
        var wr = fs.createWriteStream(target, writeOptions);
        wr.on('error', rejectCleanup);

        function rejectCleanup(err) {
            rd.destroy();
            wr.end();
            reject(err);
        }
        wr.on('finish', resolve);
        rd.pipe(wr);
    });
}

function moveFile(from, to) {
    return co(function*() {
            const isExist = yield checkFileExist(from);
            if (!isExist) return;

            return new Promise((resolve, reject) => {
                fs.rename(from, to, () => { resolve(); });
            });
        })
        .catch((error) => {
            throw error;
        });
}

function deleteFile(pathToFile) {
    return co(function*() {
            const isExist = yield checkFileExist(pathToFile);
            if (!isExist) return;

            return new Promise((resolve, reject) => {
                fs.unlink(pathToFile, () => { resolve(); });
            });
        })
        .catch((error) => {
            throw error;
        });
}

// returns the path of fileName inside dir, or null if the name tries to leave dir
function getSafeFilePath(dir, fileName) {
    if (typeof fileName !== "string") return null;

    const name = path.basename(fileName);
    if (!name || name === "." || name === ".." || name.includes("\0")) return null;

    const target = path.resolve(dir, name);
    if (path.dirname(target) !== path.resolve(dir)) return null;

    return target;
}

function downloadFile(uri, filePath, redirectsLeft = 10) {
    return new Promise((resolve, reject) => {
            const client = uri.toLowerCase().startsWith("https:") ? https : http;
            client
                .get(uri, { rejectUnauthorized: false }, (response) => {
                    const location = response.headers.location;
                    if (response.statusCode >= 300 && response.statusCode < 400 && location && redirectsLeft > 0) {
                        response.resume();
                        resolve(downloadFile(new URL(location, uri).href, filePath, redirectsLeft - 1));
                        return;
                    }
                    response
                        .on('error', (err) => {
                            reject(err);
                        })
                        .pipe(fs.createWriteStream(filePath))
                        .on('error', (err) => {
                            reject(err);
                        })
                        .on('finish', () => {
                            resolve(filePath);
                        });
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
}

module.exports = { checkFileExist, createDir, copyFile, moveFile, deleteFile, getDataDirPath, downloadFile, getSafeFilePath };
