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


"use strict";

module.exports = function (app, config, logger) {
    const saml = require("samlify");
    const { SamlLib: libsaml } = saml;
    const urlResolver = require("./utils/resolver")(logger);
    const coder = require("./utils/coder");
    const urn = require("samlify/build/src/urn");

    const UserModel = require("./model/user");
    const LogoutModel = require("./model/logout");

    /**
     * @desc Route to get Sp metadata
     * @param {object} req - request
     * @param {object} res - response
     */
    app.get(config.routes.metadata, getSpMetadata);

    /**
     * @desc Route to send login request from Sp to Idp
     * @param {object} req - request
     * @param {object} res - response
     */
    app.get(config.routes.login, sendLoginRequest);

    /**
     * @desc Route to send login request from Sp to Idp
     * @param {object} req - request
     * @param {object} res - response
     */
    app.post(config.routes.login, sendLoginRequest);

    /**
     * @desc Route to read login response from Idp to Sp
     * @param {object} req - request with assertion info
     * @param {object} res - response
     */
    app.get(config.routes.login_callback, onLoginResponse);

    /**
     * @desc Route to read login response from Idp to Sp
     * @param {object} req - request with assertion info
     * @param {object} res - response
     */
    app.post(config.routes.login_callback, onLoginResponse);

    /**
     * @desc Route to send logout request from Sp to Idp
     * @param {object} req - request with data parameter (NameID required)
     * @param {object} res - response
     */
    app.get(config.routes.logout, sendLogoutRequest);

    /**
     * @desc Route to read logout response from Idp to Sp
     * @param {object} req - request with logout info
     * @param {object} res - response
     */
    app.get(config.routes.logout_callback, onLogoutResponse);

    /**
     * @desc Route to read logout response from Idp to Sp
     * @param {object} req - request with logout info
     * @param {object} res - response
     */
    app.post(config.routes.logout_callback, onLogoutResponse);

    /**
     * @desc Catch any untracked routes
     * @param {object} req - request with data parameter (NameID required)
     * @param {object} res - response
     */
    app.use(function (req, res, next) {
        next(res.redirect(urlResolver.getPortal404Url(req)));
    });

    function getSpMetadata(req, res) {
        const sp = req.providersInfo.sp;

        res.type("application/xml");

        const xml = sp.getMetadata();

        if (config.app.logSamlData) {
            logger.debug(xml);
        }

        return res.send(xml);
    }

    const createAuthnTemplateCallback = (_idp, _sp, method) => template => {
        const metadata = { idp: _idp.entityMeta, sp: _sp.entityMeta };
        const spSetting = _sp.entitySetting;
        const base = metadata.idp.getSingleSignOnService(method);
        const nameIDFormat = spSetting.nameIDFormat;
        const selectedNameIDFormat = Array.isArray(nameIDFormat) ? nameIDFormat[0] : nameIDFormat;
        const id = spSetting.generateID();

        const tvalue = {
            ID: id,
            Destination: base,
            Issuer: metadata.sp.getEntityID(),
            IssueInstant: new Date().toISOString(),
            NameIDFormat: selectedNameIDFormat,
            AssertionConsumerServiceURL: metadata.sp.getAssertionConsumerService(urn.wording.binding.post),
            EntityID: metadata.sp.getEntityID(),
            AllowCreate: spSetting.allowCreate
        };

        const tmpl = template.context || template;

        const rawSamlRequest = libsaml.replaceTagsByValue(tmpl, tvalue);
        return {
            id: id,
            context: rawSamlRequest
        };
    };

    function sendLoginRequest(req, res) {
        try {
            if (!verifySetting(req)) {
                return res.redirect(urlResolver.getPortal500Url(req));
            }

            const sp = req.providersInfo.sp;
            const idp = req.providersInfo.idp;

            const isPost = req.providersInfo.settings.IdpSettings.SsoBinding === urn.namespace.binding.post;

            const method = isPost
                ? "post"
                : "redirect";

            const request = sp.createLoginRequest(idp, method, createAuthnTemplateCallback(idp, sp, method));

            if (isPost) {
                return res.render("actions", request);
            } else {
                return res.redirect(request.context);
            }

        } catch (e) {
            logger.error(`sendLoginRequest ${e.message}`);
            return res.redirect(urlResolver
                .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
        }
    }

    function onLoginResponse(req, res) {
        try {
            if (!verifySetting(req)) {
                return res.redirect(urlResolver.getPortal500Url(req));
            }

            const sp = req.providersInfo.sp;
            const idp = req.providersInfo.idp;

            const method = (req.method === "GET" ? "redirect" : "post");

            return sp.parseLoginResponse(idp, method, req)
                .then(requestInfo => {
                    if (config.app.logSamlData) {
                        logger.debug(`parseLoginResponse ${JSON.stringify(requestInfo)}`);
                    }

                    if (!requestInfo.extract.attributes) {
                        return res.redirect(urlResolver
                            .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoAttributesNotFound));
                    }

                    const user = new UserModel(requestInfo.extract.nameID,
                        requestInfo.extract.sessionIndex.sessionIndex,
                        requestInfo.extract.attributes,
                        req.providersInfo.mapping);

                    logger.info(`SSO User ${JSON.stringify(user)}`);

                    // Use the parseResult can do customized action
                    const data = coder.encodeData(user);

                    if (!data) {
                        logger.error("coder.encodeData", user);
                        return res.redirect(urlResolver
                            .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
                    } else {
                        return res.redirect(urlResolver.getPortalSsoLoginUrl(req, data));
                    }
                })
                .catch(e => {
                    logger.error(`sp.parseLoginResponse ${e.message}`);
                    return res.redirect(urlResolver
                        .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoAuthFailed));
                });
        } catch (e) {
            logger.error(`onLoginResponse ${e.message}`);
            return res.redirect(urlResolver
                .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
        }
    }

    const createLogoutTemplateCallback = (_idp, _sp, user) => template => {
        const _target = _idp;
        const _init = _sp;
        const metadata = { init: _init.entityMeta, target: _target.entityMeta };
        const initSetting = _init.entitySetting;
        const nameIDFormat = initSetting.nameIDFormat;
        const selectedNameIDFormat = Array.isArray(nameIDFormat) ? nameIDFormat[0] : nameIDFormat;
        const id = initSetting.generateID();

        const tvalue = {
            ID: id,
            Destination: metadata.target.getSingleLogoutService(urn.wording.binding.redirect),
            Issuer: metadata.init.getEntityID(),
            IssueInstant: new Date().toISOString(),
            EntityID: metadata.init.getEntityID(),
            NameQualifier: metadata.target.getEntityID(),
            NameIDFormat: selectedNameIDFormat,
            NameID: user.logoutNameID,
            SessionIndex: user.sessionIndex,
        };

        const tmpl = template.context || template;

        const rawSamlRequest = libsaml.replaceTagsByValue(tmpl, tvalue);
        return {
            id: id,
            context: rawSamlRequest
        };
    };

    function sendLogoutRequest(req, res) {
        try {
            if (!verifySetting(req)) {
                return res.redirect(urlResolver.getPortal500Url(req));
            }

            const sp = req.providersInfo.sp;
            const idp = req.providersInfo.idp;

            const isPost = req.providersInfo.settings.IdpSettings.SloBinding === urn.namespace.binding.post;

            const method = isPost
                ? "post"
                : "redirect";

            const relayState = urlResolver.getPortalAuthUrl(req);

            const userData = coder.decodeData(req.query["data"]);

            if (!userData) {
                logger.error(`coder.decodeData ${req.query["data"]}`);
                return res.redirect(urlResolver.getPortal500Url(req));
            }

            //const logoutUser = new LogoutModel(userData.NameId, userData.SessionId);
            const user = { logoutNameID: userData.NameId, sessionIndex: userData.SessionId };

            const request = sp.createLogoutRequest(idp, method, user, relayState, createLogoutTemplateCallback(idp, sp, user));

            if (isPost) {
                return res.render("actions", request);
            } else {
                return res.redirect(request.context);
            }

        } catch (e) {
            logger.error(`sendLogoutRequest ${e.message}`);
            return res.redirect(urlResolver
                .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
        }
    };

    function onLogoutResponse(req, res) {
        try {

            if (!verifySetting(req)) {
                return res.redirect(urlResolver.getPortal500Url(req));
            }

            const sp = req.providersInfo.sp;
            const idp = req.providersInfo.idp;

            const method = (req.method === "GET" ? "redirect" : "post");

            if (req.query.SAMLResponse) {
                return sp.parseLogoutResponse(idp, method, req)
                    .then(responseInfo => {
                        if (config.app.logSamlData) {
                            logger.debug(`parseLogoutResponse ${JSON.stringify(responseInfo)}`);
                        }

                        res.redirect(urlResolver.getPortalAuthUrl(req));
                    })
                    .catch(e => {
                        logger.error(`parseLogoutResponse ${e.message}`);

                        /*return res.redirect(urlResolver
                            .getPortalAuthErrorUrl(req, "Internal server error"));*/

                        res.redirect(urlResolver.getPortalAuthUrl(req));
                    });
            } else if (req.query.SAMLRequest) {
                return sp.parseLogoutRequest(idp, method, req)
                    .then(requestInfo => {
                        if (config.app.logSamlData) {
                            logger.debug(`${JSON.stringify(requestInfo)}`);
                        }

                        const nameID = requestInfo.extract.nameID;
                        const sessionIndex = requestInfo.extract.sessionIndex
                            ? typeof requestInfo.extract.sessionIndex === "string"
                                ? requestInfo.extract.sessionIndex
                                : requestInfo.extract.sessionIndex.sessionIndex
                            : null;

                        //if (nameID) {
                            const request = require("request");

                            const logoutUser = new LogoutModel(nameID, sessionIndex);

                            // Use the parseResult can do customized action
                            const data = coder.encodeData(logoutUser);

                            if (!data) {
                                logger.error(`coder.encodeData ${JSON.stringify(logoutUser)}`);
                               return res.redirect(urlResolver.getPortal500Url(req));
                            } else {
                                const url = urlResolver.getPortalSsoLogoutUrl(req, data);

                                request.get(url, function () {
                                    const request = sp.createLogoutResponse(idp, requestInfo, method, req.body.relayState);
                                    return res.redirect(request.context);
                                });
                            }

                        //} else {
                        //TODO: Is it really necessary?
                            /*sp.sendLogoutResponse(idp, requestInfo, method, req.body.relayState)
                                .then(url => {
                                    res.redirect(url);
                                })
                                .catch(e => {
                                    logger.error("parseLogoutRequest %s", e);
                                    return res.redirect(urlResolver
                                        .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
                                });;*/
                        //}
                    })
                    .catch(e => {
                        logger.error(`parseLogoutRequest ${e.message}`);
                        return res.redirect(urlResolver
                            .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
                    });
            } else {
                logger.error(`Invalid logout data\r\nurl: ${req.originalUrl}\r\nheaders: ${JSON.stringify(req.headers)}\r\nquery: ${JSON.stringify(req.query)}`);
                return res.redirect(urlResolver.getPortalAuthUrl(req));
            }
        } catch (e) {
            logger.error(`onLogoutResponse ${e.message}`);
            return res.redirect(urlResolver
                .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError));
        }
    }

    function verifySetting(req) {
        if (!req.providersInfo.settings.EnableSso) {
            logger.error("Sso settings is disabled");
            return false;
        }

        return true;
    }
};
