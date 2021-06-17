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


const portalManager = require('../portalManager.js');
const apiRequestManager = require('../apiRequestManager.js').apiManager;
const config = require('../../config');
const app = require('express')();

function checkIsAdminAndPortalUrl(user, req, res, next) {
    const canGoToPanel = user && user.isAdmin && portalManager.getInternalPortalUrl() !== '';
    const basePath = config.makePath();
    if (!canGoToPanel) {
        if (req.url !== basePath && req.url !== config.makePath("resource")) {

            if (req.session) {
                req.session.destroy(() => { res.redirect("/"); });
            } else {
                res.redirect("/");
            }

            return;
        }

        if (req.url === basePath && app.get('env') !== 'development') {
            res.redirect("/");
            return;
        }

    } else if (req.url === basePath) {
        res.redirect(config.makePath(req.session.controlPanelSettings.limitedAccess ? "loginHistory" : "backup"));
        return;
    }

    next();
}

module.exports = function (req, res, next) {
    if (req.url === config.makePath() && req.method === "POST") {
        next();
        return;
    }

    if (req.session.user) {
        checkIsAdminAndPortalUrl(req.session.user, req, res, next);
        return;
    }

    const getUser = apiRequestManager.get("people/@self.json", req);
    const getPortal = apiRequestManager.get("portal.json", req);
    const getWhiteLabelSettings = apiRequestManager.get("settings/companywhitelabel.json", req);
    const getControlPanelSettings = apiRequestManager.get("settings/controlpanel.json", req);

    Promise.all([getUser, getPortal, getWhiteLabelSettings])
        .then(([user, portal, whiteLabelSettings]) => {
            if (!user.cultureName) {
                user.cultureName = portal.language;
            }

            req.session.user = user;
            req.session.whiteLabelSettings = whiteLabelSettings;

            return getControlPanelSettings
                .then((controlPanelSettings) => {
                    req.session.controlPanelSettings = controlPanelSettings;
                }).catch((err) => {
                    let methodNotFound = err == 404;
                    req.session.controlPanelSettings = { limitedAccess: !methodNotFound };
                });
        })
        .then(() => {
            checkIsAdminAndPortalUrl(req.session.user, req, res, next);
        })
        .catch((err) => {
            checkIsAdminAndPortalUrl(undefined, req, res, next);
        });
}