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


const config = require('../config'),
    app = require('express')();

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

        getLastRedirectReferer(portal)
            .then((referer) => {
                portalUrl = referer;
                resolve();
            })
            .catch(() => reject());
    });
}

// follows redirects and returns the url that issued the last redirect
function getLastRedirectReferer(url, referer, redirectsLeft = 10) {
    return fetch(url, { redirect: 'manual' })
        .then((response) => {
            const location = response.headers.get('location');
            if (response.status >= 300 && response.status < 400 && location && redirectsLeft > 0) {
                return getLastRedirectReferer(new URL(location, url).href, url, redirectsLeft - 1);
            }
            return referer;
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

function getAbsolutePortalUrl(relativeUrl) {
    return getInternalPortalUrl().replace(/\/$/g, '') + '/' + relativeUrl.replace(/^\//g, '');
}

module.exports = { setPortalUrl, getExternalPortalUrl, getInternalPortalUrl, getAbsolutePortalUrl };