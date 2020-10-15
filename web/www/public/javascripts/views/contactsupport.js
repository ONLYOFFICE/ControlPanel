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


window.ContactSupportManager = function ($, apiService) {
    var errorContactSupportFormMessage = '';

    function init(errorFormMessage) {
        errorContactSupportFormMessage = errorFormMessage;

        $(".contact-support-form .container-base input, .contact-support-form .container-base textarea").val("");
        $("#sendContactSupport").on("click", function () {
            sendMailSupport();
        });

        $(window).trigger("rightSideReady", null);

        $(window).on("popupIsClosing", function (event, elt, popup_id) {
            if (popup_id == 'contactSupportMsgSendSuccessfullPanel') {
                $(".contact-support-form .container-base input, .contact-support-form .container-base textarea").val("");
            }
        });

        bindUploadEvent();
    }

    function sendMailSupport() {
        var $name = $("#nameContactSupport"),
            $email = $("#emailContactSupport"),
            $subject = $("#subjectContactSupport"),
            $message = $("#messageContactSupport"),
            $attachments = $("#attachmentsUploadInput"),

            name = $name.val(),
            email = $email.val(),
            subject = $subject.val(),
            message = $message.val(),
            data = {
                name: name,
                email: email,
                subject: subject,
                message: message,
                filepath: $attachments.val()
            },
            isError = false;

        $(".contact-support-form .contact-support-field.error").removeClass("error");

        if (!email || !Common.isValidEmail(email)) {
            $email.addClass("error");
            isError = true;
        }

        if (!name) {
            $name.addClass("error");
            isError = true;
        }

        if (!subject) {
            $subject.addClass("error");
            isError = true;
        }

        if (!message) {
            $message.addClass("error");
            isError = true;
        }

        if (isError) {
            toastr.error(errorContactSupportFormMessage);
            return;
        }


        Common.loader.show();
        apiService.post('ContactSupport/SendNotification', data)
            .done(function (response) {
                if (response.success) {
                    Common.loader.hide();
                    Common.blockUI.show("contactSupportMsgSendSuccessfullPanel", 450, 300, 0);
                } else {
                    toastr.error(Resource.OperationFailedError);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                Common.loader.hide();
                toastr.error(errorThrown);
            });
    }

    function bindUploadEvent() {

        UploadBinder.init(
        "#attachmentsUploader",
        Common.basePath + "ContactSupport/UploadAttachments",
        {
            onSuccess: uploadAttachmentsComplete,
            onError: function () {
                toastr.error(Resource.OperationFailedError);
            },
            onComplete: function () {
                Common.loader.hide();
            }
        });
    }

    function uploadAttachmentsComplete(data) {
        if (data.success) {
            $("#attachmentsUploadInput").val(data.filePath);
        } else {
            toastr.error(data.message);
        }
    }

    return {
        init: init
    };
}($, window.ApiService);