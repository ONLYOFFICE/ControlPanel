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


window.ActivateView = function ($, apiService, loaderService) {

    var uploaded = false;
    var agree = $("#agreementsCbx").length ? false : true;

    function init(errorMessage) {
        if (errorMessage) {
            window.toastr.error(errorMessage);
        }
        bindEvents();
        $("#agreementsCbx").removeClass("checked");
        $("#activateInput").val("");
        $(window).trigger("rightSideReady", null);
    }

    function unlockButton() {
        $("#activateBtn").toggleClass("disabled", !uploaded || !agree);
    }

    function bindEvents() {

        UploadBinder.init("#activateFile", Common.basePath + "activate/uploadlicense",
            {
                onSuccess: function (res) {
                    if (res.success) {
                        $("#activateInput").val(res.data);
                        uploaded = true;
                        unlockButton();
                        toastr.success(res.message);
                    } else {
                        toastr.error(res.message);
                    }
                },
                onError: function () {
                    toastr.error(window.Resource.OperationFailedError);
                },
                onComplete: function () {
                    Common.loader.hide();
                }
            });

        $("#agreementsCbx").on("click", function () {
            agree = $(this).hasClass("checked");
            unlockButton();
        });

        $("#activateBtn").on("click", function () {
            if ($(this).hasClass("disabled")) return;

            apiService.post("activate/activatelicense")
                .done(function (res) {
                    if (res.success) {
                        toastr.success(res.message);
                        location.reload();
                    } else {
                        toastr.error(res.message);
                    }
                })
                .fail(function () {
                    toastr.error(window.Resource.OperationFailedError);
                });
        });
    }

    return {
        init: init
    };

}($, window.ApiService, window.LoaderService);