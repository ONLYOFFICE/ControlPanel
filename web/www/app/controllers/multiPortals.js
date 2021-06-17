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


const
    router = require('express').Router(),
    pug = require('pug'),
    path = require('path'),
    moment = require('moment'),
    co = require('co'),
    url = require('url'),
    Model = require('../model/base.js'),
    arm = require('../apiRequestManager.js'),
    multiPortalsCompiled = pug.compileFile(path.join(__dirname, '..', '..', 'views', 'multiPortals.pug')),
    apiSystemManager = arm.apiSystemManager,
    apiRequestManager = arm.apiManager,
    executeHelper = require('../executeHelper.js'),
    config = require('../../config'),
    log = require("../log.js"),
    fullAccess = require('../middleware/fullAccess.js');

const quota = require("../quota.js");
const baseController = require("./base.js");
const dnsChecker = require('../dnsChecker.js');

function checkDomainName(req) {
    const domainName = req.body.domain;
    const controlPanelResource = req.resources.controlPanelResource;

    dnsChecker.checkDomainName(domainName, controlPanelResource)
}

function checkHosts(domainIps, hostIps) {
    if (!domainIps || !hostIps)
        return false;

    if (!Array.isArray(hostIps))
        hostIps = [hostIps];

    for (let hostIp of hostIps) {
        if (domainIps.indexOf(hostIp) != -1)
            return true;
    }

    return false;
}

function changeBaseDomain(req) {
    const baseOptions = {
        method: "POST",
        body: {
            tenantId: -1,
            key: "BaseDomain",
            value: req.body.domain
        },
        json: true
    };

    return apiSystemManager.makeRequest("settings/save", req, baseOptions);
}

function validatePortalName(req) {
    const baseOptions = {
        method: "POST",
        body: {
            portalName: req.body.alias,
            firstName: "",
            lastName: "",
            email: "test@test.test"
        },
        json: true
    };

    return apiSystemManager.makeRequest("portal/validateportalname", req, baseOptions);
}

function onError(res, error) {
    res.send({
        success: false,
        message: typeof error === 'string' ? error : error.message
    });
    res.end();
}

function getVsyscallError(controlPanelResource, helpcenter) {
    if(!helpcenter) return controlPanelResource.ErrorVsyscall;

    return [
        controlPanelResource.ErrorVsyscall,
        " <a target='_blank' href='",
        controlPanelResource.ErrorVsyscallHelpCenterUrl.replace("{0}", helpcenter),
        "'>",
        controlPanelResource.LearnMore,
        "</a>"
    ].join("");
}

router
    .use(require('../middleware/quota.js')("countPortals"))
    .use(fullAccess())
    .get("/", (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(multiPortalsCompiled(new Model(req, req.resources.cpMultiPortalsResource.MultiPortals)));
    })
    .get("/getBaseDomainAndTenantDomain", (req, res) => {
        const getPortalInfo = apiRequestManager.get("portal.json", req);
        const getSettings = apiSystemManager.get("settings/get?tenantId=-1&key=BaseDomain", req);

        Promise.all([getPortalInfo, getSettings])
            .then((results) => {
                const defaultDomain = config.defaultDomain;
                const portalInfo = results[0],
                    baseDomain = results[1].settings || defaultDomain;

                res.send({
                    success: true,
                    baseDomain: baseDomain,
                    tenantId: portalInfo.tenantId,
                    isdomaindefault: (baseDomain === defaultDomain)
                });
                res.end();
            })
            .catch((error) => {
                onError(res, error);
            });
    })
    .get("/getLinkedPortals", (req, res) => {
        apiSystemManager.get("portal/get", req)
            .then((result) => {
                res.send({
                    success: true,
                    data: result
                });
                res.end();
            })
            .catch((error) => {
                onError(res, error);
            });
    })
    .get("/getPortalsQuota", (req, res) => {
        res.send({
            success: true,
            countPortals: quota(req.session.quota).countportals,
            dueDate: req.session.tariff.dueDate.startsWith('9999-12-31')
                ? ''
                : moment(req.session.tariff.dueDate).format('dddd, MMMM DD, YYYY')
        });

        res.end();
    })
    .post("/setBaseDomainAndTenantName", (req, res) => {
        try {
            checkDomainName(req);
        } catch (err) {
            onError(res, err);
            return;
        }

        co(function* () {
            if (config.get("check.dns")) {
                const [domainIps, hostIp] = yield [dnsChecker.getIpsByDomain(req.body.domain), dnsChecker.getHostIp(req.headers["x-rewriter-url"])];

                if (!checkHosts(domainIps, hostIp)) {
                    onError(res, "domainNameDNS")
                    return;
                }
            }

            yield validatePortalName(req);
            yield changeBaseDomain(req);
            const result = yield apiRequestManager.put("portal/portalrename.json", req);
            yield baseController.generateLetsEncryptCertificate(req);

            const parsed = url.parse(result.reference);
            const reference = `${parsed.protocol}//${req.body.alias}.${req.body.domain}${parsed.path}`;

            res.send({
                success: true,
                message: result.message,
                reference
            });
            res.end();
        }).catch((err) => {
            log.error("setBaseDomainAndTenantName", err);
            onError(res, err);
        });
    })
    .post("/changeBaseDomain", (req, res) => {
        try {
            checkDomainName(req);
        } catch (err) {
            onError(res, err);
            return;
        }

        co(function*() {
                if (config.get("check.dns")) {
                    const [domainIps, hostIp] = yield [dnsChecker.getIpsByDomain(req.body.domain), dnsChecker.getHostIp(req.headers["x-rewriter-url"])];

                    if (!checkHosts(domainIps, hostIp)) {
                        onError(res, "domainNameDNS")
                        return;
                    }
                }

                const result = yield changeBaseDomain(req);
                yield baseController.generateLetsEncryptCertificate(req);
                res.send({
                    success: true,
                    baseDomain: result.settings
                });
                res.end();
            })
            .catch((err) => {
                log.error("changeBaseDomain", err);
                onError(res, err);
            });
    })
    .post("/createNewTenant", (req, res) => {
        co(function*() {
            const getPortalInfo = apiRequestManager.get("portal.json", req);
            const getLinkedPortals = apiSystemManager.get("portal/get", req);

            const [portalInfo, linkedPortals] = yield [getPortalInfo, getLinkedPortals];
            const countportals = quota(req.session.quota).countportals;

            if (linkedPortals.length > countportals) {
                res.send({
                    success: false,
                    message: "portalsCountTooMuch"
                });
                res.end();
                return '';
            }
            const user = req.session.user;
            const timeZoneName = portalInfo.timeZone ? portalInfo.timeZone.id : "";
            const language = portalInfo.language ? portalInfo.language.substring(0, 2) : "";

            const data = {
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email,
                phone: user.mobilePhone,
                portalName: req.body.alias,
                timeZoneName,
                language,
                limitedControlPanel: req.body.limitedControlPanel
            };

            const result = yield apiSystemManager.makeRequest("portal/register",
                req,
                {
                    method: "POST",
                    body: data,
                    json: true
                });

            yield baseController.generateLetsEncryptCertificate(req);

            res.send({
                success: true,
                data: result
            });
            res.end();
        })
        .catch((err) => {
            onError(res, err);
        });
    })
    .post("/checkDomainName", (req, res) => {
        try {
            checkDomainName(req);
        } catch (err) {
            onError(res, err);
            return;
        }

        co(function*() {
                if (config.get("check.dns")) {
                    const [domainIps, hostIp] = yield [dnsChecker.getIpsByDomain(req.body.domain), dnsChecker.getHostIp(req.headers["x-rewriter-url"])];

                    if (!checkHosts(domainIps, hostIp)) {
                        onError(res, req.resources.controlPanelResource.ErrorDomainNameDNS)
                        return;
                    }
                }

                if (config.get("check.vsyscall")) {
                    const vsyscallEnabled = yield executeHelper("tools/check-vsyscall.sh");

                    if (vsyscallEnabled == "false") {
                        onError(res, getVsyscallError(req.resources.controlPanelResource, config.get("helpcenter")));
                        return;
                    }
                }

                res.send({
                    success: true,
                    domain: req.body.domain
                });
                res.end();
            })
            .catch((err) => {
                log.error("checkDomainName", err);
                onError(res, err);
            });
    });

module.exports = router;