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

    const urlResolver = require("../utils/resolver")(logger),
        coder = require("../utils/coder"),
        converter = require("../utils/converter")(logger),
        _ = require("lodash"),
        request = require("request");

    const routes = _.values(config.routes);

    app.use(function(req, res, next) {
        const foundRoutes = req.url && req.url.length > 0
            ? routes.filter(function(route) {
                return 0 === req.url.indexOf(route);
            })
            : [];

        if (!foundRoutes.length) {
            logger.error(`invalid route ${req.originalUrl}`);
            return res.redirect(urlResolver
                .getPortal404Url(req));
        }

        const baseUrl = urlResolver.getBaseUrl(req);

        return new Promise((resolve) => {
            var url = urlResolver.getPortalSsoConfigUrl(req);

            request.get(url,
                function (rq, rs) {
                    try {
                        if (!rs || rs.statusCode === 404) {
                            if (rs) logger.error(rs.statusMessage);
                            return resolve(res.redirect(urlResolver
                                .getPortal404Url(req)));
                        } else if (rs.statusCode !== 200) {
                            throw "invalid response status " + rs.statusCode;
                        } else if (!rs.body || rs.body.length === 0) {
                            throw "empty config response body";
                        }

                        const ssoConfig = coder.decodeData(rs.body);

                        const idp = converter.toIdp(ssoConfig);

                        const sp = converter.toSp(ssoConfig, baseUrl);

                        const providersInfo = {
                            sp: sp,
                            idp: idp,
                            mapping: ssoConfig.FieldMapping,
                            settings: ssoConfig
                        };

                        req.providersInfo = providersInfo;

                        return resolve(next());

                    } catch (e) {
                        logger.error(e);
                    }

                    return resolve(res.redirect(urlResolver
                        .getPortalAuthErrorUrl(req, urlResolver.ErrorMessageKey.SsoError)));
                });

            })
            .catch(error => {
                logger.error(error);
                return res.redirect(urlResolver.getPortal500Url(req));
            });

    });
}