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


const apiRequestManager = require('../apiRequestManager.js').apiManager,
    config = require('../../config'),
    moment = require('moment');

function paymentCheck(req, res, next, quota, tariff) {
    if (quota && quota.features.indexOf('controlpanel') > -1 && tariff && tariff.state < 3) {
        next();
        return;
    }
    if (req.session) {
        req.session.destroy(() => {
            res.statusCode = 402;
            res.end();
        });
    } else {
        res.statusCode = 402;
        res.end();
    }
}

function prepareData(cultureName, tenantExtra) {
    const maxDateValue = new Date(9999, 11, 31, 23, 59, 59, 999);

    moment.locale(cultureName.substring(0, 2));

    const dueDate = new Date(tenantExtra.tariff.dueDate);

    tenantExtra.tariff.dueDateStr = moment(dueDate).format('dddd, LL');
    tenantExtra.tariff.dueDateIsMax = dueDate.getTime() == maxDateValue.getTime();

    const licenseDate = new Date(tenantExtra.tariff.licenseDate);

    tenantExtra.tariff.licenseDateStr = moment(licenseDate).format('dddd, LL');
    tenantExtra.tariff.licenseDateIsMax = licenseDate.getTime() == maxDateValue.getTime();

    if (tenantExtra.notPaid) {
        tenantExtra.tariff.state = 3;
    }
}

module.exports = function (req, res, next) {
    if (req.url === config.makePath() || req.url === config.makePath("resource")) {
        next();
        return;
    }

    if (req.session.quota && req.session.tariff) {
        paymentCheck(req, res, next, req.session.quota, req.session.tariff);
        return;
    }


    apiRequestManager.get("portal/tenantextra", req)
        .then((result) => {
            prepareData(req.session.user.cultureName, result);

            req.session.quota = result.quota;
            req.session.tariff = result.tariff;

            req.session.tenantExtra = {
                customMode: result.customMode,
                opensource: result.opensource,
                enterprise: result.enterprise,
                licenseAccept: result.licenseAccept,
                trial: result.tariff.state == 0,
                defaultTariff: result.quota.id == -1,
                enableTariffPage: result.enableTariffPage,
                docServerUserQuota: result.docServerUserQuota,
                docServerLicense: result.docServerLicense
            };

            paymentCheck(req, res, next, result.quota, result.tariff);
        })
        .catch((error) => {
            if (error == 404) {
                const urls = ["portal/quota", "portal/tariff"];
                Promise.all(urls.map((item) => apiRequestManager.get(item, req)))
                    .then(([quota, tariff]) => {
                        req.session.quota = quota;
                        req.session.tariff = tariff;

                        paymentCheck(req, res, next, quota, tariff);
                    })
                    .catch(() => {
                        paymentCheck(req, res, next);
                    });
            } else {
                paymentCheck(req, res, next);
            }
        });
}