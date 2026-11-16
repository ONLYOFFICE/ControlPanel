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


const apiBasePath = "/api/2.0/",
    portalManager = require('./portalManager.js'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime-types'),
    config = require('../config'),
    crypto = require('crypto'),
    moment = require('moment'),
    util = require('util');

const skey = config.get("core.machinekey");
const log = require("./log.js");

// formData files (fs.ReadStream values) are read lazily while the request is sent:
// the file must not be deleted or modified until makeRequest settles,
// otherwise the request fails with NotReadableError "The blob could not be read"
function createFetchOptions(options) {
    const headers = Object.assign({}, options.headers);
    const fetchOptions = { method: options.method || "GET", headers };

    if (options.json) {
        headers["accept"] = "application/json";
    }

    if (options.formData) {
        const entries = Object.entries(options.formData).map(([key, value]) => {
            if (value instanceof fs.ReadStream) {
                const name = value.name || path.basename(value.path);
                const filePath = value.path;
                // part content-type as form-data did it: by name, then by path
                const type = mime.lookup(name) || mime.lookup(filePath) || "application/octet-stream";
                value.destroy();
                // file-backed Blob: no in-memory copy of the file before sending (fetch still buffers the body while sending)
                return fs.openAsBlob(filePath, { type })
                    .then((blob) => [key, blob, name]);
            }
            return Promise.resolve([key, value]);
        });
        return Promise.all(entries).then((fields) => {
            const form = new FormData();
            fields.forEach((field) => form.append(...field));
            fetchOptions.body = form;
            return fetchOptions;
        });
    }

    if (typeof options.body !== "undefined") {
        if (options.json && !Buffer.isBuffer(options.body)) {
            headers["content-type"] = "application/json";
            fetchOptions.body = JSON.stringify(options.body);
        } else {
            fetchOptions.body = options.body;
        }
    }

    return Promise.resolve(fetchOptions);
}

class RequestManager {
    constructor() { }

    getBasePath() {
        return "";
    }
    makeRequest(apiMethod, req, options) {
        var absolutePathRegex = /^https?:\/\//i;
        var basePath = absolutePathRegex.test(apiMethod) ? "" : this.getBasePath();
        options.uri = basePath + apiMethod;

        return createFetchOptions(options)
            .then((fetchOptions) => fetch(options.uri, fetchOptions))
            .then((response) => response.text().then((body) => ({ response, body })))
            .catch((error) => {
                log.error(options.uri, error.cause || error);
                throw error;
            })
            .then(({ response, body }) => new Promise((resolve, reject) => {
                if (body === "Unauthorized") {
                    log.error(options.uri, "Unauthorized");
                    if (req.session) {
                        req.session.destroy(() => { reject(401); });
                    } else {
                        reject(401);
                    }
                    return;
                }
                let result = {};
                try {
                    result = JSON.parse(body);
                    if (result.error && result.error.message) {
                        reject(result.error.message);
                        return;
                    }
                } catch (err) {
                    // err.message += (" \n" + body);
                    log.error(options.uri, err);
                }

                if (response.status > 400) {
                    reject(response.status);
                    return;
                }

                resolve(result.response ? result.response : result);
            }));
    }
    get(apiMethod, req) {
        return this.makeRequest(apiMethod, req, { method: "GET" });
    }
    post(apiMethod, req) {
        return this.makeRequest(apiMethod, req, { method: "POST", body: req.body, json: true });
    }
    put(apiMethod, req) {
        return this.makeRequest(apiMethod, req, { method: "PUT", body: req.body, json: true });
    }
    dlt(apiMethod, req) {
        const options = { method: "DELETE" };
        if (typeof req.body !== "undefined") {
            options.body = req.body;
            options.json = true;
        }
        return this.makeRequest(apiMethod, req, options);
    }
}

class ApiRequestManager extends RequestManager {
    constructor() { super(); }
    getBasePath() {
        return portalManager.getAbsolutePortalUrl(apiBasePath);
    }
    makeRequest(apiMethod, req, options) {
        options.headers = {};

        if (req.cookies && req.cookies['asc_auth_key']) {
            options.headers["Authorization"] = req.cookies['asc_auth_key'];
        }

        if (req.headers) {
            const xRewriterUrlHeader = 'x-rewriter-url',
                xForwardedForHeader = 'x-forwarded-for';

            if (req.headers[xRewriterUrlHeader]) {
                options.headers[xRewriterUrlHeader] = req.headers[xRewriterUrlHeader];
            }
            if (req.headers[xForwardedForHeader]) {
                options.headers[xForwardedForHeader] = req.headers[xForwardedForHeader];
            }
        }
        return super.makeRequest(apiMethod, req, options);
    }
}
class ApiSystemRequestManager extends RequestManager {
    constructor() { super(); }

    getBasePath() {
        const apiSystemAbsolute = config.get("web:apiSystem").replace(/\/$/g, '') + "/";
        return apiSystemAbsolute.startsWith("http")
            ? apiSystemAbsolute
            : portalManager.getAbsolutePortalUrl(apiSystemAbsolute);
    }

    makeRequest(apiMethod, req, options) {
        options.headers = {};

        if (req.cookies && req.cookies['asc_auth_key']) {
            options.headers["Authorization"] = this.createToken(req.cookies['asc_auth_key']);
        }

        return super.makeRequest(apiMethod, req, options);
    }

    createToken(pkey) {
        const hasher = crypto.createHmac('sha1', skey);
        const now = moment.utc().format("YYYYMMDDHHmmss");
        const hash = hasher.update(now + "\n" + pkey);
        return util.format('ASC %s:%s:%s', pkey, now, hash.digest('base64'));
    }
}

const apiManager = new ApiRequestManager(),
    apiSystemManager = new ApiSystemRequestManager();

module.exports = { apiManager, apiSystemManager };