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


window.HttpsView = function ($, apiService, loaderService) {

    var $view = $("#https-view"),
        $certificateInput = $view.find("#certificateInput"),
        $certificateUploader = $view.find("#certificateUploader"),
        $keyInput = $view.find("#keyInput"),
        $keyUploader = $view.find("#keyUploader"),
        $applyCertificateBtn = $view.find("#apply-certificate-btn"),
        $generateSelfSignedCertificateBtn = $view.find("#generate-self-signed-certificate-btn"),
        $currentDomain = $view.find("#currentDomain"),
        $formHttps = $view.find("#formHttps"),
        $formHttpsCreate = $view.find("#formHttpsCreate");

    var init = function () {
        showLoader();

        bindUploaders();
        bindEvents();

        apiService.get("Https/FilesExists", false)
            .always(function () {
                hideLoader();
            })
            .done(processExists)
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo(".layoutRightSide:first");
            })
            .complete(function () {
                $(window).trigger("rightSideReady", null);
            });
    };

    function showLoader() {
        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);
    }

    function hideLoader() {
        loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
    }

    function bindEvents() {
        $view.on("click", "#apply-certificate-btn:not(.disabled)", applyCertificate);
        $generateSelfSignedCertificateBtn.on("click", generateSelfSignedCertificate);
        $("#deleteDomainBtn").click(deleteCertificate);
    };

    function bindUploaders() {
        $certificateUploader.fileupload({
            url: Common.basePath + "Https/UploadCertificate",
            dataType: "json",
            progress: function (evt, data) {
                Common.loader.show();
            },
            done: function (evt, resp) {
                Common.loader.hide();
                if (resp.result && resp.result.success) {
                    $certificateInput.val(window.Resource.HttpsCertificateUploaded);
                    if ($certificateInput.val() && $keyInput.val()) {
                        $applyCertificateBtn.removeClass("disabled");
                    }

                    toastr.success(window.Resource.OperationSucceededMsg);
                } else {
                    toastr.error(window.Resource.IncorrectFileType);
                }
            },
            fail: function () {
                toastr.error(window.Resource.OperationFailedError);
            },
        });

        $keyUploader.fileupload({
            url: Common.basePath + "Https/UploadKey",
            dataType: "json",
            progress: function (evt, data) {
                Common.loader.show();
            },
            add: function (evt, data) {
                var file = data.files[0];
                if (/.+\.key/.test(file.name)) {
                    data.submit();
                } else {
                    toastr.error(window.Resource.IncorrectFileType);
                }
            },
            done: function (evt, resp) {
                Common.loader.hide();
                if (resp.result && resp.result.success) {
                    $keyInput.val(window.Resource.HttpsKeyUploaded);
                    if ($certificateInput.val() && $keyInput.val()) {
                        $applyCertificateBtn.removeClass("disabled");
                    }

                    toastr.success(window.Resource.OperationSucceededMsg);
                } else {
                    toastr.error(window.Resource.IncorrectFileType);
                }
            },
            fail: function () {
                toastr.error(window.Resource.OperationFailedError);
            }
        });
    };

    function applyCertificate() {
        showLoader();
        apiService.post("Https/ApplyCertificate")
            .done(function (resp) {
                //toastr.success(window.Resource.OperationSucceededMsg);
                //processExists(resp);
                setTimeout(function () { location.href = "/"; }, 10000);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                if(jqXHR && jqXHR.status === 500 && jqXHR.responseText){
                    hideLoader();
                    toastr.error(jqXHR.responseText);
                }else{
                    setTimeout(function() { location.href = "/"; }, 10000);
                }
            });
    };

    function generateSelfSignedCertificate() {
        showLoader();
        apiService.post("Https/GenerateSelfSignedCertificate")
            .done(function (resp) {
                hideLoader();
                if (resp.certificate && resp.key) {
                    setTimeout(function () {
                        location.href = "/";;
                    }, 10000);
                    return;
                } else if (resp.success !== false) {
                    $certificateInput.val(window.Resource.HttpsCertificateUploaded);
                    $keyInput.val(window.Resource.HttpsKeyUploaded);
                    $applyCertificateBtn.removeClass("disabled");

                    toastr.success(window.Resource.OperationSucceededMsg);
                } else {
                    toastr.error(window.Resource.OperationFailedError);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                hideLoader();
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                if(textStatus =="error"){
                    setTimeout(function () {
                        location.href = "/";
                    }, 10000);
                }else{
                    toastr.error(window.Resource.OperationFailedError);
                }
            });
    };

    function deleteCertificate() {
        showLoader();
        apiService.delete("Https/DeleteCertificate")
            .done(function (resp) {
                toastr.success(window.Resource.OperationSucceededMsg);
                setTimeout(function () {
                    location.href = "/";
                }, 10000);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                setTimeout(function () {
                    hideLoader();
                    location.href = "/";
                }, 10000);
                toastr.error(window.Resource.OperationFailedError);
            });
    };

    function processExists (resp) {
        $applyCertificateBtn.addClass("disabled");

        if (resp.certificate && resp.key) {
            $currentDomain.text((resp.domain && resp.domain.length) ? resp.domain : "-");

            $formHttpsCreate.hide();
            $formHttps.show();
        } else if (resp.certificateTmp || resp.keyTmp) {
            $currentDomain.text("");

            $formHttps.hide();
            $formHttpsCreate.show();

            if (resp.certificateTmp) {
                $certificateInput.val(window.Resource.HttpsCertificateUploaded);
            }
            if (resp.keyTmp) {
                $keyInput.val(window.Resource.HttpsKeyUploaded);
            }

            if (resp.certificateTmp && resp.keyTmp) {
                $applyCertificateBtn.removeClass("disabled");
            }

        } else {
            $currentDomain.text("");

            $formHttps.hide();
            $formHttpsCreate.show();
        }
    };

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);

window.WinHttpsView = (function () {

    var uploadData = null,
        saveButton = null,
        okButton = null,
        passwordInput = null,
        certificateInput = null,
        certificateUploader = null,
        uploadedPath = null;

    function init() {
        saveButton = $("#saveWinCertificate");
        okButton = $("#checkAttachmentDialog .okbtn");
        passwordInput = $("#certificatePassword");
        certificateInput = $("#certificateInput");
        certificateUploader = $("#certificateUploader");

        bindUploader();
        bindEvents();
    }

    function bindUploader() {

        uploadData = null;
        certificateInput.val("");

        certificateUploader.fileupload({
            url: Common.basePath + "httpsWin/processUpload",
            dataType: "json",
            autoUpload: false,
            singleFileUploads: true,
            sequentialUploads: true,
            progress: function () {
                Common.loader.show();
            },
            add: function (e, data) {
                if (getFileExtension(data.files[0].name) != ".pfx") {
                    uploadData = null;
                    certificateInput.val("");
                    toastr.error(window.Resource.HttpsCertificateFileTypeError);
                } else {
                    uploadData = data;
                    certificateInput.val(data.files[0].name);

                    if (passwordInput.val().trim())
                        saveButton.removeClass("disabled");
                }
            },
            done: function (e, uploadRes) {
                if (uploadRes.result.success) {
                    uploadedPath = uploadRes.result.file;
                    window.ApiService.get("httpsWin/checkAttachment", false)
                        .done(function(res) {
                            var checkRes = res;
                            if (checkRes.success) {
                                if (checkRes.exist) {
                                    Common.blockUI.show("checkAttachmentDialog", 500, 400, 0);
                                    Common.loader.hide();
                                } else {
                                    uploadHttpsCertificate();
                                }
                            } else {
                                fail(checkRes.message);
                            }
                        })
                        .fail(fail);
                } else {
                    fail(uploadRes.result.message);
                }
            },
            fail: fail,
        });

        function fail(message) {
            uploadData = null;
            toastr.error(message || window.Resource.OperationFailedError);
            Common.loader.hide();
        }
    };
    
    function bindEvents() {

        saveButton.on("click", function () {
            if (!$(this).hasClass("disabled") && uploadData && passwordInput.val().trim())
                uploadData.submit();
        });

        okButton.on("click", function () {
            uploadHttpsCertificate();
            Common.blockUI.hide();
        });

        passwordInput.on("keyup", function () {
            if (uploadData && passwordInput.val().trim()) {
                saveButton.removeClass("disabled");
            } else {
                saveButton.addClass("disabled");
            }
        });
    };

    function uploadHttpsCertificate() {
        window.ApiService.post("httpsWin/uploadCertificate?filePath=" + uploadedPath + "&password=" + passwordInput.val().trim(), data)
            .done(function (res) {
                var uploadRes = res;
                if (uploadRes.success) {
                    uploadData = null;
                    passwordInput.val("");
                    toastr.success(window.Resource.OperationSucceededMsg);
                    location.reload();
                } else {
                    toastr.error(uploadRes.message);
                }
            })
            .fail(function() {
                toastr.error(window.Resource.OperationFailedError);
            })
            .always(function () {
                Common.loader.hide();
            });
    }

    function getFileExtension(fileTitle) {
        if (!fileTitle) return "";

        fileTitle = fileTitle.trim();
        var posExt = fileTitle.lastIndexOf(".");
        return 0 <= posExt ? fileTitle.substring(posExt).trim().toLowerCase() : "";
    }

    return {
        init: init
    };
})();