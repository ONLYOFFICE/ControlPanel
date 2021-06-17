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


window.PrivacyRoom = function($, apiService, loaderService) {
    var $privacyRoomSettingsView = $("#privacyRoomSettingsView"),
        $privacyRoomSettingsSwitch = $("#privacyRoomSettingsSwitch"),
        $privacyRoomSettingsBtn = $("#privacyRoomSettingsBtn");

    function showLoader() {
        loaderService.showFormBlockLoader($(".layoutRightSide:first"), 0, $(".layoutBody:first").height() / 2 + 100);
    }

    function hideLoader() {
        loaderService.hideFormBlockLoader($(".layoutRightSide:first"));
    }

    function init() {
        getEncryptionStatus();
    }

    function getEncryptionStatus() {
        showLoader();
        apiService.get("privacyRoom/getEncryptionStatus", false)
            .always(hideLoader)
            .done(onGetEncryptionStatusSuccess)
            .fail(onGetEncryptionStatusError)
            .complete(function () {
                $(window).trigger("rightSideReady", null);
            });
    }

    function onGetEncryptionStatusSuccess(res) {
        var enable = (typeof res == "boolean" && res) || (typeof res == "object" && res.response);
        changePrivacyRoomSettingsSwitch(enable);
        $privacyRoomSettingsView.removeClass("display-none");
        $privacyRoomSettingsSwitch.on("click", togglePrivacyRoomSettings);
        $privacyRoomSettingsBtn.on("click", setEncryptionStatus);
    }

    function onGetEncryptionStatusError(jqXHR, textStatus, errorThrown) {
        if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
        $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo(".layoutRightSide:first");
    }

    function changePrivacyRoomSettingsSwitch(enable) {
        if (enable) {
            $privacyRoomSettingsSwitch.removeClass("off").addClass("on");
            $privacyRoomSettingsSwitch.find(".text").text(window.Resource.On);
        } else {
            $privacyRoomSettingsSwitch.removeClass("on").addClass("off");
            $privacyRoomSettingsSwitch.find(".text").text(window.Resource.Off);
        }
    }

    function togglePrivacyRoomSettings() {
        var enable = $privacyRoomSettingsSwitch.hasClass("off");
        changePrivacyRoomSettingsSwitch(enable);
    }

    function setEncryptionStatus(enable) {
        showLoader()
        apiService.put("privacyRoom/setEncryptionStatus", { enable: $privacyRoomSettingsSwitch.hasClass("on") }, false)
            .always(hideLoader)
            .done(onSetEncryptionStatusSuccess)
            .fail(onSetEncryptionStatusError);
    }

    function onSetEncryptionStatusSuccess() {
        window.toastr.success(window.Resource.OperationSucceededMsg);
    }

    function onSetEncryptionStatusError(jqXHR, textStatus, errorThrown) {
        if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
        window.toastr.error(jqXHR ? (jqXHR.responseText || jqXHR.statusText) : window.Resource.OperationFailedError);
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);