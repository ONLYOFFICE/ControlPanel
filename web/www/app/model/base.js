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


const bundle = require('../bundle.js');
const config = require('../../config');
const portalManager = require('../portalManager.js');
const quota = require('../quota.js');

class baseModel
{
    constructor(req, title) {
        this.links = bundle.links;
        this.scripts = bundle.scripts;
        this.config = config;
        this.portalUrl = portalManager.getExternalPortalUrl(req);
        this.title = title;

        if (req.session) {
            if (req.session.quota) {
                this.quota = quota(req.session.quota);
            }
            if (req.session.tariff) {
                this.tariff = req.session.tariff;
            }
            if (req.session.tenantExtra) {
                this.tenantExtra = req.session.tenantExtra;
            }
            if (req.session.whiteLabelSettings) {
                this.whiteLabelSettings = req.session.whiteLabelSettings;
            }
            if (req.session.controlPanelSettings) {
                this.controlPanelSettings = req.session.controlPanelSettings;
            }
            if (req.session.user) {
                this.cultureName = req.session.user.cultureName;
            }
        }

        Object.assign(this, req.resources);
        this.multiPortals = this.cpMultiPortalsResource.MultiPortals;
        
    }
}

module.exports = baseModel;