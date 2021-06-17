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


window.LdapSettings = (function() {
    var $ldapSettingsMainContainer = $(".ldap-settings-main-container"),
        $ldapSettingsUserContainer = $(".ldap-settings-user-container"),
        $ldapSettingsGroupContainer = $(".ldap-settings-group-container"),
        $ldapSettingsAuthContainer = $(".ldap-settings-auth-container"),
        $ldapSettingsSecurityContainer = $(".ldap-settings-security-container"),
        $ldapSettingsStartTlsCheckbox = $("#ldapSettingsStartTlsCheckbox"),
        $ldapSettingsSslCheckbox = $("#ldapSettingsSslCheckbox"),
        $ldapSettingsAdvancedContainer = $(".ldap-settings-advanced-container"),
        $ldapSettingsSendWelcomeEmailCheckbox = $("#ldapSettingsSendWelcomeEmail"),
        $ldapSettingsSaveBtn = $("#ldapSettingsSaveBtn"),
        $ldapSettingsSyncBtn = $("#ldapSettingsSyncBtn"),
        $ldapSettingsRestoreBtn = $("#ldapSettingsRestoreBtn"),
        $ldapSettingsGroupBtn = $("#ldapSettingsGroupBtn"),
        $ldapSettingsAuthBtn = $("#ldapSettingsAuthenticationBtn"),
        $ldapSettingsError = $("#ldapSettingsError"),
        $ldapSettingsSyncError = $("#ldapSettingsSyncError"),
        $ldapSettingsProgressbarContainer = $(".ldap-settings-progressbar-container"),
        $ldapSettingsProgressValue = $ldapSettingsProgressbarContainer.find(".asc-progress-value"),
        $ldapSettingsSyncProgressbarContainer = $(".ldap-settings-sync-progressbar-container"),
        $ldapSettingsSyncProgressValue = $ldapSettingsSyncProgressbarContainer.find(".asc-progress-value"),
        $ldapSettingsStatus = $("#ldapSettingsStatus"),
        $ldapSettingsSyncStatus = $("#ldapSettingsSyncStatus"),
        $ldapSettingsPercent = $("#ldapSettingsPercent"),
        $ldapSettingsSyncPercent = $("#ldapSettingsSyncPercent"),
        $ldapSettingsSyncSource = $("#ldapSettingsSyncSource"),
        $ldapSettingsSource = $("#ldapSettingsSource"),

        $ldapSettingsAutoSyncBtn = $("#ldapSettingsAutoSyncBtn"),
        $ldapSettingsAutoSync = $("#ldapAutoSyncCont"),
        $ldapSettingsCron = $("#ldapSettingsAutoSyncCron"),
        $ldapSettingsCronInput = $("#ldapSettingsAutoSyncCronInput"),
        $ldapCronEditLink = $("#ldapCronEditLink, #ldapCronHumanText"),
        $ldapSettingsAutoSyncDialog = $("#ldapSettingsCronDialog"),
        $ldapNextSyncFields = $(".cronHumanReadable"),
        
        $ldapSettingsServer = $("#ldapSettingsServer"),
        $ldapSettingsUserDN = $("#ldapSettingsUserDN"),
        $ldapSettingsPortNumber = $("#ldapSettingsPortNumber"),
        $ldapSettingsUserFilter = $("#ldapSettingsUserFilter"),
        $ldapSettingsLoginAttribute = $("#ldapSettingsLoginAttribute"),
        $ldapSettingsGroupDN = $("#ldapSettingsGroupDN"),
        $ldapSettingsUserAttribute = $("#ldapSettingsUserAttribute"),
        $ldapSettingsGroupFilter = $("#ldapSettingsGroupFilter"),
        $ldapSettingsGroupAttribute = $("#ldapSettingsGroupAttribute"),
        $ldapSettingsGroupNameAttribute = $("#ldapSettingsGroupNameAttribute"),
        $ldapSettingsLogin = $("#ldapSettingsLogin"),
        $ldapSettingsPassword = $("#ldapSettingsPassword"),

        $ldapMappingSecurity = $("#ldapMappingSecurity"),
        $ldapMappingAddAccess = $("#ldapMappingAddAccess"),
        ldapSecurityRes = {
            fullAccess: window.Resource.SecurityMappingFullAccess,
            documents: window.Resource.SecurityMappingDocuments,
            projects: window.Resource.SecurityMappingProjects,
            crm: window.Resource.SecurityMappingCrm,
            community: window.Resource.SecurityMappingCommunity,
            people: window.Resource.SecurityMappingPeople,
            mail: window.Resource.SecurityMappingMail
        },
        ldapSecurityOptions,

        $ldapMappingSettings = $("#ldapMappingSettings"),
        $ldapMappingAddBtn = $("#ldapMappingAdd"),
        ldapMappingRes = {
            firstNameAttribute: window.Resource.MappingFirstNameAttribute,
            secondNameAttribute: window.Resource.MappingSecondNameAttribute,
            birthDayAttribute: window.Resource.MappingBirthDayAttribute,
            genderAttribute: window.Resource.MappingGenderAttribute,
            mobilePhoneAttribute: window.Resource.MappingMobilePhoneAttribute,
            mailAttribute: window.Resource.MappingMailAttribute,
            titleAttribute: window.Resource.MappingTitleAttribute,
            locationAttribute: window.Resource.MappingLocationAttribute,
            avatarAttribute: window.Resource.MappingAvatarAttribute,
            additionalPhone: window.Resource.MappingAdditionalPhone,
            additionalMobilePhone: window.Resource.MappingAdditionalMobilePhone,
            additionalMail: window.Resource.MappingAdditionalMail,
            skype: window.Resource.MappingSkype
        },
        ldapMappingOptions,
        ldapMappingRequiredOptions = ["firstNameAttribute", "secondNameAttribute", "mailAttribute"],

        $ldapSettingsBtn = $("#ldapSettingsBtn"),
        $ldapSettingsInviteDialog = $("#ldapSettingsInviteDialog"),
        $ldapSettingsCertificateValidationDialog = $("#ldapSettingsCertificateValidationDialog"),
        $ldapSettingsImportConfirmationPanel = $("#ldapSettingsImportConfirmationPanel"),
        $ldapSettingsTurnOffDialog = $("#ldapSettingsTurnOffDialog"),
        $ldapSettingsCronTurnOffDialog = $("#ldapSettingsCronTurnOffDialog"),
        $ldapSettingsSpoilerLink = $(".ldap-settings-spoiler-link"),
        $ldapSettingsSpoiler = $("#ldapSettingsSpoiler"),
        alreadyChecking = false,
        already = false,
        progressBarIntervalId = null,
        currentSettings = null,
        previousSettings = null,
        currentCron = null,
        isRestoreDefault = false,
        apiService = window.ApiService,
        constants = {
            NULL_PERCENT: 0,
            DEFAULT_LDAP_PORT: 389,
            GET_STATUS_TIMEOUT: 1000
        },
        syncInProgress = false;

    function enableProgress(enabled) {
        if (enabled) {
            if (syncInProgress) {
                $ldapSettingsProgressbarContainer.css({ "visibility": "hidden" });
                $ldapSettingsSyncProgressbarContainer.css({ "visibility": "visible" });
            } else {
                $ldapSettingsProgressbarContainer.css({ "visibility": "visible" });
                $ldapSettingsSyncProgressbarContainer.css({ "visibility": "hidden" });
            }
        } else {
            $ldapSettingsProgressbarContainer.css({ "visibility": "hidden" });
            $ldapSettingsSyncProgressbarContainer.css({ "visibility": "hidden" });
        }
    }

    function enableSave(enabled) {
        $ldapSettingsSaveBtn.toggleClass("disabled", !enabled);

        if (enabled) {
            $ldapSettingsSaveBtn.off("click").on("click", saveSettings);
        } else {
            $ldapSettingsSaveBtn.off("click");
        }
    }

    function enableSync(enabled) {
        $ldapSettingsSyncBtn.toggleClass("disabled", !enabled);

        if (enabled) {
            $ldapSettingsSyncBtn.off("click").on("click", syncLDAP);
        } else {
            $ldapSettingsSyncBtn.off("click");
        }
    }

    function enableRestoreDefault(enabled) {
        $ldapSettingsRestoreBtn.toggleClass("disabled", !enabled);

        if (enabled) {
            $ldapSettingsRestoreBtn.off("click").on("click", restoreDefault);
        } else {
            $ldapSettingsRestoreBtn.off("click");
        }
    }

    function restoreDefaultSettings() {
        Common.blockUI.hide();
        Common.requiredField.hideErrors();
        setStatus("");
        setSource("");
        setPercents(constants.NULL_PERCENT);
        apiService.get("ldap/defaultsettings")
            .done(function (data) {
                try {
                    var result = data;
                    if (result) {
                        setSettings(result);
                        continueSaveSettings(null, true);
                    } else {
                        throw window.Resource.OperationFailedError;
                    }
                } catch (error) {
                    showError(error);
                    currentSettings = previousSettings;
                    endProcess();
                }
            })
            .fail(onFailApi);
    }

    function showError(error) {
        var errorMessage = undefined;

        if (typeof (error) === "string") {
            errorMessage = error;
        }
        else if (error.message) {
            errorMessage = error.message;
        } else if (error.responseText) {
            try {
                var json = JSON.parse(error.responseText);

                if (typeof (json) === "object") {
                    if (json.ExceptionMessage) {
                        errorMessage = json.ExceptionMessage;
                    }
                    else if (json.Message) {
                        errorMessage = json.Message;
                    }
                }
                else if (typeof (json) === "string") {
                    errorMessage = error.responseText.replace(/(^")|("$)/g, "");

                    if (!errorMessage.length && error.statusText) {
                        errorMessage = error.statusText;
                    }
                }
            } catch (e) {
                errorMessage = error.responseText;
            } 
        } else if (error.statusText) {
            errorMessage = error.statusText;
        } else if (error.error) {
            errorMessage = error.error;
        }

        errorMessage = !errorMessage || typeof(errorMessage) !== "string" || !errorMessage.length
            ? window.Resource.OperationFailedError
            : errorMessage.replace(/(^")|("$)/g, "");

        if (!errorMessage.length) {
            console.error('showError failed with ', error);
            return;
        }

        if (syncInProgress) {
            $ldapSettingsSyncError.text(errorMessage);
            $ldapSettingsSyncError.show();
        } else {
            $ldapSettingsError.text(errorMessage);
            $ldapSettingsError.show();
        }
        setStatus("");
		setSource("");
        setPercents(constants.NULL_PERCENT);
        toastr.error(errorMessage);
    }

    function closeDialog() {
        Common.blockUI.hide();
        enableInterface(true);
        $ldapSettingsError.hide();
        $ldapSettingsSyncError.hide();
        enableProgress(false);
        refreshButtons();
        already = false;
    }

    function isInt(str) {
        var n = ~~Number(str);
        return String(n) === str && n >= 0;
    }

    function restoreDefault() {
        Common.blockUI.show("ldapSettingsInviteDialog", 500, 500, 0);
    }

    function syncLDAP() {
        syncInProgress = true;
        disableInterface();
        previousSettings = currentSettings;
        setStatus("");
        setSource("");
        setPercents(constants.NULL_PERCENT);
        apiService.get("ldap/sync")
            .done(function (data) {
                try {
                    var status = data;
                    if (status && status.id) {
                        setProgress(status);
                        progressBarIntervalId = setInterval(checkStatus, constants.GET_STATUS_TIMEOUT);
                    } else {
                        throw window.Resource.OperationFailedError;
                    }
                } catch (error) {
                    showError(error);
                    currentSettings = previousSettings;
                    endProcess();
                }
            })
            .fail(onFailApi);
    }

    function saveCronSettings(remove) {
        var newCron;

        if (remove) {
            newCron = null;
        } else {
            newCron = $ldapSettingsCronInput.val();
        }

        apiService.post("ldap/cron", { cron: newCron })
            .done(function (data) {
                currentCron = newCron;
                toastr.success(window.Resource.LdapSettingsSuccess);
                refreshButtons();
            })
            .fail(function () {
                toastr.error(window.Resource.OperationFailedError);
                refreshButtons();
            });
    }

    function disableInterface() {
        setPercents(constants.NULL_PERCENT);
        $ldapSettingsError.hide();
        $ldapSettingsSyncError.hide();
        $ldapSettingsMainContainer.addClass("ldap-settings-disabled-all");
        $ldapSettingsMainContainer.find("input").attr("disabled", true);
        $ldapSettingsMainContainer.find("textarea").attr("disabled", true);
        $ldapSettingsMainContainer.find(".selectBox:not(.locked)").addClass("disabled");
        $ldapSettingsMainContainer.find(".on-off-button").addClass("disable");
        $ldapSettingsStartTlsCheckbox.addClass("disabled");
        $ldapSettingsSslCheckbox.addClass("disabled");
        $ldapSettingsSendWelcomeEmailCheckbox.addClass("disabled");
        $ldapSettingsBtn.attr("disabled", true);
        $ldapSettingsBtn.addClass("disable");
        $ldapMappingAddBtn.attr("disabled", true).addClass("disabled");
        $ldapMappingAddAccess.attr("disabled", true).addClass("disabled");
        enableRestoreDefault(false);
        enableSave(false);
        enableSync(false);
        enableProgress(true);
        showCronEdit(false);
    }

    function enableInterface(cancel) {
        if (!cancel) {
            refreshButtons();
        }
        $ldapSettingsMainContainer.removeClass("ldap-settings-disabled-all");
        $ldapSettingsBtn.attr("disabled", false);
        $ldapSettingsBtn.removeClass("disable");
        if ($ldapSettingsBtn.hasClass("on")) {
            $ldapSettingsStartTlsCheckbox.removeClass("disabled");
            $ldapSettingsSslCheckbox.removeClass("disabled");
            $ldapSettingsUserContainer.find("input").attr("disabled", false);
            $ldapSettingsUserContainer.find("textarea").attr("disabled", false);
            $ldapSettingsUserContainer.find(".selectBox:not(.locked)").removeClass("disabled");
            $ldapSettingsUserContainer.find(".on-off-button").removeClass("disable");
            $ldapSettingsAutoSyncBtn.removeClass("disable");
            $ldapSettingsGroupBtn.removeClass("disable");
            $ldapMappingAddBtn.attr("disabled", false).removeClass("disabled");
            if ($ldapSettingsGroupBtn.hasClass("on")) {
                $ldapSettingsGroupContainer.find("input").attr("disabled", false);
                $ldapSettingsGroupContainer.find("textarea").attr("disabled", false);
                $ldapSettingsGroupContainer.find(".selectBox:not(.locked)").removeClass("disabled");
                $ldapSettingsGroupContainer.find(".on-off-button").removeClass("disable");
                $ldapMappingAddAccess.attr("disabled", false).removeClass("disabled");
            }
            $ldapSettingsAuthBtn.removeClass("disable");
            if ($ldapSettingsAuthBtn.hasClass("on")) {
                $ldapSettingsAuthContainer.find("input").attr("disabled", false);
                $ldapSettingsAuthContainer.find(".on-off-button").removeClass("disable");
            }
            if ($ldapSettingsAutoSyncBtn.hasClass("on")) {
                $ldapSettingsAutoSync.find("input").attr("disabled", false);
                $ldapSettingsAutoSync.find(".selectBox:not(.locked)").removeClass("disabled");
            }
        }
    }

    function validateSettings(settings) {
        var isValid = true;

        var validateKeyValuePairs = function() {
            var $input = $(this).children("input");
            var select = ($(this).children("div").attr("data-value") || "").trim();
            var input = ($input.val() || "").trim();
            if (!select || !input) {
                $(this).children(".requiredErrorText").text(window.Resource.EmptyField);
                Common.requiredField.showError($input, !isValid, !isValid);
                isValid = false;
            }
        }

        if (settings.EnableLdapAuthentication) {
            if (settings.Server === "") {
                Common.requiredField.showError($ldapSettingsServer);
                isValid = false;
            }
            if (settings.UserDN === "") {
                Common.requiredField.showError($ldapSettingsUserDN, !isValid, !isValid);
                isValid = false;
            }
            if (settings.UserFilter === "") {
                Common.requiredField.showError($ldapSettingsUserFilter, !isValid, !isValid);
                isValid = false;
            }
            if (settings.PortNumber === "") {
                $("#ldapSettingsPortNumberError").text(window.Resource.EmptyField);
                Common.requiredField.showError($ldapSettingsPortNumber, !isValid, !isValid);
                isValid = false;
            } else if (!isInt(settings.PortNumber)) {
                $("#ldapSettingsPortNumberError").text(window.Resource.LdapSettingsIncorrectPortNumber);
                Common.requiredField.showError($ldapSettingsPortNumber, !isValid, !isValid);
                isValid = false;
            }
            if (settings.LoginAttribute === "") {
                Common.requiredField.showError($ldapSettingsLoginAttribute, !isValid, !isValid);
                isValid = false;
            }

            $ldapMappingSettings.children().each(validateKeyValuePairs);

            var values = {};
            var uniqueErr = false;
            $ldapMappingSettings.children().each(function() {
                var val = $(this).children("input").val();
                if (!val) return;

                var exist = values[val];
                if (exist) {
                    exist.children(".requiredErrorText").text("");
                    Common.requiredField.showError(exist.children("input"), !isValid, !isValid);
                    uniqueErr = true;
                    isValid = false;
                    $(this).children(".requiredErrorText").text("");
                    Common.requiredField.showError($(this).children("input"), !isValid, !isValid);
                } else {
                    values[val] = $(this);
                }
            });
            if (uniqueErr) toastr.error(window.Resource.ErrorBindingSameAttribute);

            if (settings.GroupMembership) {
                if (settings.GroupDN === "") {
                    Common.requiredField.showError($ldapSettingsGroupDN, !isValid, !isValid);
                    isValid = false;
                }
                if (settings.GroupFilter === "") {
                    Common.requiredField.showError($ldapSettingsGroupFilter, !isValid, !isValid);
                    isValid = false;
                }
                if (settings.UserAttribute === "") {
                    Common.requiredField.showError($ldapSettingsUserAttribute, !isValid, !isValid);
                    isValid = false;
                }
                if (settings.GroupAttribute === "") {
                    Common.requiredField.showError($ldapSettingsGroupAttribute, !isValid, !isValid);
                    isValid = false;
                }
                if (settings.GroupNameAttribute === "") {
                    Common.requiredField.showError($ldapSettingsGroupNameAttribute, !isValid, !isValid);
                    isValid = false;
                }

                $ldapMappingSecurity.children().each(validateKeyValuePairs);
            }
            if (settings.Authentication) {
                if (settings.Login === "") {
                    Common.requiredField.showError($ldapSettingsLogin, !isValid, !isValid);
                    isValid = false;
                }
                if (settings.Password === "") {
                    Common.requiredField.showError($ldapSettingsPassword, !isValid, !isValid);
                    isValid = false;
                }
            }
        }

        return isValid;
    }

    function saveSettings() {
        if (already) {
            return;
        }

        already = true;

        Common.requiredField.hideErrors();

        var settings = getSettings();

        $ldapSettingsMainContainer.find(".ldap-settings-empty-field").addClass("display-none");
        $ldapSettingsMainContainer.find(".ldap-settings-incorrect-number").addClass("display-none");

        if (!validateSettings(settings)) {
            already = false;
            return;
        }

        setStatus("");
        setSource("");
        setPercents(constants.NULL_PERCENT);

        if ($ldapSettingsBtn.hasClass("on")) {
            Common.blockUI.show("ldapSettingsImportConfirmationPanel", 500, 500, 0);
        } else {
            continueSaveSettings();
        }
    }

    function continueSaveSettings(e, acceptCertificate) {
        Common.blockUI.hide();

        syncInProgress = false;

        disableInterface();

        if (!acceptCertificate) {
            acceptCertificate = false;
        }
        previousSettings = currentSettings;
        currentSettings = getSettings();

        apiService.post("ldap/settings",
            {
                settings: currentSettings,
                acceptCertificate: acceptCertificate
            })
            .done(function (data) {
                try {
                    var status = data;
                    if (status && status.id) {
                        setProgress(status);
                        progressBarIntervalId = setInterval(checkStatus, constants.GET_STATUS_TIMEOUT);
                    } else {
                        throw window.Resource.OperationFailedError;
                    }
                } catch (error) {
                    showError(error);
                    currentSettings = previousSettings;
                    endProcess();
                }
            })
            .fail(onFailApi);
    }

    function checkStatus() {
        if (alreadyChecking) {
            return;
        }
        alreadyChecking = true;
        apiService.get("ldap/status")
            .done(onGetStatus)
            .fail(onFailApi)
            .always(function() {
                alreadyChecking = false;
            });
    }

    var lastWarning = "";
    function onGetStatus(data) {
        try {
            var status = data;
            if($.isEmptyObject(data)) {
                status = {
                    completed: true,
                    percents: 100,
                    certificateConfirmRequest: null,
                    error: ""
                }
            }

            setProgress(status);

            if (status.warning && lastWarning !== status.warning) {
                lastWarning = status.warning;
                toastr.warning(status.warning, "", { timeOut: 0, extendedTimeOut: 0 });
            }

            if(isCompleted(status)) {
                lastWarning = "";

                if(status.error)
                    throw status.error;

                endProcess();
            }

        } catch (error) {
            showError(error);
            currentSettings = previousSettings;
            endProcess();
        }
    }

    function onFailApi(jqXHR, textStatus) {
        if (apiService.unloaded || textStatus != null && textStatus === "abort") {
            return;
        }
        showError(window.Resource.OperationFailedError);
        currentSettings = previousSettings;
        endProcess();
    }    

    function endProcess() {
        if(progressBarIntervalId) {
            clearInterval(progressBarIntervalId);
        }
        already = false;       
        enableInterface(false);
        if (isRestoreDefault) {
            enableRestoreDefault(false);
        }
    }

    function isCompleted(status) {
        if(!status)
            return true;

        if (!status.completed)
            return false;

        if (status.certificateConfirmRequest &&
            status.certificateConfirmRequest.requested) {
            setCertificateDetails(status.certificateConfirmRequest);
            currentSettings = previousSettings;
            /* popupId, width, height, marginLeft, marginTop */
            Common.blockUI.show("ldapSettingsCertificateValidationDialog", 560, 600, 0, -400);
            return true;
        }

        if (status.error) {
            return true;
        }

        toastr.success(window.Resource.LdapSettingsSuccess);
        return true;
    }

    function setCertificateDetails(certificateConfirmRequest) {
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-serial-number").text(certificateConfirmRequest.serialNumber);
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-issuer-name").text(certificateConfirmRequest.issuerName);
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-subject-name").text(certificateConfirmRequest.subjectName);
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-valid-from").text(certificateConfirmRequest.validFrom);
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-valid-until").text(certificateConfirmRequest.validUntil);
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-unique-hash").text(certificateConfirmRequest.hash);
        $ldapSettingsCertificateValidationDialog.find(".toast-container").remove();
        var html = $("#ldapCrtErrorTmpl")
            .tmpl({
                errors: function () {
                    var certificateErrors = certificateConfirmRequest.certificateErrors,
                        errors = [];
                    for (var i = 0; i < certificateErrors.length; i++) {
                        errors[i] = {};
                        errors[i].message = certificateErrors[i];
                    }
                    return errors;
                }
            });
        $ldapSettingsCertificateValidationDialog.find(".ldap-settings-crt-details-last").after(html);
    }

    function setProgress(status) {
        setPercents(status.percents);
        
        if (status.completed) {
            if (!status.error) {
                setStatus(window.Resource.LdapSettingsSuccess);
                setSource("");
            }
            else {

            }
        } else {
            setStatus(status.status);
            setSource(status.source);
        } 
    }

    var lastPercent = 0;

    function setPercents(percent) {
        if(percent === undefined)
            return;

        var value = percent + "%";

        if (syncInProgress) {
            if (percent === constants.NULL_PERCENT || percent <= lastPercent) {
                $ldapSettingsSyncProgressValue.css({ "width": value });
            } else {
                $ldapSettingsSyncProgressValue.animate({ "width": value });
            }
            $ldapSettingsSyncPercent.text(value + " ");
        } else {
            if (percent === constants.NULL_PERCENT || percent <= lastPercent) {
                $ldapSettingsProgressValue.css({ "width": value });
            } else {
                $ldapSettingsProgressValue.animate({ "width": value });
            }
            $ldapSettingsPercent.text(value + " ");
        }

        lastPercent = percent;
    }

    function setStatus(status) {
        (syncInProgress ? $ldapSettingsSyncStatus : $ldapSettingsStatus).text(status);
    }

    function setSource(source) {
        (syncInProgress ? $ldapSettingsSyncSource : $ldapSettingsSource).text(source);
    }

    function setSettings(settings) {
        if (settings) {
            if (settings["enableLdapAuthentication"]) {
                $ldapSettingsBtn.removeClass("off").addClass("on");
            } else {
                $ldapSettingsStartTlsCheckbox.removeClass("checked");
                $ldapSettingsSslCheckbox.removeClass("checked");
            }
            if (settings["startTls"]) {
                $ldapSettingsStartTlsCheckbox.addClass("checked");
            } else {
                $ldapSettingsBtn.removeClass("on").addClass("off");
            }
            if (settings["ssl"]) {
                $ldapSettingsSslCheckbox.addClass("checked");
            } else {
                $ldapSettingsBtn.removeClass("on").addClass("off");
            }
            if (settings["sendWelcomeEmail"] == "true") {
                $ldapSettingsSendWelcomeEmailCheckbox.addClass("checked");
            }
            $ldapSettingsServer.val(settings["server"]);
            $ldapSettingsUserDN.val(settings["userDN"]);
            $ldapSettingsPortNumber.val(settings["portNumber"]);
            $ldapSettingsUserFilter.val(settings["userFilter"]);
            $ldapSettingsLoginAttribute.val(settings["loginAttribute"]);

            var ldapMapping = settings["ldapMapping"];
            var accessRights = settings["accessRights"];

            clearAllMappingRows($ldapMappingSettings);
            if (ldapMapping) {
                for(var key in ldapMapping) {
                    addMappingRow($ldapMappingSettings, key, ldapMapping[key], ldapMappingRes[key], ldapMappingOptions, window.LdapResource.LdapAttributeOrigin, ldapMappingRequiredOptions.indexOf(key) !== -1);
                }
            }

            clearAllMappingRows($ldapMappingSecurity);
            if (accessRights) {
                for (var key in accessRights) {
                    addMappingRow($ldapMappingSecurity, key, ldapMapping[key], ldapSecurityRes[key], ldapSecurityOptions, window.LdapResource.LdapSecurityPlaceholder);
                }
            }

            if (settings["enableLdapAuthentication"]) {
                $ldapSettingsGroupBtn.removeClass("disable");
                $ldapSettingsAuthBtn.removeClass("disable");
            } else {
                $ldapSettingsGroupBtn.addClass("disable");
                $ldapSettingsAuthBtn.addClass("disable");
            }

            if (settings["groupMembership"]) {
                $ldapSettingsGroupBtn.removeClass("off").addClass("on");
            } else {
                $ldapSettingsGroupBtn.removeClass("on").addClass("off");
            }
            $ldapSettingsGroupDN.val(settings["groupDN"]);
            $ldapSettingsUserAttribute.val(settings["userAttribute"]);
            $ldapSettingsGroupFilter.val(settings["groupFilter"]);
            $ldapSettingsGroupAttribute.val(settings["groupAttribute"]);
            $ldapSettingsGroupNameAttribute.val(settings["groupNameAttribute"]);

            if (settings["authentication"]) {
                $ldapSettingsAuthBtn.removeClass("off").addClass("on");
            } else {
                $ldapSettingsAuthBtn.removeClass("on").addClass("off");
            }
            $ldapSettingsLogin.val(settings["login"]);
            $ldapSettingsPassword.val(settings["password"]);

            disableNeededBlocks(settings["enableLdapAuthentication"],
                settings["groupMembership"],
                settings["authentication"]);
        }
    }

    function getSettings() {
        var enableLdapAuthentication = $ldapSettingsBtn.hasClass("on"),
            startTls = $ldapSettingsStartTlsCheckbox.hasClass("checked"),
            ssl = $ldapSettingsSslCheckbox.hasClass("checked"),
            sendWelcomeEmail = $ldapSettingsSendWelcomeEmailCheckbox.hasClass("checked"),
            server = $ldapSettingsServer.val(),
            userDN = $ldapSettingsUserDN.val(),
            portNumber = $ldapSettingsPortNumber.val(),
            userFilter = $ldapSettingsUserFilter.val(),
            loginAttribute = $ldapSettingsLoginAttribute.val(),
            ldapMapping = {},
            accessRights = {},
            groupMembership = $ldapSettingsGroupBtn.hasClass("on"),
            groupDN = $ldapSettingsGroupDN.val(),
            userAttribute = $ldapSettingsUserAttribute.val(),
            groupFilter = $ldapSettingsGroupFilter.val(),
            groupAttribute = $ldapSettingsGroupAttribute.val(),
            groupNameAttribute = $ldapSettingsGroupNameAttribute.val(),
            authentication = $ldapSettingsAuthBtn.hasClass("on"),
            login = $ldapSettingsLogin.val(),
            password = $ldapSettingsPassword.val();

            $ldapMappingSettings.children().each(function() {
                var select = ($(this).children("div").attr("data-value") || "").trim();
                var input = ($(this).children("input").val() || "").trim();

                if (!select || !input) return;

                if (ldapMapping[select] && !select.endsWith("Attribute")) {
                    ldapMapping[select] += "," + input;
                } else {
                    ldapMapping[select] = input;
                }
            });

            $ldapMappingSecurity.children().each(function() {
                var select = ($(this).children("div").attr("data-value") || "").trim();
                var input = ($(this).children("input").val() || "").trim();

                if (!select || !input) return;

                if (accessRights[select]) {
                    accessRights[select] += "," + input;
                } else {
                    accessRights[select] = input;
                }
            });

        var settings = {
            EnableLdapAuthentication: enableLdapAuthentication,
            StartTls: startTls,
            Ssl: ssl,
            SendWelcomeEmail: sendWelcomeEmail,
            Server: server,
            UserDN: userDN,
            PortNumber: portNumber,
            UserFilter: userFilter,
            LoginAttribute: loginAttribute,
            LdapMapping: ldapMapping,
            AccessRights: accessRights,
            GroupMembership: groupMembership,
            GroupDN: groupDN,
            UserAttribute: userAttribute,
            GroupFilter: groupFilter,
            GroupAttribute: groupAttribute,
            GroupNameAttribute: groupNameAttribute,
            Authentication: authentication,
            Login: login,
            Password: password
        };

        return settings;
    }

    function clearAllMappingRows(el) {
        el.find(".ldap-mapping-row").remove();
    }

    function addMappingRow(el, key, value, humanKey, options, placeholder, required) {
        key = key || "";
        value = value || "";

        $("#ldapMappingFieldTmpl")
            .tmpl({key: key, value: value, humanKey: humanKey, options: options, placeholder: placeholder, required: required}).appendTo(el);

        el.find(".ldap-mapping-remove-row").last().click(function() { removeMappingRow(el, $(this), options) });
        var select = el.find(".selectBox").last();
        select.on("valueChanged", onSettingsChanged);
        select.on("valueChanged", function() { refreshMappingOptions(el, options) });
        if (required) {
            select.addClass("locked").addClass("disabled");
        }

        var input = el.find("input").last();
        input.change(refreshButtons)
            .keyup(refreshButtons)
            .on("paste", refreshButtons);

        refreshMappingOptions(el, options);
        if (!key) {
            var val = select.find(".selectOptionsInnerBox").children().first();
            select.attr("data-value", val.attr("data-value"));
            select.children(".selectBoxValue").text(val.text());
            refreshMappingOptions(el, options);
        }
    }

    function removeMappingRow(el, self, options) {
        if (self.hasClass("disabled")) return;

        var row = self.parent();
        if (row.length && row.hasClass("ldap-mapping-row"))
            row.remove();
        refreshMappingOptions(el, options);
        refreshButtons();
    }

    function refreshMappingOptions(el, options) {
        var uniqueKeys = [];
        var selects = el.find(".selectBox");
        selects.each(function() {
            var val = $(this).attr("data-value");
            if (val.endsWith("Attribute"))
                uniqueKeys.push(val);
        }).each(function() {
            var sel = $(this).attr("data-value");

            var currentOptions = $(this).find(".selectOptionsInnerBox").html(options).children();
            currentOptions.filter(function() { return $(this).attr("data-value") === sel }).addClass("selected");
            currentOptions.filter(function() {
                return !(uniqueKeys.indexOf($(this).attr("data-value")) < 0) && $(this).attr("data-value") !== sel;
            }).remove();
        });
    }

    function hasChanges() {
        var nextSettings = getSettings();

        if (!currentSettings && !!nextSettings ||
            !!currentSettings && !nextSettings) {
            return true;
        }

        if (currentSettings.EnableLdapAuthentication !== nextSettings.EnableLdapAuthentication ||
            currentSettings.StartTls !== nextSettings.StartTls ||
            currentSettings.SendWelcomeEmail !== nextSettings.SendWelcomeEmail ||
            currentSettings.Server !== nextSettings.Server ||
            currentSettings.UserDN !== nextSettings.UserDN ||
            currentSettings.PortNumber !== nextSettings.PortNumber ||
            currentSettings.UserFilter !== nextSettings.UserFilter ||
            currentSettings.LoginAttribute !== nextSettings.LoginAttribute ||
            currentSettings.GroupMembership !== nextSettings.GroupMembership ||
            currentSettings.GroupDN !== nextSettings.GroupDN ||
            currentSettings.UserAttribute !== nextSettings.UserAttribute ||
            currentSettings.GroupFilter !== nextSettings.GroupFilter ||
            currentSettings.GroupAttribute !== nextSettings.GroupAttribute ||
            currentSettings.GroupNameAttribute !== nextSettings.GroupNameAttribute ||
            currentSettings.Authentication !== nextSettings.Authentication ||
            currentSettings.Login !== nextSettings.Login ||
            currentSettings.Password !== nextSettings.Password) {
            return true;
        }


        if (!isObjectsEqual(currentSettings.LdapMapping, nextSettings.LdapMapping)) {
            return true;
        }

        if (!isObjectsEqual(currentSettings.AccessRights, nextSettings.AccessRights)) {
            return true;
        }

        return false;
    }

    function isObjectsEqual(obj, secondObj) {
        if (!obj || !secondObj)
        {
            return false;
        }

        var objKeys = [];
        var secondObjKeys = [];

        for (var key in obj) {
            objKeys.push(key);
        }

        for (var key in secondObj) {
            secondObjKeys.push(key);
        }

        if (objKeys.length !== secondObjKeys.length) {
            return false;
        }

        for (var i in objKeys) {
            var key = objKeys[i];
            if (obj[key] !== secondObj[key]) {
                return false;
            }
        }

        return true;
    }

    function disableNeededBlocks(enableLdapAuthentication, groupMembership, authentication) {
        if (!enableLdapAuthentication) {
            $ldapSettingsMainContainer.find("input").attr("disabled", "");
            $ldapSettingsStartTlsCheckbox.addClass("disabled");
            $ldapSettingsSslCheckbox.addClass("disabled");
            $ldapSettingsUserContainer.addClass("ldap-settings-disabled");
            $ldapSettingsGroupContainer.addClass("ldap-settings-disabled");
            $ldapSettingsAuthContainer.addClass("ldap-settings-disabled");
            $ldapSettingsSecurityContainer.addClass("ldap-settings-disabled");
            
        } else {
            if (!groupMembership) {
                $ldapSettingsGroupContainer.find("input").attr("disabled", true);
                $ldapSettingsGroupContainer.addClass("ldap-settings-disabled");
            }
            if (!authentication) {
                $ldapSettingsAuthContainer.find("input").attr("disabled", true);
                $ldapSettingsAuthContainer.addClass("ldap-settings-disabled");
            }
        }
    }

    function refreshButtons() {
        isRestoreDefault = false;
        var settingsChanged = hasChanges();
        enableSave(settingsChanged);
        enableSync(!settingsChanged && currentSettings.EnableLdapAuthentication);
        enableRestoreDefault(currentSettings.EnableLdapAuthentication);
        enableCron(currentSettings.EnableLdapAuthentication);
        enableMailCheckboxes($ldapSettingsBtn.hasClass("on") && $(".ldap-mapping-row .selectBox[data-value=mailAttribute]").nextAll("input").val());
    }

    function onSettingsChanged() {
        refreshButtons();
    }

    function enableCron(on) {
        $ldapSettingsAutoSyncBtn.toggleClass("disable", !on).attr("disabled", !on);
        if (!on) {
            $ldapSettingsAutoSyncBtn.removeClass("on").addClass("off");
        }

        showCronEdit($ldapSettingsAutoSyncBtn.hasClass("on"));
    }

    function enableMailCheckboxes(on) {
        if (on) {
            $ldapSettingsSendWelcomeEmailCheckbox.removeClass("disabled");
        } else {
            $ldapSettingsSendWelcomeEmailCheckbox.removeClass("checked").addClass("disabled");
        }
    }

    function showCronEdit(on) {
        if (on) {
            $ldapCronEditLink.show();
        } else {
            $ldapCronEditLink.hide();
        }
    }

    function enableInputs(on) {
        if (on) {
            $ldapSettingsBtn.removeClass("off").addClass("on");
            $ldapMappingAddBtn.removeClass("disabled");
            $ldapMappingAddAccess.addClass("disabled");
            $ldapSettingsUserContainer.find("input").attr("disabled", false);
            $ldapSettingsUserContainer.find("textarea").attr("disabled", false);
            $ldapSettingsUserContainer.find(".selectBox:not(.locked)").removeClass("disabled");
            $ldapMappingSettings.find(".ldap-mapping-remove-row").removeClass("disabled");
            $ldapMappingSecurity.find(".ldap-mapping-remove-row").addClass("disabled");
            $ldapSettingsGroupBtn.removeClass("disable");
            $ldapSettingsUserContainer.removeClass("ldap-settings-disabled");
            $ldapSettingsSecurityContainer.removeClass("ldap-settings-disabled");
            $ldapSettingsAdvancedContainer.removeClass("ldap-settings-disabled");
            $ldapSettingsStartTlsCheckbox.removeClass("disabled");
            $ldapSettingsSslCheckbox.removeClass("disabled");
            $ldapSettingsAutoSyncBtn.attr("disabled", true);
            $ldapSettingsAutoSyncBtn.addClass("disable");
            if ($ldapSettingsGroupBtn.hasClass("on")) {
                $ldapSettingsGroupContainer.find("input").removeAttr("disabled");
                $ldapSettingsGroupContainer.find("textarea").removeAttr("disabled");
                $ldapSettingsGroupContainer.removeClass("ldap-settings-disabled");
                $ldapMappingAddAccess.removeClass("disabled");
                $ldapMappingSecurity.find(".ldap-mapping-remove-row").removeClass("disabled");
            }
            $ldapSettingsAuthBtn.removeClass("disable");
            if ($ldapSettingsAuthBtn.hasClass("on")) {
                $ldapSettingsAuthContainer.find("input").attr("disabled", false);
                $ldapSettingsAuthContainer.removeClass("ldap-settings-disabled");
            }
        } else {
            $ldapSettingsBtn.removeClass("on").addClass("off");
            $ldapMappingAddBtn.addClass("disabled");
            $ldapMappingAddAccess.addClass("disabled");
            $ldapSettingsGroupBtn.addClass("disable");
            $ldapSettingsAuthBtn.addClass("disable");
            $ldapSettingsMainContainer.find("input").attr("disabled", true);
            $ldapSettingsMainContainer.find("textarea").attr("disabled", true);
            $ldapSettingsUserContainer.find(".selectBox:not(.locked)").addClass("disabled");
            $ldapMappingSettings.find(".ldap-mapping-remove-row").addClass("disabled");
            $ldapMappingSecurity.find(".ldap-mapping-remove-row").addClass("disabled");
            $ldapSettingsStartTlsCheckbox.addClass("disabled");
            $ldapSettingsSslCheckbox.addClass("disabled");
            $ldapSettingsAutoSyncBtn.attr("disabled", false);
            $ldapSettingsAutoSyncBtn.removeClass("disable");
            $ldapSettingsUserContainer.addClass("ldap-settings-disabled");
            $ldapSettingsSecurityContainer.addClass("ldap-settings-disabled");
            $ldapSettingsAdvancedContainer.addClass("ldap-settings-disabled");
            $ldapSettingsGroupContainer.addClass("ldap-settings-disabled");
            $ldapSettingsAuthContainer.addClass("ldap-settings-disabled");
        }
    }

    function enableLdap(on) {
        $ldapSettingsBtn.toggleClass("off", !on).toggleClass("on", on);
        
        if (on && $ldapSettingsSpoiler.hasClass("display-none")) {
            $ldapSettingsSpoilerLink.click();
        }

        enableInputs(on);

        window.Common.requiredField.hideErrors();

        onSettingsChanged();
    }

    function onLdapEnabled() {
        var $this = $(this);

        if ($this.hasClass("disabled"))
            return;

        var on = $this.hasClass("off");

        if(currentSettings.EnableLdapAuthentication) {
            Common.blockUI.show("ldapSettingsTurnOffDialog", 500, 500, 0);
        }
        else {
            enableLdap(on);
        }
    }

    function onAutoSyncEnabled(ev, edit) {
        var $this = $(this);

        if ($this.hasClass("disabled"))
            return;

        var on = $ldapSettingsAutoSyncBtn.hasClass("on");

        if (on && currentCron && !edit) {
            Common.blockUI.show("ldapSettingsCronTurnOffDialog", 500, 500, 0);
            return;
        } else {
            if (currentCron) {
                $ldapSettingsCron.jqCronGetInstance().setCron(currentCron);
            }
            Common.blockUI.show("ldapSettingsCronDialog", 700, 500, 0);
            return;
        }
    }

    function getNextValidDateFromCron(cron) {
        var now, m = moment();

        var parts = cron.split(" ");

        var mins = parts[1],
            hrs = parts[2],
            dow = parts[5];

        var offset = m.utcOffset();
        m.utc(offset);
        m.milliseconds(0).subtract(offset, "minutes");
        now = moment(m);

        m.seconds(0);
        m.minutes(mins);

        if (hrs !== "*") {
            m.hours(hrs);

            if (dow === "*") {
                if (m < now) {
                    m.add(1, "days");
                }
            } else {
                if (dow.length === 1) {
                    m.isoWeekday(parseInt(dow));

                    if (m < now) {
                        m.add(7, "days");
                    }
                } else {
                    if (dow[1] === "L") {
                        m.date(m.daysInMonth());

                        while(m.isoWeekday() != dow[0]) {
                            m.subtract(1, "days");
                        }

                        if (m < now) {
                            m.add(7, "days");

                            var month = m.month();

                            while (month === m.month()) {
                                m.add(7, "days");
                            }

                            m.subtract(7, "days");
                        }
                    } else {
                        m.date(1);
                        var month = m.month();
                        m.isoWeekday(parseInt(dow[0]));

                        if (month !== m.month()) {
                            m.add(7, "days");
                        }

                        if (m < now) {
                            m.add(1, "month");
                            m.date(1);

                            month = m.month();
                            m.isoWeekday(parseInt(dow[0]));

                            if (month !== m.month()) {
                                m.add(7, "days");
                            }
                        }
                    }
                }
            }
        } else {
            if (m < now) {
                m.add(1, "hours");
            }
        }

        return m.add(offset, "minutes").format("LLLL");
    }

    function parseMappings(elem, res, options, placeholder, required) {
        var data_val = elem.attr("data-value");
        if (!data_val) return;
        var data = JSON.parse(data_val);
        elem.removeAttr("data-value");

        if (required) {
            for (var i = 0; i < required.length; i++) {
                var value = data[required[i]];
                addMappingRow(elem, required[i], value ? value : "" , res[required[i]], options, placeholder, true);
            }
        }

        if (data) {
            for(var key in data) {
                if (required && required.indexOf(key) !== -1) {
                    continue;
                }

                if (data[key].indexOf(",") !== -1) {
                    var split = data[key].split(",");
                    for (var i = 0; i < split.length; i++) {
                        addMappingRow(elem, key, split[i], res[key], options, placeholder);
                    }
                } else {
                    addMappingRow(elem, key, data[key], res[key], options, placeholder);
                }
            }
        }
    }

    function init() {
        window.moment.locale(Resource.lang);

        function buildMappingOptions(collection) {
            var htmlMappingOptions = "";

            for (var key in collection) {
                htmlMappingOptions += "<div class=\"option\" data-value=\"" + key + "\">" + collection[key] + "</div>";
            }

            return htmlMappingOptions;
        }

        ldapMappingOptions = buildMappingOptions(ldapMappingRes);
        ldapSecurityOptions = buildMappingOptions(ldapSecurityRes);

        parseMappings($ldapMappingSettings, ldapMappingRes, ldapMappingOptions, window.LdapResource.LdapAttributeOrigin, ldapMappingRequiredOptions);
        parseMappings($ldapMappingSecurity, ldapSecurityRes, ldapSecurityOptions, window.LdapResource.LdapSecurityPlaceholder);

        currentSettings = getSettings();

        var dataErrorMessage = $ldapSettingsMainContainer.attr("data-error-message");

        if (dataErrorMessage) {
            toastr.error(dataErrorMessage);
        }
        if ($ldapSettingsBtn.hasClass("off")) {
            $ldapSettingsMainContainer.find("input").attr("disabled", true);
            $ldapSettingsMainContainer.find("textarea").attr("disabled", true);
            $ldapSettingsMainContainer.find(".selectBox:not(.locked)").addClass("disabled");
            $ldapMappingAddBtn.addClass("disabled");
            $ldapMappingAddAccess.addClass("disabled");
            $ldapMappingSettings.find(".ldap-mapping-remove-row").addClass("disabled");
            $ldapMappingSecurity.find(".ldap-mapping-remove-row").addClass("disabled");
            $ldapSettingsGroupBtn.addClass("disable");
            $ldapSettingsAuthBtn.addClass("disable");
        } else {
            $ldapSettingsUserContainer.find("input").attr("disabled", false);
            $ldapSettingsUserContainer.find("textarea").attr("disabled", false);
            if ($ldapSettingsGroupContainer.hasClass("ldap-settings-disabled")) {
                $ldapSettingsGroupContainer.find("input").attr("disabled", true);
                $ldapSettingsGroupContainer.find("textarea").attr("disabled", true);
                $ldapMappingAddAccess.addClass("disabled");
                $ldapMappingSecurity.find(".ldap-mapping-remove-row").addClass("disabled");
            } else {
                $ldapSettingsGroupContainer.find("input").attr("disabled", false);
                $ldapSettingsGroupContainer.find("textarea").attr("disabled", false);
                $ldapMappingAddAccess.removeClass("disabled");
                $ldapMappingSecurity.find(".ldap-mapping-remove-row").removeClass("disabled");
            }

            if ($ldapSettingsAuthContainer.hasClass("ldap-settings-disabled")) {
                $ldapSettingsAuthContainer.find("input").attr("disabled", true);
            } else {
                $ldapSettingsAuthContainer.find("input").attr("disabled", false);
            }
        }

        if (!$ldapSettingsSaveBtn.hasClass("disabled")) {
            enableSave(true);
        }

        if (!$ldapSettingsRestoreBtn.hasClass("disabled")) {
            enableRestoreDefault(true);
        }

        if (!$ldapSettingsSyncBtn.hasClass("disabled")) {
            enableSync(true);
        }

        $ldapMappingAddBtn.click(function() {
            if ($(this).hasClass("disabled")) return;
            addMappingRow($ldapMappingSettings, "", "", "", ldapMappingOptions, window.LdapResource.LdapAttributeOrigin);
        });
        $ldapMappingAddAccess.click(function() {
            if ($(this).hasClass("disabled")) return;
            addMappingRow($ldapMappingSecurity, "", "", "", ldapSecurityOptions, window.LdapResource.LdapSecurityPlaceholder);
        });

        currentCron = $ldapSettingsCronInput.val();
        $ldapSettingsCron.jqCron({
            enabled_year: false,
            texts: { en: {
                empty: window.Resource.CronEmpty,
                empty_minutes: window.Resource.CronEmptyMinutes,
                empty_time_hours: window.Resource.CronEmptyTimeHours,
                empty_time_minutes: window.Resource.CronEmptyTimeMinutes,
                empty_day_of_week: window.Resource.CronEmptyDayOfWeek,
                empty_day_of_month: window.Resource.CronEmptyDayOfMonth,
                empty_month: window.Resource.CronEmptyMonth,
                name_minute: window.Resource.CronNameMinute,
                name_hour: window.Resource.CronNameHour,
                name_day: window.Resource.CronNameDay,
                name_week: window.Resource.CronNameWeek,
                name_month: window.Resource.CronNameMonth,
                name_year: window.Resource.CronNameYear,
                text_period: window.Resource.CronTextPeriod,
                text_mins: window.Resource.CronTextMins,
                text_time: window.Resource.CronTextTime,
                text_dow: window.Resource.CronTextDow,
                text_month: window.Resource.CronTextMonth,
                text_dom: window.Resource.CronTextDom,
                error1: window.Resource.CronError1,
                error2: window.Resource.CronError2,
                error3: window.Resource.CronError3,
                error4: window.Resource.CronError4,
                first_last: [ window.Resource.CronFirst, window.Resource.CronLast ],
                weekdays: [ window.Resource.CronMonday, window.Resource.CronTuesday, window.Resource.CronWednesday, window.Resource.CronThursday, window.Resource.CronFriday, window.Resource.CronSaturday, window.Resource.CronSunday ],
                months: [ window.Resource.CronJanuary, window.Resource.CronFebruary, window.Resource.CronMarch, window.Resource.CronApril, window.Resource.CronMay, window.Resource.CronJune, window.Resource.CronJuly, window.Resource.CronAugust, window.Resource.CronSeptember, window.Resource.CronOctober, window.Resource.CronNovember, window.Resource.CronDecember ]
            }},
            default_value: currentCron || "0 0 0 ? * *",
            bind_to: $ldapSettingsCronInput,
            bind_method: {
                set: function($element, value) {
                    var el;
                    if ($ldapSettingsAutoSyncDialog.is(":visible")) {
                        el = $ldapSettingsAutoSyncDialog.find(".cronHumanReadable");
                    } else {
                        el = $ldapNextSyncFields;
                    }
                    el.text(getNextValidDateFromCron(value));
                    $element.val(value);
                }
            }
        }).children().first().on("cron:change", refreshButtons);

        $ldapSettingsInviteDialog.on("click", ".ldap-settings-ok", restoreDefaultSettings);
        $ldapSettingsInviteDialog.on("click", ".ldap-settings-cancel", closeDialog);

        $ldapSettingsAutoSyncDialog.on("click", ".ldap-settings-ok", function () {
            if ($(this).hasClass("disabled"))
                return;

            $ldapSettingsAutoSyncBtn.addClass("on").removeClass("off");
            showCronEdit(true);
            saveCronSettings();
            closeDialog();

            $ldapNextSyncFields.text(getNextValidDateFromCron($ldapSettingsCron.jqCronGetInstance().getCron()));
        });
        $ldapSettingsAutoSyncDialog.on("click", ".ldap-settings-cancel", function() {
            closeDialog();
            if (currentCron) {
                setTimeout(function() { $ldapSettingsCron.jqCronGetInstance().setCron(currentCron) }, 500);
            }
        });

        $ldapSettingsCertificateValidationDialog.on("click",
            ".ldap-settings-ok",
            function() { continueSaveSettings(null, true); });
        $ldapSettingsCertificateValidationDialog.on("click",
            ".ldap-settings-cancel",
            function() {
                closeDialog();
            });
        $ldapSettingsImportConfirmationPanel.on("click", ".ldap-settings-ok", continueSaveSettings);
        $ldapSettingsImportConfirmationPanel.on("click", ".ldap-settings-cancel", closeDialog);
        $ldapSettingsImportConfirmationPanel.on("click", ".cancelButton", closeDialog);
        $(document)
            .keyup(function(e) {
                /* Escape Key */
                if ((!$ldapSettingsImportConfirmationPanel.is(":hidden") ||
                        !$ldapSettingsCertificateValidationDialog.is(":hidden") ||
                        !$ldapSettingsInviteDialog.is(":hidden")) &&
                    e.keyCode === 27) {
                    closeDialog();
                }
            });
        $ldapSettingsMainContainer.on("click", "#ldapSettingsStartTlsCheckbox", function () {
            var self = $(this);
            if (self.hasClass("disabled"))
                return;

            if(self.hasClass("checked")) {
                $ldapSettingsSslCheckbox.toggleClass("checked", false);
                $ldapSettingsPortNumber.val("389");
            }
            refreshButtons();
        });
        $ldapSettingsMainContainer.on("click", "#ldapSettingsSslCheckbox", function () {
            var self = $(this);
            if (self.hasClass("disabled"))
                return;

            if(self.hasClass("checked")) {
                $ldapSettingsStartTlsCheckbox.toggleClass("checked", false);
                $ldapSettingsPortNumber.val("636");
            }
            else {
                $ldapSettingsPortNumber.val("389");
            }
            refreshButtons();
        });
        $ldapSettingsAdvancedContainer.on("click", "#ldapSettingsSendWelcomeEmail", function () {
            var self = $(this);
            if (self.hasClass("disabled")) {
                return;
            }

            refreshButtons();
        });
        $ldapSettingsMainContainer.find("input").change(refreshButtons);
        $ldapSettingsMainContainer.find("textarea").change(refreshButtons);
        $ldapSettingsMainContainer.find("input").on("paste", refreshButtons);
        $ldapSettingsMainContainer.find("textarea").on("paste", refreshButtons);
        $ldapSettingsMainContainer.find(".textBox").keyup(refreshButtons);

        $ldapSettingsBtn.on("click", onLdapEnabled);
        $ldapSettingsAutoSyncBtn.on("click", onAutoSyncEnabled);
        $("#ldapCronEditLink").on("click", function(e) { onAutoSyncEnabled(e, true); });
        showCronEdit($ldapSettingsAutoSyncBtn.hasClass("on"));

        if ($ldapSettingsAutoSyncBtn.hasClass("on")) {
            $ldapSettingsAutoSync.show();
        }
        if ($ldapSettingsAutoSyncBtn.hasClass("disable")) {
            $ldapSettingsAutoSyncBtn.attr("disabled", true);
        }

        $ldapSettingsTurnOffDialog.on("click", ".ldap-settings-ok", function () {
            if ($(this).hasClass("disabled"))
                return;

            enableLdap(false);
            closeDialog();
            saveSettings();

            if($ldapSettingsSpoiler.hasClass("display-none")) {
                Common.spoiler.toggle('#ldapSettingsSpoiler', $ldapSettingsSpoilerLink);
            }
            
            $('html, body').animate({
                scrollTop: $ldapSettingsProgressbarContainer.offset().top
            }, 2000);
        });
        $ldapSettingsTurnOffDialog.on("click", ".ldap-settings-cancel", closeDialog);

        $ldapSettingsCronTurnOffDialog.on("click", ".ldap-settings-ok", function () {
            if ($(this).hasClass("disabled"))
                return;

            $ldapSettingsAutoSyncBtn.addClass("off").removeClass("on");
            showCronEdit(false);
            saveCronSettings(true);
            closeDialog();
        });
        $ldapSettingsCronTurnOffDialog.on("click", ".ldap-settings-cancel", closeDialog);

        $ldapSettingsGroupBtn.click(function () {
            var $this = $(this);
            if ($this.hasClass("disable"))
                return;

            if ($this.hasClass("off")) {
                $this.removeClass("off").addClass("on");
                $ldapSettingsGroupContainer.find("input").attr("disabled", false);
                $ldapSettingsGroupContainer.find("textarea").attr("disabled", false);
                $ldapSettingsGroupContainer.removeClass("ldap-settings-disabled");
                $ldapMappingAddAccess.removeClass("disabled");
                $ldapMappingSecurity.find(".selectBox:not(.locked)").removeClass("disabled");
                $ldapMappingSecurity.find("input").attr("disabled", false);
                $ldapMappingSecurity.find(".ldap-mapping-remove-row").removeClass("disabled");
            } else {
                $this.removeClass("on").addClass("off");
                $ldapSettingsGroupContainer.find("input").attr("disabled", true);
                $ldapSettingsGroupContainer.find("textarea").attr("disabled", true);
                $ldapSettingsGroupContainer.addClass("ldap-settings-disabled");
                $ldapMappingAddAccess.addClass("disabled");
                $ldapMappingSecurity.find(".selectBox:not(.locked)").addClass("disabled");
                $ldapMappingSecurity.find("input").attr("disabled", true);
                $ldapMappingSecurity.find(".ldap-mapping-remove-row").addClass("disabled");
            }

            onSettingsChanged();
        });

        $ldapSettingsAuthBtn.click(function () {
            var $this = $(this);
            if ($this.hasClass("disable"))
                return;

            if ($this.hasClass("off")) {
                $this.removeClass("off").addClass("on");
                $ldapSettingsAuthContainer.find("input").attr("disabled", false);
                $ldapSettingsAuthContainer.removeClass("ldap-settings-disabled");
            } else {
                $this.removeClass("on").addClass("off");
                $ldapSettingsAuthContainer.find("input").attr("disabled", true);
                $ldapSettingsAuthContainer.addClass("ldap-settings-disabled");
            }

            onSettingsChanged();
        });

        $ldapSettingsMainContainer.find("input").on("keyup", onSettingsChanged);

        $(window).trigger("rightSideReady", null);

        apiService
            .get("ldap/status")
            .done(function (data) {
                var status = data;
                if($.isEmptyObject(data)) {
                   return;
                }

                if(status.operationType == "Sync") {
                    syncInProgress = true;
                    disableInterface();
                    setProgress(status);
                    progressBarIntervalId = setInterval(checkStatus, constants.GET_STATUS_TIMEOUT);
                    return;
                }

                if(status.operationType == "Save") {
                    syncInProgress = false;
                    disableInterface();
                    setProgress(status);
                    Common.spoiler.toggle('#ldapSettingsSpoiler', $ldapSettingsSpoilerLink);
                    $('html, body').animate({
                        scrollTop: $ldapSettingsProgressbarContainer.offset().top
                    }, 2000);
                    progressBarIntervalId = setInterval(checkStatus, constants.GET_STATUS_TIMEOUT);
                    return;
                }
            })
            .fail(function(jqXHR, textStatus) {
                console.error("get ldap status on init", jqXHR, textStatus);
            });
    }

    return {
        init: init,
        restoreDefaultSettings: restoreDefaultSettings,
        continueSaveSettings: continueSaveSettings
    };
})();