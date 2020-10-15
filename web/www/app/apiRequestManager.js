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


const apiBasePath = "/api/2.0/",
    portalManager = require('./portalManager.js'),
    request = require('request'),
    config = require('../config'),
    crypto = require('crypto'),
    moment = require('moment'),
    util = require('util');

const skey = config.get("core.machinekey");
const log = require("./log.js");

class RequestManager {
    constructor() { }

    getBasePath() {
        return "";
    }
    makeRequest(apiMethod, req, options) {
        return new Promise((resolve, reject) => {
            options.uri = this.getBasePath() + apiMethod;
            request(options, (error, response, body) => {
                if (!error) {
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
                        result = typeof body === "string" ? JSON.parse(body) : body;
                        if (result.error && result.error.message) {
                            reject(result.error.message);
                            return;
                        }
                    } catch (err) {
                        // err.message += (" \n" + body);
                        log.error(options.uri, err);
                    }

                    if (response.statusCode > 400) {
                        reject(response.statusCode);
                        return;
                    }

                    resolve(result.response ? result.response : result);
                } else {
                    log.error(options.uri, error);
                    reject(error);
                }
            });
        });
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
        return portalManager.getInternalPortalUrl().replace(/\/$/g, '') + apiBasePath;
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
            : portalManager.getInternalPortalUrl().replace(/\/$/g, '') + apiSystemAbsolute;
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