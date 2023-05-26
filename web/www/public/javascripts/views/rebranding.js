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


window.RebrandingManager = (function() {
    var isInit = false,
    successMessage = "",
    companySettings = null,
    additionalSettings = null,
    mailSettings = null,

    $tabContainer = $("#tabContainer"),
    $mainContainer = $("#rebrandingMainContainer"),

    $companySettingsSpoilerLink = $("#companySettingsSpoilerLink"),
    $companySettingsCompanyName = $("#companySettingsCompanyName"),
    $companySettingsEmail = $("#companySettingsEmail"),
    $companySettingsPhone = $("#companySettingsPhone"),
    $companySettingsSite = $("#companySettingsSite"),
    $companySettingsAddress = $("#companySettingsAddress"),
    $companySettingsSaveBtn = $("#companySettingsSaveBtn"),
    $companySettingsResetBtn = $("#companySettingsResetBtn"),

    $additionalSettingsSpoilerLink = $("#additionalSettingsSpoilerLink"),
    $additionalSettingsFeedbackAndSupportEnabled = $("#additionalSettingsFeedbackAndSupportEnabled"),
    $additionalSettingsFeedbackAndSupportUrl = $("#additionalSettingsFeedbackAndSupportUrl"),
    $additionalSettingsUserForumEnabled = $("#additionalSettingsUserForumEnabled"),
    $additionalSettingsUserForumUrl = $("#additionalSettingsUserForumUrl"),
    $additionalSettingsVideoGuidesEnabled = $("#additionalSettingsVideoGuidesEnabled"),
    $additionalSettingsVideoGuidesUrl = $("#additionalSettingsVideoGuidesUrl"),
    $additionalSettingsLicenseAgreementsEnabled = $("#additionalSettingsLicenseAgreementsEnabled"),
    $additionalSettingsLicenseAgreementsUrl = $("#additionalSettingsLicenseAgreementsUrl"),
    $additionalSettingsHelpCenterEnabled = $("#additionalSettingsHelpCenterEnabled"),
    $additionalSettingsStartDocsEnabled = $("#additionalSettingsStartDocsEnabled"),
    $additionalSettingsSalesEmail = $("#additionalSettingsSalesEmail"),
    $additionalSettingsBuyUrl = $("#additionalSettingsBuyUrl"),
    $additionalSettingsSaveBtn = $("#additionalSettingsSaveBtn"),
    $additionalSettingsResetBtn = $("#additionalSettingsResetBtn"),

    $mailSettingsSpoilerLink = $("#mailSettingsSpoilerLink");
    $mailSettingsFooterEnabled = $("#mailSettingsFooterEnabled");
    $mailSettingsFooterSocialEnabled = $("#mailSettingsFooterSocialEnabled");
    $mailSettingsSiteUrl = $("#mailSettingsSiteUrl");
    $mailSettingsDemoUrl = $("#mailSettingsDemoUrl");
    $mailSettingsSupportUrl = $("#mailSettingsSupportUrl");
    $mailSettingsSalesEmail = $("#mailSettingsSalesEmail");
    $mailSettingsSupportEmail = $("#mailSettingsSupportEmail");
    $mailSettingsSaveBtn = $("#mailSettingsSaveBtn");
    $mailSettingsResetBtn = $("#mailSettingsResetBtn");

    function uploadWhiteLabelLogoComplete(data, params) {
        if (data.success) {
            $('#companySettingsSpoiler .logo_' + data.logotype).attr('src', data.message);
            $("[id^=canvas_logo_" + data.logotype + "]").hide();
            $('#logoPath_' + data.logotype).val(data.filePath);
        } else {
            toastr.error(data.message);
        }
    };
    function bindUploadEvent() {
        var $uploaderBtns = $('[id^=logoUploaderAbout_]');

        for (var i = 0, n = $uploaderBtns.length; i < n; i++) {
            var inputID = $($uploaderBtns[i]).attr('id'),
                logotype = inputID.split('_')[1];
            
            UploadBinder.init(
                '#' + inputID,
                Common.basePath + 'WhiteLabel/UploadLogo?logotype=' + logotype,
                {
                    onSuccess: uploadWhiteLabelLogoComplete,
                    onError: function (error) {
                        toastr.error(error.message);
                    },
                    onComplete: function () {
                        Common.loader.hide();
                    }
                });
        }

        $uploaderBtns.parent().on("mouseenter", function () {
            $(this).children(".button.black").addClass("hover");
        });
        $uploaderBtns.parent().on("mouseleave", function () {
            $(this).children(".button.black.hover").removeClass("hover");
        });
    };
    function getWhiteLabelData() {
        window.ApiService.get('WhiteLabel/GetLogos?isDefault=true')
                .always(function () {
                    window.Common.loader.hide;
                })
                .done(function (response) {
                    if (response.success) {
                        $("#whiteLabelLogoText").val(response.logoText).attr("data-value", response.logoText);
                        $('[id^=logoPath_]').val('');

                        var logos = response.logos,
                            t = new Date().getTime();

                        var $logoImgs = $("#companySettingsSpoiler .logo-img-container>img"),
                            count = $logoImgs.length,
                            loaded_count = 0;
                        for(var i =0; i < count; i ++)
                        {
                            $($logoImgs[i]).one("load", function () {
                                loaded_count ++;
                                if(loaded_count == count) {
                                    $("[id^=canvas_logo_]").hide();
                                }
                            });
                        }
                        for (var l in logos) {
                            $("img.logo_" + l).attr("src", logos[l] + "?t=" + t);
                        }
                        $("#rebrandingMainContainer").removeClass("display-none");
                    } else {
                        $("#errorBlockTmpl").tmpl({ content: response.message }).appendTo('.layoutRightSide:first');
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (window.ApiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                })
                .complete(function (jqXHR, textStatus) {
                    if (window.ApiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                });

    };

    function restoreWhiteLabelOptions () {
        Common.loader.show();
        var data = {
            restoreLogoText: false,
            logoTypes: []
        };
        $logoPaths = $('#companySettingsSpoiler [id^=logoPath_]');

        for(var k = 0, l = $logoPaths.length; k < l;  k++)
        {
            var logotype = $($logoPaths[k]).attr('id').split('_')[1];
            data.logoTypes.push(logotype);

        }
        window.ApiService.post('rebranding/restoreSelectedLogos', data)
            .always(function () {
                Common.loader.hide();
            })
            .done(function (response) {
                if (response.success) {
                    getWhiteLabelData();
                } else {
                    window.toastr.error(response.message);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (window.ApiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                console.log(arguments);
                window.toastr.error(errorThrown);
            });

    };

    function showError(error) {
        window.toastr.error((error ? error.responseText || error.statusText : null) || window.Resource.OperationFailedError);
    }

    function showSuccess() {
        window.toastr.success(successMessage || window.Resource.OperationSucceededMsg);
    }

    function validateEmail(email) {
        var emailRegex = /.+@.+\..+/;

        return emailRegex.test(email);
    }

    function validateUrl(url) {
        var urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

        return urlRegex.test(url);
    }

    function initCompanySetting() {
        $companySettingsCompanyName.val(companySettings.companyName).removeClass("error");
        $companySettingsEmail.val(companySettings.email).removeClass("error");
        $companySettingsPhone.val(companySettings.phone).removeClass("error");
        $companySettingsSite.val(companySettings.site).removeClass("error");
        $companySettingsAddress.val(companySettings.address).removeClass("error");
    }

    function getValidCompanySettings() {
        var isValid = true;
        
        var settings = {
            companyName: $companySettingsCompanyName.val().trim(),
            email: $companySettingsEmail.val().trim(),
            phone: $companySettingsPhone.val().trim(),
            site: $companySettingsSite.val().trim(),
            address: $companySettingsAddress.val().trim()
        }

        if (!settings.companyName) {
            isValid = false;
            $companySettingsCompanyName.addClass("error");
        } else {
            $companySettingsCompanyName.removeClass("error");
        }

        if (!validateEmail(settings.email)) {
            isValid = false;
            $companySettingsEmail.addClass("error");
        } else {
            $companySettingsEmail.removeClass("error");
        }

        if (!settings.phone) {
            isValid = false;
            $companySettingsPhone.addClass("error");
        } else {
            $companySettingsPhone.removeClass("error");
        }

        if (!validateUrl(settings.site)) {
            isValid = false;
            $companySettingsSite.addClass("error");
        } else {
            $companySettingsSite.removeClass("error");
        }

        if (!settings.address) {
            isValid = false;
            $companySettingsAddress.addClass("error");
        } else {
            $companySettingsAddress.removeClass("error");
        }

        return isValid ? settings : null;
    }

    function saveCompanySettings() {
        var data = {
            logo: []
        };
        $logoPaths = $('#companySettingsSpoiler [id^=logoPath_]'),
            needToSave = false;
        
        for (var i = 0, n = $logoPaths.length; i < n; i++) {
            var logotype = $($logoPaths[i]).attr('id').split('_')[1],
                logoPath = $.trim($($logoPaths[i]).val());

            data.logo.push({
                key: logotype,
                value: logoPath
            });

            if (logoPath != "") { needToSave = true; }
        }

        if (needToSave) {
            window.Common.loader.show();
            window.ApiService.post('WhiteLabel/SaveLogos?isDefault=true', data)
                .done(function (response) {
                    if (response.success) {
                        getWhiteLabelData();
                    } else {
                        Common.loader.hide();
                        window.toastr.error(response.message);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (window.ApiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    Common.loader.hide();
                    window.toastr.error(errorThrown);
                });
        }

        var settings = getValidCompanySettings();

        if (!settings) {
            $.scrollTo($("#companySettingsSpoiler .error:first"), 500);
            return;
        }

        window.Common.loader.show();

        window.ApiService.post("rebranding/company", { settings: settings })
            .then(disableMailSettingsFooter)
            .then(showSuccess, showError)
            .always(window.Common.loader.hide);
    }

    function resetCompanySettings() {
        restoreWhiteLabelOptions();
        window.Common.loader.show();

        window.ApiService.delete("rebranding/company")
            .then(function (data) { 
                companySettings = data;
                initCompanySetting();
                showSuccess()
            }, showError)
            .always(window.Common.loader.hide);
    }

    function initAdditionalSettings() {
        $additionalSettingsFeedbackAndSupportEnabled.toggleClass("checked", additionalSettings.feedbackAndSupportEnabled);
        $additionalSettingsFeedbackAndSupportUrl.val(additionalSettings.feedbackAndSupportUrl).removeClass("error").attr("disabled", !additionalSettings.feedbackAndSupportEnabled).toggleClass("disabled", !additionalSettings.feedbackAndSupportEnabled);
        $additionalSettingsUserForumEnabled.toggleClass("checked", additionalSettings.userForumEnabled);
        $additionalSettingsUserForumUrl.val(additionalSettings.userForumUrl).removeClass("error").attr("disabled", !additionalSettings.userForumEnabled).toggleClass("disabled", !additionalSettings.userForumEnabled);
        $additionalSettingsVideoGuidesEnabled.toggleClass("checked", additionalSettings.videoGuidesEnabled);
        $additionalSettingsVideoGuidesUrl.val(additionalSettings.videoGuidesUrl).removeClass("error").attr("disabled", !additionalSettings.videoGuidesEnabled).toggleClass("disabled", !additionalSettings.videoGuidesEnabled);
        $additionalSettingsLicenseAgreementsEnabled.toggleClass("checked", additionalSettings.licenseAgreementsEnabled);
        $additionalSettingsLicenseAgreementsUrl.val(additionalSettings.licenseAgreementsUrl).removeClass("error").attr("disabled", !additionalSettings.licenseAgreementsEnabled).toggleClass("disabled", !additionalSettings.licenseAgreementsEnabled);
        $additionalSettingsHelpCenterEnabled.toggleClass("checked", additionalSettings.helpCenterEnabled);
        $additionalSettingsStartDocsEnabled.toggleClass("checked", additionalSettings.startDocsEnabled);
        $additionalSettingsSalesEmail.val(additionalSettings.salesEmail).removeClass("error");
        $additionalSettingsBuyUrl.val(additionalSettings.buyUrl).removeClass("error");
    }

    function getValidAdditionalSettings() {
        var isValid = true;

        var settings = {
            feedbackAndSupportEnabled: $additionalSettingsFeedbackAndSupportEnabled.hasClass("checked"),
            feedbackAndSupportUrl: $additionalSettingsFeedbackAndSupportUrl.val().trim(),
            userForumEnabled: false && $additionalSettingsUserForumEnabled.hasClass("checked"),
            userForumUrl: $additionalSettingsUserForumUrl.val().trim(),
            videoGuidesEnabled: $additionalSettingsVideoGuidesEnabled.hasClass("checked"),
            videoGuidesUrl: $additionalSettingsVideoGuidesUrl.val().trim(),
            licenseAgreementsEnabled: $additionalSettingsLicenseAgreementsEnabled.hasClass("checked"),
            licenseAgreementsUrl: $additionalSettingsLicenseAgreementsUrl.val().trim(),
            helpCenterEnabled: $additionalSettingsHelpCenterEnabled.hasClass("checked"),
            startDocsEnabled: $additionalSettingsStartDocsEnabled.hasClass("checked"),
            salesEmail: $additionalSettingsSalesEmail.val().trim(),
            buyUrl: $additionalSettingsBuyUrl.val().trim()
        }

        if (settings.feedbackAndSupportEnabled && !validateUrl(settings.feedbackAndSupportUrl)) {
            isValid = false;
            $additionalSettingsFeedbackAndSupportUrl.addClass("error");
        } else {
            $additionalSettingsFeedbackAndSupportUrl.removeClass("error");
        }

        if (settings.userForumEnabled && !validateUrl(settings.userForumUrl)) {
            isValid = false;
            $additionalSettingsUserForumUrl.addClass("error");
        } else {
            $additionalSettingsUserForumUrl.removeClass("error");
        }

        if (settings.videoGuidesEnabled && !validateUrl(settings.videoGuidesUrl)) {
            isValid = false;
            $additionalSettingsVideoGuidesUrl.addClass("error");
        } else {
            $additionalSettingsVideoGuidesUrl.removeClass("error");
        }

        if (settings.licenseAgreementsEnabled && !validateUrl(settings.licenseAgreementsUrl)) {
            isValid = false;
            $additionalSettingsLicenseAgreementsUrl.addClass("error");
        } else {
            $additionalSettingsLicenseAgreementsUrl.removeClass("error");
        }

        if (!validateEmail(settings.salesEmail)) {
            isValid = false;
            $additionalSettingsSalesEmail.addClass("error");
        } else {
            $additionalSettingsSalesEmail.removeClass("error");
        }

        if (!validateUrl(settings.buyUrl)) {
            isValid = false;
            $additionalSettingsBuyUrl.addClass("error");
        } else {
            $additionalSettingsBuyUrl.removeClass("error");
        }

        return isValid ? settings : null;
    }

    function saveAdditionalSettings() {
        var settings = getValidAdditionalSettings();

        if (!settings) {
            $.scrollTo($("#additionalSettingsSpoiler .error:first"), 500);
            return;
        }

        window.Common.loader.show();

        window.ApiService.post("rebranding/additional", { settings: settings })
            .then(disableMailSettingsFooter)
            .then(showSuccess, showError)
            .always(window.Common.loader.hide);
    }

    function resetAdditionalSettings() {
        window.Common.loader.show();

        window.ApiService.delete("rebranding/additional")
            .then(function (data) { 
                additionalSettings = data;
                initAdditionalSettings();
                showSuccess()
            }, showError)
            .always(window.Common.loader.hide);
    }

    function initMailSettings() {
        $mailSettingsFooterEnabled.toggleClass("checked", mailSettings.footerEnabled);
        $mailSettingsFooterSocialEnabled.toggleClass("checked", mailSettings.footerSocialEnabled);
        $mailSettingsSiteUrl.val(mailSettings.siteUrl).removeClass("error");
        $mailSettingsDemoUrl.val(mailSettings.demoUrl).removeClass("error");
        $mailSettingsSupportUrl.val(mailSettings.supportUrl).removeClass("error");
        $mailSettingsSalesEmail.val(mailSettings.salesEmail).removeClass("error");
        $mailSettingsSupportEmail.val(mailSettings.supportEmail).removeClass("error");
    }

    function getValidMailSettings() {
        var isValid = true;
        
        var settings = {
            footerEnabled: $mailSettingsFooterEnabled.hasClass("checked"),
            footerSocialEnabled: $mailSettingsFooterSocialEnabled.hasClass("checked"),
            siteUrl: $mailSettingsSiteUrl.val().trim(),
            demoUrl: $mailSettingsDemoUrl.val().trim(),
            supportUrl: $mailSettingsSupportUrl.val().trim(),
            salesEmail: $mailSettingsSalesEmail.val().trim(),
            supportEmail: $mailSettingsSupportEmail.val().trim()
        }

        if (!validateUrl(settings.siteUrl)) {
            isValid = false;
            $mailSettingsSiteUrl.addClass("error");
        } else {
            $mailSettingsSiteUrl.removeClass("error");
        }

        if (!validateUrl(settings.demoUrl)) {
            isValid = false;
            $mailSettingsDemoUrl.addClass("error");
        } else {
            $mailSettingsDemoUrl.removeClass("error");
        }

        if (!validateUrl(settings.supportUrl)) {
            isValid = false;
            $mailSettingsSupportUrl.addClass("error");
        } else {
            $mailSettingsSupportUrl.removeClass("error");
        }

        if (!validateEmail(settings.salesEmail)) {
            isValid = false;
            $mailSettingsSalesEmail.addClass("error");
        } else {
            $mailSettingsSalesEmail.removeClass("error");
        }

        if (!validateEmail(settings.supportEmail)) {
            isValid = false;
            $mailSettingsSupportEmail.addClass("error");
        } else {
            $mailSettingsSupportEmail.removeClass("error");
        }

        return isValid ? settings : null;
    }

    function saveMailSettings() {
        var settings = getValidMailSettings();

        if (!settings) {
            $.scrollTo($("#mailSettingsSpoiler .error:first"), 500);
            return;
        }

        window.Common.loader.show();

        window.ApiService.post("rebranding/mail", { settings: settings })
            .then(showSuccess, showError)
            .always(window.Common.loader.hide);
    }

    function disableMailSettingsFooter() {
        window.ApiService.put("rebranding/mail", { footerEnabled: false });
    }

    function resetMailSettings() {
        window.Common.loader.show();

        window.ApiService.delete("rebranding/mail")
            .then(function (data) { 
                mailSettings = data;
                initMailSettings();
                showSuccess()
            }, showError)
            .always(window.Common.loader.hide);
    }

    function changeState(cbxObj, textObj) {
        var disabled = !cbxObj.hasClass("checked");
        textObj.attr("disabled", disabled).toggleClass("disabled", disabled);
    }

    function bindEvents() {
        $tabContainer.on("click", ".tab-item-link", function(){
            $tabContainer.find(".tab-item-link, .tab-item-content").toggleClass("selected")
        });

        $companySettingsSpoilerLink.on("click", function(){
            Common.spoiler.toggle("#companySettingsSpoiler", $(this));
        });

        $companySettingsSaveBtn.on("click", saveCompanySettings);

        $companySettingsResetBtn.on("click", resetCompanySettings);

        $additionalSettingsSpoilerLink.on("click", function(){
            Common.spoiler.toggle("#additionalSettingsSpoiler", $(this));
        });

        $additionalSettingsFeedbackAndSupportEnabled.on("click", function(){
            changeState($(this), $additionalSettingsFeedbackAndSupportUrl);
        });

        $additionalSettingsUserForumEnabled.on("click", function(){
            changeState($(this), $additionalSettingsUserForumUrl);
        });

        $additionalSettingsVideoGuidesEnabled.on("click", function(){
            changeState($(this), $additionalSettingsVideoGuidesUrl);
        });

        $additionalSettingsLicenseAgreementsEnabled.on("click", function(){
            changeState($(this), $additionalSettingsLicenseAgreementsUrl);
        });

        $additionalSettingsSaveBtn.on("click", saveAdditionalSettings);

        $additionalSettingsResetBtn.on("click", resetAdditionalSettings);

        $mailSettingsSpoilerLink.on("click", function(){
            Common.spoiler.toggle("#mailSettingsSpoiler", $(this));
        });

        $mailSettingsSaveBtn.on("click", saveMailSettings);

        $mailSettingsResetBtn.on("click", resetMailSettings);

        $mainContainer.removeClass("display-none");

        $mainContainer.on("click", ".img-popup-helper", function(){
            var data = $(this).data();
            Common.blockUI.show(data.id, data.width, data.height, undefined, undefined, undefined, Common.blockUI.hide);
        })
    }

    function init(success, company, additional, mail, error) {

        if (isInit) return;
        
        if (error) {
            window.toastr.error(error);
            isInit = true;
            $(window).trigger("rightSideReady", null);
            return;
        }

        getWhiteLabelData();

        successMessage = success;
        companySettings = company;
        additionalSettings = additional;
        mailSettings = mail;

        initCompanySetting();
        initAdditionalSettings();
        initMailSettings();
        bindEvents();
        bindUploadEvent();

        isInit = true;
        $(window).trigger("rightSideReady", null);
    }

    return {
        init: init
    };

})();