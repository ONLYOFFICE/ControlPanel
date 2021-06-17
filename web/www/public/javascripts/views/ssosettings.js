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


window.SsoSettings = (function() {
    var isInit = false,

        currentSettings = null,
        defaultSettings = null,
        ssoConstants = null,
        spMetadata = null,

        tmpIdpCertificates = [],
        tmpSPCertificates = [],
        tmpCertificate = null,
        tmpCertificateIndex = null,

        $ssoMainContainer = $(".sso-main-container"),

        $ssoEnableBtn = $("#ssoEnableBtn"),

        $ssoSPSettingsSpoilerLink = $("#ssoSPSettingsSpoilerLink"),
        $ssoSPSettingsSpoiler = $("#ssoSPSettingsSpoiler"),

        $ssoUploadMetadataInput = $("#ssoUploadMetadataInput"),
        $ssoUploadMetadataBtn = $("#ssoUploadMetadataBtn"),
        $ssoSelectMetadataBtn = $("#ssoSelectMetadataBtn"),
        $ssoSelectMetadataInput = $("#ssoSelectMetadataInput"),

        $ssoSpLoginLabel = $("#ssoSpLoginLabel"),
        $ssoEntityId = $("#ssoEntityId"),

        $ssoSignPostRbx = $("#ssoSignPostRbx"),
        $ssoSignPostUrl = $("#ssoSignPostUrl"),
        $ssoSignRedirectRbx = $("#ssoSignRedirectRbx"),
        $ssoSignRedirectUrl = $("#ssoSignRedirectUrl"),

        $ssoLogoutPostRbx = $("#ssoLogoutPostRbx"),
        $ssoLogoutPostUrl = $("#ssoLogoutPostUrl"),
        $ssoLogoutRedirectRbx = $("#ssoLogoutRedirectRbx"),
        $ssoLogoutRedirectUrl = $("#ssoLogoutRedirectUrl"),

        $ssoNameIdFormat = $("#ssoNameIdFormat"),

        $ssoIdPCertificateContainer = $("#ssoIdPCertificateContainer"),
        $ssoAddIdPCertificateBtn = $("#ssoAddIdPCertificateBtn"),
        $ssoIdpCertificateSpoilerLink = $("#ssoIdpCertificateSpoilerLink"),
        $ssoIdpCertificateSpoiler = $("#ssoIdpCertificateSpoiler"),

        $ssoVerifyAuthResponsesSignCbx = $("#ssoVerifyAuthResponsesSignCbx"),
        $ssoVerifyLogoutRequestsSignCbx = $("#ssoVerifyLogoutRequestsSignCbx"),
        $ssoVerifyLogoutResponsesSignCbx = $("#ssoVerifyLogoutResponsesSignCbx"),
        $ssoDecryptAssertionsCbx = $("#ssoDecryptAssertionsCbx"),
        $ssoDefaultSignVerifyingAlgorithm = $("#ssoDefaultSignVerifyingAlgorithm"),
        $ssoDefaultDecryptAlgorithm = $("#ssoDefaultDecryptAlgorithm"),

        $ssoSPCertificateContainer = $("#ssoSPCertificateContainer"),
        $ssoAddSPCertificateBtn = $("#ssoAddSPCertificateBtn"),
        $ssoSpCertificateSpoilerLink = $("#ssoSpCertificateSpoilerLink"),
        $ssoSpCertificateSpoiler = $("#ssoSpCertificateSpoiler"),

        $ssoSignAuthRequestsCbx = $("#ssoSignAuthRequestsCbx"),
        $ssoSignLogoutRequestsCbx = $("#ssoSignLogoutRequestsCbx"),
        $ssoSignLogoutResponsesCbx = $("#ssoSignLogoutResponsesCbx"),
        $ssoEncryptAssertionsCbx = $("#ssoEncryptAssertionsCbx"),
        $ssoSigningAlgorithm = $("#ssoSigningAlgorithm"),
        $ssoEncryptAlgorithm = $("#ssoEncryptAlgorithm"),

        $ssoFirstName = $("#ssoFirstName"),
        $ssoLastName = $("#ssoLastName"),
        $ssoEmail = $("#ssoEmail"),
        $ssoLocation = $("#ssoLocation"),
        $ssoTitle = $("#ssoTitle"),
        $ssoPhone = $("#ssoPhone"),

        $ssoSaveBtn = $("#ssoSaveBtn"),
        $ssoResetBtn = $("#ssoResetBtn"),

        $ssoSPEntityId = $("#ssoSPEntityId"),
        $ssoSPConsumerUrl = $("#ssoSPConsumerUrl"),
        $ssoSPLogoutUrl = $("#ssoSPLogoutUrl"),

        $ssoDownloadSPMetadataBtn = $("#ssoDownloadSPMetadataBtn"),

        $ssoIdpCertificateDialog = $("#ssoIdpCertificateDialog"),
        $ssoIdpPublicCertificate = $("#ssoIdpPublicCertificate"),
        $ssoIdpCertificateActionType = $("#ssoIdpCertificateActionType"),
        $ssoIdpCertificateOkBtn = $("#ssoIdpCertificateOkBtn"),

        $ssoSpCertificateDialog = $("#ssoSpCertificateDialog"),
        $ssoSpCertificateGenerateBtn = $("#ssoSpCertificateGenerateBtn"),
        $ssoSpPublicCertificate = $("#ssoSpPublicCertificate"),
        $ssoSpPrivateKey = $("#ssoSpPrivateKey"),
        $ssoSpCertificateActionType = $("#ssoSpCertificateActionType"),
        $ssoSpCertificateOkBtn = $("#ssoSpCertificateOkBtn"),

        $certificatesTmpl = $("#certificatesTmpl"),
        $certificateItemTmpl = $("#certificateItemTmpl"),
        
        $ssoSettingsInviteDialog = $("#ssoSettingsInviteDialog"),
        $ssoSettingsTurnOffDialog = $("#ssoSettingsTurnOffDialog"),

        $ssoHideAuthPageCbx = $("#ssoHideAuthPage");

    function getSettings() {
        var isSignPost = $ssoSignPostRbx.hasClass("checked");
        var isLogoutPost = $ssoLogoutPostRbx.hasClass("checked");

        return {
            enableSso: $ssoEnableBtn.hasClass("on"),
            spLoginLabel: $ssoSpLoginLabel.val().trim(),
            idpSettings: {
                entityId: $ssoEntityId.val().trim(),
                ssoUrl: isSignPost ? $ssoSignPostUrl.val().trim() : $ssoSignRedirectUrl.val().trim(),
                ssoBinding: isSignPost ? $ssoSignPostRbx.attr("data-bind") : $ssoSignRedirectRbx.attr("data-bind"),
                sloUrl: isLogoutPost ? $ssoLogoutPostUrl.val().trim() : $ssoLogoutRedirectUrl.val().trim(),
                sloBinding: isLogoutPost ? $ssoLogoutPostRbx.attr("data-bind") : $ssoLogoutRedirectRbx.attr("data-bind"),
                nameIdFormat: window.Common.selectorListener.get($ssoNameIdFormat),
            },
            idpCertificates: tmpIdpCertificates,
            idpCertificateAdvanced: {
                verifyAlgorithm: window.Common.selectorListener.get($ssoDefaultSignVerifyingAlgorithm),
                verifyAuthResponsesSign: $ssoVerifyAuthResponsesSignCbx.hasClass("checked"),
                verifyLogoutRequestsSign: $ssoVerifyLogoutRequestsSignCbx.hasClass("checked"),
                verifyLogoutResponsesSign: $ssoVerifyLogoutResponsesSignCbx.hasClass("checked"),
                decryptAlgorithm: window.Common.selectorListener.get($ssoDefaultDecryptAlgorithm),
                decryptAssertions: $ssoDecryptAssertionsCbx.hasClass("checked")
            },
            spCertificates: tmpSPCertificates,
            spCertificateAdvanced: {
                decryptAlgorithm: null,
                signingAlgorithm: window.Common.selectorListener.get($ssoSigningAlgorithm),
                signAuthRequests: $ssoSignAuthRequestsCbx.hasClass("checked"),
                signLogoutRequests: $ssoSignLogoutRequestsCbx.hasClass("checked"),
                signLogoutResponses: $ssoSignLogoutResponsesCbx.hasClass("checked"),
                encryptAlgorithm: window.Common.selectorListener.get($ssoEncryptAlgorithm),
                encryptAssertions: $ssoEncryptAssertionsCbx.hasClass("checked")
            },
            fieldMapping: {
                firstName: $ssoFirstName.val().trim(),
                lastName: $ssoLastName.val().trim(),
                email: $ssoEmail.val().trim(),
                title: $ssoTitle.val().trim(),
                location: $ssoLocation.val().trim(),
                phone: $ssoPhone.val().trim()
            },
            hideAuthPage: $ssoHideAuthPageCbx.hasClass("checked")
        };
    }

    function setDefaultSettings(partial) {
        $ssoUploadMetadataInput.val("");

        enableSso(defaultSettings.enableSso);

        $ssoSpLoginLabel.val(defaultSettings.spLoginLabel);
        $ssoEntityId.val(defaultSettings.idpSettings.entityId);

        if (defaultSettings.idpSettings.ssoBinding === ssoConstants.ssoBindingType.saml20HttpPost) {
            $ssoSignPostRbx.click();
            $ssoSignPostUrl.val(defaultSettings.idpSettings.ssoUrl);
            $ssoSignRedirectUrl.val("");
        } else {
            $ssoSignRedirectRbx.click();
            $ssoSignPostUrl.val("");
            $ssoSignRedirectUrl.val(defaultSettings.idpSettings.ssoUrl);
        }

        if (defaultSettings.idpSettings.sloBinding === ssoConstants.ssoBindingType.saml20HttpPost) {
            $ssoLogoutPostRbx.click();
            $ssoLogoutPostUrl.val(defaultSettings.sloUrl);
            $ssoLogoutRedirectUrl.val("");
        } else {
            $ssoLogoutRedirectRbx.click();
            $ssoLogoutPostUrl.val("");
            $ssoLogoutRedirectUrl.val(defaultSettings.sloUrl);
        }

        window.Common.selectorListener.set($ssoNameIdFormat, defaultSettings.idpSettings.nameIdFormat);

        tmpIdpCertificates = defaultSettings.idpCertificates;

        renderIdpCertificates(false);

        window.Common.selectorListener.set($ssoDefaultSignVerifyingAlgorithm, defaultSettings.idpCertificateAdvanced.verifyAlgorithm);

        if (defaultSettings.idpCertificateAdvanced.verifyAuthResponsesSign)
            $ssoVerifyAuthResponsesSignCbx.addClass("checked");
        else
            $ssoVerifyAuthResponsesSignCbx.removeClass("checked");

        if (defaultSettings.idpCertificateAdvanced.verifyLogoutRequestsSign)
            $ssoVerifyLogoutRequestsSignCbx.addClass("checked");
        else
            $ssoVerifyLogoutRequestsSignCbx.removeClass("checked");

        if (defaultSettings.idpCertificateAdvanced.verifyLogoutResponsesSign)
            $ssoVerifyLogoutResponsesSignCbx.addClass("checked");
        else
            $ssoVerifyLogoutResponsesSignCbx.removeClass("checked");

        window.Common.selectorListener.set($ssoDefaultDecryptAlgorithm, defaultSettings.idpCertificateAdvanced.decryptAlgorithm);

        if (defaultSettings.idpCertificateAdvanced.decryptAssertions)
            $ssoDecryptAssertionsCbx.addClass("checked");
        else
            $ssoDecryptAssertionsCbx.removeClass("checked");

        if (partial) return;

        tmpSPCertificates = defaultSettings.spCertificates;

        renderSpCertificates(false);

        window.Common.selectorListener.set($ssoSigningAlgorithm, defaultSettings.spCertificateAdvanced.signingAlgorithm);

        if (defaultSettings.spCertificateAdvanced.signAuthRequests)
            $ssoSignAuthRequestsCbx.addClass("checked");
        else
            $ssoSignAuthRequestsCbx.removeClass("checked");

        if (defaultSettings.spCertificateAdvanced.signLogoutRequests)
            $ssoSignLogoutRequestsCbx.addClass("checked");
        else
            $ssoSignLogoutRequestsCbx.removeClass("checked");

        if (defaultSettings.spCertificateAdvanced.signLogoutResponses)
            $ssoSignLogoutResponsesCbx.addClass("checked");
        else
            $ssoSignLogoutResponsesCbx.removeClass("checked");

        window.Common.selectorListener.set($ssoEncryptAlgorithm, defaultSettings.spCertificateAdvanced.encryptAlgorithm);

        if (defaultSettings.spCertificateAdvanced.encryptAssertions)
            $ssoEncryptAssertionsCbx.addClass("checked");
        else
            $ssoEncryptAssertionsCbx.removeClass("checked");

        $ssoFirstName.val(defaultSettings.fieldMapping.firstName);
        $ssoLastName.val(defaultSettings.fieldMapping.lastName);
        $ssoEmail.val(defaultSettings.fieldMapping.email);
        $ssoTitle.val(defaultSettings.fieldMapping.title);
        $ssoLocation.val(defaultSettings.fieldMapping.location);
        $ssoPhone.val(defaultSettings.fieldMapping.phone);

        if (defaultSettings.hideAuthPage)
            $ssoHideAuthPageCbx.addClass("checked");
        else
            $ssoHideAuthPageCbx.removeClass("checked");
    }

    function enableSso(on) {
        $ssoEnableBtn.toggleClass("off", !on).toggleClass("on", on);
        
        if (on && $ssoSPSettingsSpoiler.hasClass("display-none")) {
            $ssoSPSettingsSpoilerLink.click();
        }

        enableInputs(on);

        window.Common.requiredField.hideErrors();

        onSettingsChanged();
        enableIdpAdvancedSettings(on);
        enableSpAdvancedSettings(on);
    }

    function onSsoEnabled() {
        var $this = $(this);
        var on = $this.hasClass("off");

        if(currentSettings.enableSso) {
            Common.blockUI.show("ssoSettingsTurnOffDialog", 500, 500, 0);
        }
        else {
            enableSso(on);
        }
    }

    function enableInputs(enabled, parent) {
        parent = parent || $ssoMainContainer;
        parent.find("input:not(.blocked), textarea:not(.blocked)").attr("disabled", !enabled);
        parent.find(".selectBox, .radioBox, .checkBox, .button:not(.on-off-button)").toggleClass("disabled", !enabled);
    }

    function onSettingsChanged() {
        var hasUserChanges = hasChanges();
        var isDefaultSettings = isDefault();

        enableSaveBtn(hasUserChanges);
        enableResetBtn(!isDefaultSettings);
        enableDownloadBtn(!hasUserChanges && !isDefaultSettings);
    }

    function onCheckBoxChanged() {
        if ($(this).hasClass("disabled")) return;

        onSettingsChanged();
    }

    function onRadioBoxChanged() {
        var $this = $(this);

        if ($this.hasClass("disabled")) return;

        $this.closest(".sso-settings-block").find(".textBox").addClass("display-none");
        $("#" + $this.attr("data-value")).removeClass("display-none");

        onSettingsChanged();
    }

    function hasChanges() {
        return !isEqual(currentSettings, getSettings());
    }

    function isDefault() {
        return isEqual(currentSettings, defaultSettings);
    }

    function isEqual(a, b) {
        if (a === null || b === null)
            return a === b;

        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);

        if (aProps.length != bProps.length) {
            return false;
        }

        for (var i = 0; i < aProps.length; i++) {
            var propName = aProps[i];

            if (typeof a[propName] == "object") {
                if (!isEqual(a[propName], b[propName])) {
                    return false;
                }
            } else {
                if (a[propName] !== b[propName]) {
                    return false;
                }
            }
        }

        return true;
    }

    function includePropertyValue(obj, value) {
        var props = Object.getOwnPropertyNames(obj);

        for (var i = 0; i < props.length; i++) {
            if (obj[props[i]] === value)
                    return true;
        }

        return false;
    }

    function enableSaveBtn(enabled) {
        $ssoSaveBtn.toggleClass("disabled", !enabled);
    }

    function enableResetBtn(enabled) {
        $ssoResetBtn.toggleClass("disabled", !enabled);
    }

    function enableDownloadBtn(enabled) {
        $ssoDownloadSPMetadataBtn.toggleClass("disabled", !enabled);
    }

    function saveSettings() {
        if ($(this).hasClass("disabled"))
            return;

        var validSettings = getValidSettings();

        if (!validSettings) {
            enableSaveBtn(false);
            return;
        }

        window.Common.loader.show();

        window.ApiService.post("sso/settings", { serializeSettings: JSON.stringify(validSettings) })
            .then(showSuccess, showError)
            .always(function() {
                onSettingsChanged();
                window.Common.loader.hide();
            });
    }

    function getValidSettings() {
        window.Common.requiredField.hideErrors();

        var isValid = true;
        var settings = getSettings();

        if (!settings.spLoginLabel) {
            isValid = false;
            window.Common.requiredField.showError($ssoSpLoginLabel);
        }

        if (!settings.idpSettings.entityId) {
            isValid = false;
            window.Common.requiredField.showError($ssoEntityId);
        }

        if (!settings.idpSettings.ssoUrl) {
            isValid = false;
            window.Common.requiredField.showError($ssoSignPostRbx.hasClass("checked") ? $ssoSignPostUrl : $ssoSignRedirectUrl);
        }

        if (!settings.fieldMapping.firstName) {
            isValid = false;
            window.Common.requiredField.showError($ssoFirstName);
        }

        if (!settings.fieldMapping.lastName) {
            isValid = false;
            window.Common.requiredField.showError($ssoLastName);
        }

        if (!settings.fieldMapping.email) {
            isValid = false;
            window.Common.requiredField.showError($ssoEmail);
        }

        var verificationCertificates = $.grep(settings.idpCertificates, function (item) {
            return  item.action == ssoConstants.ssoIdpCertificateActionType.verification ||
            item.action == ssoConstants.ssoIdpCertificateActionType.verificationAndDecrypt;
        });

        if (verificationCertificates.length > 1) {
            isValid = false;
            window.toastr.error(window.Resource.SsoCertificateMultipleVerificationError);
        }

        return isValid ? settings : null;
    }

    function showSuccess(data) {
        currentSettings = data;
        toastr.success(window.Resource.LdapSettingsSuccess);

        if (!currentSettings.enableSso)
            window.Common.spoiler.toggle("#ssoSPSettingsSpoiler", "#ssoSPSettingsSpoilerLink", false); //currentSettings.enableSso ? false : true);

        window.Common.spoiler.toggle("#ssoSPMetadataSpoiler", "#ssoSPMetadataSpoilerLink", currentSettings.enableSso ? true : false);

        // Scroll page to full bottom
        $("html, body").animate({ scrollTop: $(document).height() }, 1000);
    }

    function showError(error) {
        window.toastr.error((error ? error.responseText || error.statusText : null) || window.Resource.OperationFailedError);
    }

    function resetSettings() {
        if ($(this).hasClass("disabled"))
            return;

        Common.blockUI.show("ssoSettingsInviteDialog", 500, 500, 0);
    }

    function bindUploader() {
        $ssoSelectMetadataInput.fileupload({
            url: window.Common.basePath + "sso/uploadmetadata",
            dataType: "json",
            autoUpload: true,
            singleFileUploads: true,
            sequentialUploads: true,
            progress: function() {
                window.Common.loader.show();
            },
            add: function(e, data) {
                var fileName = data.files[0].name;
                if (getFileExtension(fileName) !== ".xml") {
                    toastr.error(window.Resource.SsoMetadataFileTypeError);
                } else {
                    data.submit().then(fillFieldsByMetadata, showError);
                }
            },
            always: function() {
                window.Common.loader.hide();
            }
        });
    }

    function getFileExtension(fileName) {
        if (!fileName) return "";

        var posExt = fileName.lastIndexOf(".");
        return posExt >= 0 ? fileName.substring(posExt).trim().toLowerCase() : "";
    }

    function getUniqueItems(array) {
        return array.filter(function (item, index, array) { 
            return array.indexOf(item) == index
        });
    }

    function loadMetadata() {
        if ($(this).hasClass("disabled"))
            return;

        var url = $ssoUploadMetadataInput.val().trim();

        if (!url || !window.Common.isValidUrl(url)) {
            $ssoUploadMetadataInput.toggleClass("error", true);
            return;
        }

        $ssoUploadMetadataInput.toggleClass("error", false);

        window.Common.loader.show();

        window.ApiService.post("sso/loadmetadata", { url: url })
            .then(function (res) {
                fillFieldsByMetadata(res);
            }, showError)
            .always(function () {
                window.Common.loader.hide();
            });;
    }

    function fillFieldsByMetadata(res) {
        setDefaultSettings(true);
        enableSso(true);

        var metadata = res.meta;
        var value;

        if (metadata.entityID)
            $ssoEntityId.val(metadata.entityID || "");

        if (metadata.singleSignOnService) {
            value = getPropValue(metadata.singleSignOnService, ssoConstants.ssoBindingType.saml20HttpPost);
            if (value) {
                $ssoSignPostUrl.val(value);
                $ssoSignPostRbx.click();
            }

            value = getPropValue(metadata.singleSignOnService, ssoConstants.ssoBindingType.saml20HttpRedirect);
            if (value) {
                $ssoSignRedirectUrl.val(value);
                $ssoSignRedirectRbx.click();
            }
        }

        if (metadata.singleLogoutService) {
            value = getPropValue(metadata.singleLogoutService, ssoConstants.ssoBindingType.saml20HttpPost);
            if (value) {
                $ssoLogoutPostUrl.val(value);
                $ssoLogoutPostRbx.click();
            }

            value = getPropValue(metadata.singleLogoutService, ssoConstants.ssoBindingType.saml20HttpRedirect);
            if (value) {
                $ssoLogoutRedirectUrl.val(value);
                $ssoLogoutRedirectRbx.click();
            }
        }

        if (metadata.nameIDFormat) {
            if (Array.isArray(metadata.nameIDFormat)) {
                var formats = metadata.nameIDFormat.filter(function (format) {
                    return includePropertyValue(ssoConstants.ssoNameIdFormatType, format);
                });
                if (formats.length) {
                    window.Common.selectorListener.set($ssoNameIdFormat, formats[0]);
                }
            } else {
                if (includePropertyValue(ssoConstants.ssoNameIdFormatType, metadata.nameIDFormat)) {
                    window.Common.selectorListener.set($ssoNameIdFormat, metadata.nameIDFormat);
                }
            }
        }

        if (metadata.certificate) {
            var data = [];

            if (metadata.certificate.signing) {
                if (Array.isArray(metadata.certificate.signing)) {
                    metadata.certificate.signing = getUniqueItems(metadata.certificate.signing).reverse();
                    metadata.certificate.signing.forEach(function(signingCrt) {
                        data.push({
                            crt: signingCrt.trim(),
                            key: null,
                            action: ssoConstants.ssoIdpCertificateActionType.verification
                        });
                    });

                    if (data.length > 1) {
                        window.toastr.warning(window.Resource.SsoCertificateMultipleVerificationError);
                    }
                } else {
                    data.push({
                        crt: metadata.certificate.signing.trim(),
                        key: null,
                        action: ssoConstants.ssoIdpCertificateActionType.verification
                    });
                }
            }

            /*if (metadata.certificate.encryption) {
                if (Array.isArray(metadata.certificate.encryption)) {
                    metadata.certificate.encryption = getUniqueItems(metadata.certificate.encryption).reverse();
                    metadata.certificate.encryption.forEach(function(encryptionCrt) {
                        data.push({
                            crt: encryptionCrt.trim(),
                            key: null,
                            action: ssoConstants.ssoIdpCertificateActionType.verification
                        });
                    });
                } else {
                    data.push({
                        crt: metadata.certificate.encryption.trim(),
                        key: null,
                        action: ssoConstants.ssoIdpCertificateActionType.decrypt
                    });
                }
            }*/

            window.ApiService.post("sso/validatecerts", { certs: data })
                .then(function (res) {
                    tmpIdpCertificates = res;
                    renderIdpCertificates(true);
                    onSettingsChanged();
                }, showError);
        }

        window.Common.requiredField.hideErrors();
        onSettingsChanged();
    }

    function getPropValue(obj, propName) {
        var value = "";

        if (!obj) return value;

        if (obj.hasOwnProperty(propName))
            return obj[propName];

        if (obj.hasOwnProperty("binding") && obj.hasOwnProperty("location") && obj["binding"] == propName)
            return obj["location"];

        if (Array.isArray(obj)) {
            obj.forEach(function(item) {
                if (item.hasOwnProperty(propName)) {
                    value = item[propName];
                    return;
                }

                if (item.hasOwnProperty("binding") && item.hasOwnProperty("location") && item["binding"] == propName) {
                    value = item["location"]
                    return;
                }
            });
        }

        return value;
    }

    function onDownloadSPMetadata() {
        if ($(this).hasClass("disabled"))
            return;

        window.open($(this).attr("data-href"), "_blank");
    }

    function bindCopyToClipboard() {
        var clipboard = new Clipboard('.copyBtn');
        clipboard.on('success', function (e) {
            toastr.success(window.Resource.Copied);
            e.clearSelection();
        });
    }

    function renderIdpCertificates(changeIdpAdvancedSettings) {
        enableIdpAdvancedSettings(true);

        var array = $.map(tmpIdpCertificates, function (item) {
            return prepareCertificateData(item);
        });

        var html = $certificatesTmpl.tmpl({ items: array });
        html.appendTo($ssoIdPCertificateContainer.empty());

        if (changeIdpAdvancedSettings)
            $ssoIdpCertificateSpoiler.find(".checkBox").removeClass("checked");

        if (!array.length) return;

        if ($ssoIdpCertificateSpoiler.hasClass("display-none"))
            $ssoIdpCertificateSpoilerLink.click();

        if (!changeIdpAdvancedSettings) return;

        array.forEach(function (item) {
            if (item.action == ssoConstants.ssoIdpCertificateActionType.verification) {
                $ssoVerifyAuthResponsesSignCbx.addClass("checked");
                $ssoVerifyLogoutRequestsSignCbx.addClass("checked");
                //$ssoVerifyLogoutResponsesSignCbx.addClass("checked");
            }
            if (item.action == ssoConstants.ssoIdpCertificateActionType.decrypt) {
                $ssoDecryptAssertionsCbx.addClass("checked");
            }
            if (item.action == ssoConstants.ssoIdpCertificateActionType.verificationAndDecrypt) {
                $ssoVerifyAuthResponsesSignCbx.addClass("checked");
                $ssoVerifyLogoutRequestsSignCbx.addClass("checked");
                //$ssoVerifyLogoutResponsesSignCbx.addClass("checked");
                $ssoDecryptAssertionsCbx.addClass("checked");
            }
        });
    }

    function enableIdpAdvancedSettings(on) {
        $ssoIdpCertificateSpoiler.find(".checkBox, .selectBox").addClass("disabled");

        if (!on) return;

        tmpIdpCertificates.forEach(function (item) {
            if (item.action == ssoConstants.ssoIdpCertificateActionType.verification || item.action == ssoConstants.ssoIdpCertificateActionType.verificationAndDecrypt) {
                $ssoVerifyAuthResponsesSignCbx.removeClass("disabled");
                $ssoVerifyLogoutRequestsSignCbx.removeClass("disabled");
                $ssoVerifyLogoutResponsesSignCbx.removeClass("disabled");
                $ssoDefaultSignVerifyingAlgorithm.removeClass("disabled");
            }
            if (item.action == ssoConstants.ssoIdpCertificateActionType.decrypt || item.action == ssoConstants.ssoIdpCertificateActionType.verificationAndDecrypt) {
                $ssoDecryptAssertionsCbx.removeClass("disabled");
                $ssoDefaultDecryptAlgorithm.removeClass("disabled");
            }
        });
    }

    function renderSpCertificates(changeSpAdvancedSettings) {
        enableSpAdvancedSettings(true);

        var array = $.map(tmpSPCertificates, function (item) {
            return prepareCertificateData(item);
        });

        html = $certificatesTmpl.tmpl({ items: array });
        html.appendTo($ssoSPCertificateContainer.empty());

        if (changeSpAdvancedSettings)
            $ssoSpCertificateSpoiler.find(".checkBox").removeClass("checked");

        if (!array.length) return;

        if ($ssoSpCertificateSpoiler.hasClass("display-none"))
            $ssoSpCertificateSpoilerLink.click();

        if (!changeSpAdvancedSettings) return;

        array.forEach(function (item) {
            if (item.action == ssoConstants.ssoSpCertificateActionType.signing) {
                $ssoSignAuthRequestsCbx.addClass("checked");
                $ssoSignLogoutRequestsCbx.addClass("checked");
                //$ssoSignLogoutResponsesCbx.addClass("checked");
            }
            if (item.action == ssoConstants.ssoSpCertificateActionType.encrypt) {
                $ssoEncryptAssertionsCbx.addClass("checked");
            }
            if (item.action == ssoConstants.ssoSpCertificateActionType.signingAndEncrypt) {
                $ssoSignAuthRequestsCbx.addClass("checked");
                $ssoSignLogoutRequestsCbx.addClass("checked");
                //$ssoSignLogoutResponsesCbx.addClass("checked");
                $ssoEncryptAssertionsCbx.addClass("checked");
            }
        });
    }

    function enableSpAdvancedSettings(on) {
        $ssoSpCertificateSpoiler.find(".checkBox, .selectBox").addClass("disabled");

        if (!on) return;

        tmpSPCertificates.forEach(function (item) {
            if (item.action == ssoConstants.ssoSpCertificateActionType.signing || item.action == ssoConstants.ssoSpCertificateActionType.signingAndEncrypt) {
                $ssoSignAuthRequestsCbx.removeClass("disabled");
                $ssoSignLogoutRequestsCbx.removeClass("disabled");
                $ssoSignLogoutResponsesCbx.removeClass("disabled");
                $ssoSigningAlgorithm.removeClass("disabled");
            }
            if (item.action == ssoConstants.ssoSpCertificateActionType.encrypt || item.action == ssoConstants.ssoSpCertificateActionType.signingAndEncrypt) {
                $ssoEncryptAssertionsCbx.removeClass("disabled");
                $ssoEncryptAlgorithm.removeClass("disabled");
            }
        });
    }

    function prepareCertificateData(data) {
        var res = $.extend({}, data);

        var now = new Date();

        if (typeof res.startDate !== "object")
            res.startDate = new Date(res.startDate);

        if (typeof res.expiredDate !== "object")
            res.expiredDate = new Date(res.expiredDate);

        res.valid = (res.startDate < now && res.expiredDate > now);
        res.startDateStr = res.startDate.toLocaleDateString();
        res.expiredDateStr = res.expiredDate.toLocaleDateString();

        return res;
    }

    function renderSpMetadata() {
        var baseUrl = spMetadata.baseUrl || window.location.origin;

        $ssoSPEntityId.val(baseUrl + spMetadata.entityId).next(".copyBtn").attr("data-clipboard-text", baseUrl + spMetadata.entityId);

        $ssoSPConsumerUrl.val(baseUrl + spMetadata.consumerUrl).next(".copyBtn").attr("data-clipboard-text", baseUrl + spMetadata.consumerUrl);

        $ssoSPLogoutUrl.val(baseUrl + spMetadata.logoutUrl).next(".copyBtn").attr("data-clipboard-text", baseUrl + spMetadata.logoutUrl);

        $ssoDownloadSPMetadataBtn.attr("data-href", baseUrl + spMetadata.metadataUrl);
    }

    function showIdpCertificateDialog(certificate, index) {
        if ($(this).hasClass("disabled"))
            return;

        tmpCertificate = certificate;
        tmpCertificateIndex = index;

        window.Common.requiredField.hideErrors();
        $ssoIdpCertificateDialog.find("input, textarea").attr("disabled", false).val("");
        $ssoIdpCertificateDialog.find(".selectBox, .radioBox, .checkBox, .button").removeClass("disabled");

        if (certificate) {
            $ssoIdpPublicCertificate.val(certificate.crt);
            //window.Common.selectorListener.set($ssoIdpCertificateActionType, certificate.action);
            $ssoIdpCertificateDialog.find(".create-caption").addClass("display-none");
            $ssoIdpCertificateDialog.find(".edit-caption").removeClass("display-none");
        } else {
            $ssoIdpCertificateDialog.find(".create-caption").removeClass("display-none");
            $ssoIdpCertificateDialog.find(".edit-caption").addClass("display-none");
        }

        Common.blockUI.show("ssoIdpCertificateDialog", 600, 500, 0, 0, 1000);
    }

    function addIdpCertificate() {

        window.Common.requiredField.hideErrors();

        var isValid = true;

        var data = {
            crt: $ssoIdpPublicCertificate.val().trim(),
            key: null,
            action: ssoConstants.ssoIdpCertificateActionType.verification // window.Common.selectorListener.get($ssoIdpCertificateActionType)
        };

        if (!data.crt) {
            isValid = false;
            window.Common.requiredField.showError($ssoIdpPublicCertificate);
        }

        if (checkIdpCertificateExist(data)) {
            isValid = false;
            window.toastr.error(window.Resource.SsoCertificateActionTypeError);
        }

        if (!isValid) return;

        window.Common.loader.show();

        window.ApiService.post("sso/validatecerts", { certs: [data] })
            .then(function (res) {
                if (tmpCertificate) {
                    tmpIdpCertificates[tmpCertificateIndex] = res[0];
                } else {
                    tmpIdpCertificates = tmpIdpCertificates.concat(res);
                }

                renderIdpCertificates(true);
                onSettingsChanged();
                window.Common.blockUI.hide();
            }, showError)
            .always(function () {
                window.Common.loader.hide();
            });
    }

    function checkIdpCertificateExist(data) {

        var certificates = $.grep(tmpIdpCertificates, function (item) {
            return tmpCertificate ? item.action != tmpCertificate.action : true;
        });

        var exists = $.grep(certificates, function (item) {
            return item.action == ssoConstants.ssoIdpCertificateActionType.verificationAndDecrypt;
        });

        if (exists.length) {
            return true;
        }

        if (data.action == ssoConstants.ssoIdpCertificateActionType.verificationAndDecrypt && certificates.length) {
            return true;
        }

        exists = $.grep(certificates, function (item) {
            return item.action == data.action;
        });

        if (exists.length) {
            return true;
        }

        if (tmpCertificate) {
            var exists = $.grep(tmpIdpCertificates, function (item, i) {
                return  i != tmpCertificateIndex && item.action == data.action && item.crt == data.crt;
            });

            if (exists.length) {
                return true;
            }
        }

        return false;
    }

    function deleteIdpCertificate() {
        var index = $(this).parent().index();

        tmpIdpCertificates = $.grep(tmpIdpCertificates, function (item, i) {
            return i != index;
        });

        renderIdpCertificates(true);
        onSettingsChanged();
    }

    function editIdpCertificate() {
        var index = $(this).parent().index();

        var certificate = $.grep(tmpIdpCertificates, function (item, i) {
            return i == index;
        })[0];

        showIdpCertificateDialog(certificate, index);
    }

    function showSpCertificateDialog(certificate) {
        if ($(this).hasClass("disabled"))
            return;

        tmpCertificate = certificate;

        window.Common.requiredField.hideErrors();
        $ssoSpCertificateDialog.find("input, textarea").attr("disabled", false).val("");
        $ssoSpCertificateDialog.find(".selectBox, .radioBox, .checkBox, .button").removeClass("disabled");

        if (certificate) {
            $ssoSpPublicCertificate.val(certificate.crt);
            $ssoSpPrivateKey.val(certificate.key);
            window.Common.selectorListener.set($ssoSpCertificateActionType, certificate.action);
            $ssoSpCertificateDialog.find(".create-caption").addClass("display-none");
            $ssoSpCertificateDialog.find(".edit-caption").removeClass("display-none");
        } else {
            $ssoSpCertificateDialog.find(".create-caption").removeClass("display-none");
            $ssoSpCertificateDialog.find(".edit-caption").addClass("display-none");
        }

        Common.blockUI.show("ssoSpCertificateDialog", 600, 500, 0, 0, 1000);
    }

    function generateSpCertificate() {
        window.Common.loader.show();
        enableInputs(false, $ssoSpCertificateDialog);

        window.ApiService.get("sso/generatecert")
            .then(function (res) {
                $ssoSpPublicCertificate.val(res.crt);
                $ssoSpPrivateKey.val(res.key);
            },
            showError)
            .always(function () {
                window.Common.loader.hide();
                enableInputs(true, $ssoSpCertificateDialog);
            });
    }

    function addSpCertificate() {

        window.Common.requiredField.hideErrors();

        var isValid = true;

        var data = {
            crt: $ssoSpPublicCertificate.val().trim(),
            key: $ssoSpPrivateKey.val().trim(),
            action: window.Common.selectorListener.get($ssoSpCertificateActionType)
        };

        if (!data.crt) {
            isValid = false;
            window.Common.requiredField.showError($ssoSpPublicCertificate);
        }

        if (!data.key) {
            isValid = false;
            window.Common.requiredField.showError($ssoSpPrivateKey);
        }

        if (checkSpCertificateExist(data.action)) {
            isValid = false;
            window.toastr.error(window.Resource.SsoCertificateActionTypeError);
        }

        if (!isValid) return;

        window.Common.loader.show();

        window.ApiService.post("sso/validatecerts", { certs: [data] })
            .then(function (res) {

                if (tmpCertificate) {
                    tmpSPCertificates = $.grep(tmpSPCertificates, function (item) {
                        return item.action != tmpCertificate.action;
                    });
                }

                tmpSPCertificates = tmpSPCertificates.concat(res);
                renderSpCertificates(true);
                onSettingsChanged();
                window.Common.blockUI.hide();
            }, showError)
            .always(function () {
                window.Common.loader.hide();
            });
    }

    function checkSpCertificateExist(actionType) {

        var certificates = $.grep(tmpSPCertificates, function (item) {
            return tmpCertificate ? item.action != tmpCertificate.action : true;
        });

        var exists = $.grep(certificates, function (item) {
            return item.action == ssoConstants.ssoSpCertificateActionType.signingAndEncrypt;
        });

        if (exists.length) {
            return true;
        }

        if (actionType == ssoConstants.ssoSpCertificateActionType.signingAndEncrypt && certificates.length) {
            return true;
        }

        exists = $.grep(certificates, function (item) {
            return item.action == actionType;
        });

        if (exists.length) {
            return true;
        }

        return false;
    }

    function deleteSpCertificate() {
        var actionType = $(this).parent().find(".action").text().trim();

        tmpSPCertificates = $.grep(tmpSPCertificates, function (item) {
            return item.action != actionType;
        });

        renderSpCertificates(true);
        onSettingsChanged();
    }

    function editSpCertificate() {
        var actionType = $(this).parent().find(".action").text().trim();

        var certificate = $.grep(tmpSPCertificates, function (item) {
            return item.action == actionType;
        })[0];

        showSpCertificateDialog(certificate);
    }

    function closeDialog() {
        Common.blockUI.hide();
    }

    function init(current, defaults, constants, metadata, error) {

        if (error) {
            toastr.error(error);
            isInit = true;
            $(window).trigger("rightSideReady", null);
            return;
        }

        if (isInit) return;

        currentSettings = current;
        defaultSettings = defaults;
        ssoConstants = constants;
        spMetadata = metadata;

        tmpIdpCertificates = current.idpCertificates.slice();
        tmpSPCertificates = current.spCertificates.slice();

        if (currentSettings.enableSso) {
            onSettingsChanged();
        }

        $ssoEnableBtn.on("click", onSsoEnabled);

        $ssoSaveBtn.on("click", saveSettings);

        $ssoResetBtn.on("click", resetSettings);

        $ssoUploadMetadataBtn.on("click", loadMetadata);

        $ssoMainContainer.find("input, textarea").on("keyup", onSettingsChanged);

        $ssoMainContainer.find(".radioBox").on("click", onRadioBoxChanged);

        $ssoMainContainer.find(".checkBox").on("click", onCheckBoxChanged);

        $ssoNameIdFormat.on("valueChanged", onSettingsChanged);

        $ssoDefaultSignVerifyingAlgorithm.on("valueChanged", onSettingsChanged);

        $ssoDefaultDecryptAlgorithm.on("valueChanged", onSettingsChanged);

        $ssoSigningAlgorithm.on("valueChanged", onSettingsChanged);

        $ssoEncryptAlgorithm.on("valueChanged", onSettingsChanged);

        $ssoDownloadSPMetadataBtn.on("click", onDownloadSPMetadata);

        $ssoAddIdPCertificateBtn.on("click", function () {
            if ($(this).hasClass("disabled"))
                return;

            showIdpCertificateDialog(null, null);
        });

        $ssoIdpCertificateOkBtn.on("click", addIdpCertificate);

        $ssoIdPCertificateContainer.on("click", ".delete", deleteIdpCertificate);

        $ssoIdPCertificateContainer.on("click", ".edit", editIdpCertificate);

        $ssoAddSPCertificateBtn.on("click", function () {
            if ($(this).hasClass("disabled"))
                return;

            showSpCertificateDialog(null);
        });

        $ssoSpCertificateGenerateBtn.on("click", generateSpCertificate);

        $ssoSpCertificateOkBtn.on("click", addSpCertificate);

        $ssoSPCertificateContainer.on("click", ".delete", deleteSpCertificate);

        $ssoSPCertificateContainer.on("click", ".edit", editSpCertificate);

        $ssoSettingsInviteDialog.on("click", ".sso-settings-ok", function () {
            if ($(this).hasClass("disabled"))
                return;

            Common.blockUI.hide();

            window.Common.loader.show();

            window.ApiService.delete("sso/settings")
            .then(function(res) {
                    setDefaultSettings(false);
                    onSsoEnabled();
                    showSuccess(res);
                },
                showError)
            .always(function() {
                onSettingsChanged();
                closeDialog();
                window.Common.loader.hide();
            });
        });
        $ssoSettingsInviteDialog.on("click", ".sso-settings-cancel", closeDialog);

        $ssoUploadMetadataInput.on("input propertychange paste change", function () {
            $(this).toggleClass("error", false);
        });

        $ssoSettingsTurnOffDialog.on("click", ".sso-settings-ok", function () {
            if ($(this).hasClass("disabled"))
                return;

            enableSso(false);
            saveSettings();        
            closeDialog();
        });
        $ssoSettingsTurnOffDialog.on("click", ".sso-settings-cancel", closeDialog);

        bindUploader();

        renderIdpCertificates(false);
        renderSpCertificates(false);

        renderSpMetadata();

        bindCopyToClipboard();

        isInit = true;

        $(window).trigger("rightSideReady", null);
    }

    return {
        init: init
    };

})();