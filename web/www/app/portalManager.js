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


const config = require('../config'),
    app = require('express')(),
    request = require('request');

let portalUrl = '';
    
function setPortalUrl({portal}) {
    return new Promise(function (resolve, reject) {

        if (app.get('env') !== 'development') {
            resolve();
            return;
        }

        if (typeof portal !== "string" || portal.length === 0) {
            return;
        }
        portal = portal.toLowerCase().trim();
        if (portal.indexOf("https") === 0) {
            portalUrl = portal;
            resolve();
            return;
        }

        request(portal,
            function(error, response, body) {
                if (!error) {
                    portalUrl = response.req._headers.referer;
                    resolve();
                } else {
                    reject();
                }
            });
    });
}

function getExternalPortalUrl(req) {
    if (portalUrl) {
        return portalUrl;
    }

    const xRewriterUrlHeader = 'x-rewriter-url';
    if (req.headers && req.headers[xRewriterUrlHeader]) {
        return req.headers[xRewriterUrlHeader];
    }

    return getInternalPortalUrl();
}

function getInternalPortalUrl() {
    if (portalUrl) {
        return portalUrl;
    }

    const portal = config.get('web:portal');
    if (portal) {
        return portal;
    }

    return "";
}

module.exports = { setPortalUrl, getExternalPortalUrl, getInternalPortalUrl };