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


const basePath = '../../public/resources/';

class Resource {
    constructor(jsKey, name, lang) {
        this.jsKey = jsKey;

        let resource;
        try {
            resource = require(`${basePath}/${name}.${lang && lang !== 'en' ? lang + '.' : ''}json`);
        } catch (e) {
            resource = require(`${basePath}/${name}.json`);
        }
        resource.lang = lang;

        Object.assign(this, resource);
    }
    toString() {
        return this.jsKey + "=" + JSON.stringify(this) + ";";
    }
    format(key, ...params) {
        let result = this[key];

        if (!result) return result;

        for (let i = 0; i < params.length; i++) {
            const reg = new RegExp(`\\{${i}\\}`, "gm");
            result = result.replace(reg, params[i]);
        }
        return result;
    }
}


module.exports = function(req, res, next) {
    let lang = 'en';
    if (req.session && req.session.user && req.session.user.cultureName) {
        lang = req.session.user.cultureName.substring(0, 2);
    }
    req.resources = {
        controlPanelResource: new Resource("Resource", "ControlPanelResource", lang),
        cpCountriesResource: new Resource("CountriesResource", "CPCountriesResource", lang),
        cpMultiPortalsResource: new Resource("MultiPortalsResource", "CPMultiPortalsResource", lang),
        cpLdapResource: new Resource("LdapResource", "CPLdapResource", lang),
        cpSsoResource: new Resource("CPSsoResource", "CPSsoResource", lang),
        cpWhiteLabelResource: new Resource("CPWhiteLabelResource", "CPWhiteLabelResource", lang)
    };
    next();
}