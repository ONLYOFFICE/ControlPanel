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


const co = require("co"),
      dns = require('dns'),
      url = require('url'),
      publicIp = require('public-ip'),
      config = require('../config');

function checkDomainName(domainName, controlPanelResource) {
    if (!domainName)
        throw new Error(controlPanelResource.ErrorDomainNameEmpty);

    if (domainName.length > 255)
        throw new Error(controlPanelResource.ErrorDomainNameTooLong);

    if (!domainName.match(config.regxMailDomain))
        throw new Error(controlPanelResource.ErrorDomainNameIncorrect);
}

function getIpsByDomain(domainName) {
    return new Promise((resolve, reject) => {
        dns.resolve4(domainName, (error, addresses) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(addresses);
        });
    });
}

function getHostIp(rewriteUrl) {
    if(rewriteUrl) {
        const hostname = url.parse(rewriteUrl).hostname;

        if (hostname != "localhost" && hostname != "127.0.0.1") {

            const ipRegEx = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

            if (ipRegEx.test(hostname)) {
                return new Promise((resolve, reject) => {
                    resolve(hostname);
                });
            }

            return getIpsByDomain(hostname);
        }
    }

    return co(function* () {
        return publicIp.v4();
    });
}

module.exports = { checkDomainName, getIpsByDomain, getHostIp };
