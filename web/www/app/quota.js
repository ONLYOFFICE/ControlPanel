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


module.exports = (quota) => {
    return new Proxy(quota,
    {
        get: function(target, property) {
            if (property in target) {
                return target[property];
            }

            if (target.features) {
                const features = target.features.toLowerCase().split(','),
                    prop = property.toLowerCase();

                if (prop === "countportals") {
                    let result = features.find((item) => item.startsWith("portals:"));
                    if (result) {
                        result = result.split(':')[1];
                        return Number.isNaN(result) ? 0 : new Number(result);
                    }
                }

                if (features.indexOf(prop) > -1) {
                    return true;
                };

                return undefined;
            }

            return undefined;
        }
    });
}