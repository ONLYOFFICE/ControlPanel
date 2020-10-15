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


window.LoginView = function($, apiService, loaderService) {

    var portalRegex = /^http(s)?\:\/\/.*$/i;
    var emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    var $view = $('#loginView');

    var $loginForm = $view.find('#loginForm');

    var $loginPortal = $loginForm.find('#loginPortal');
    var $loginEmail = $loginForm.find('#loginEmail');
    var $loginPassword = $loginForm.find('#loginPassword');
    var $incorrectLoginCombinationError = $loginForm.find('#incorrectLoginCombinationError');
    var $incorrectAccessRightsError = $loginForm.find('#incorrectAccessRightsError');

    var $loginBtn = $view.find('#loginBtn');

    function init() {
        bindEvents();

        Common.selectorListener.init();
        $('.layoutFooter').removeClass('display-none');
    }

    function bindEvents() {
        $("#loginPortal, #loginEmail, #loginPassword").on("keyup", loginOnEnter);
        $loginBtn.on('click', login);
        $(".login-toast-close").click(clearForm);
    }

    function loginOnEnter(e) {
        if (e.keyCode == 13) {
            $(this).next().focus();

            if ($(this).is("#loginPassword")) {
                login();
            }
        }
    }

    function login() {
        clearForm();
        if (!verifyForm()) {
            return;
        }

        var data = {
            userName: $loginEmail.val().trim(),
            password: $loginPassword.val().trim()
        };

        if ($loginPortal.length) {
            data.portal = $loginPortal.val().trim();
        }

        loaderService.showFormBlockLoader($loginForm);
        apiService.post('', data)
            .done(function(resp) {
                if (resp.success) {
                    window.location.href = Common.basePath;
                } else {
                    loaderService.hideFormBlockLoader($loginForm);
                    $("#loginError").show();
                    $incorrectAccessRightsError.show();
                }

            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                loaderService.hideFormBlockLoader($loginForm);
                $("#loginError").show();
                $incorrectLoginCombinationError.show();
            });
    }

    function verifyForm() {
        var res = true;

        if ($loginPortal.length) {
            var portal = $loginPortal.val().trim();
            if (portal === '' || !portalRegex.test(portal)) {
                $loginPortal.addClass('invalid');
                res = false;
            }
        }

        var email = $loginEmail.val().trim();
        if (email === '' || !emailRegex.test(email)) {
            $loginEmail.addClass('invalid');
            res = false;
        }

        if ($loginPassword.val() === '') {
            $loginPassword.addClass('invalid');
            res = false;
        }

        return res;
    }

    function clearForm() {
        if ($loginPortal.length) {
            $loginPortal.removeClass('invalid');
        }

        $loginEmail.removeClass('invalid');
        $loginPassword.removeClass('invalid');

        $("#loginError").hide();
        $incorrectLoginCombinationError.hide();
        $incorrectAccessRightsError.hide();
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);