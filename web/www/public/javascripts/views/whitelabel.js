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


window.WhiteLabelManager = function($, apiService, loaderService) {
    var _successMsgTest = "";
    var _isInit = false;
    var _isDefault = false;

    function uploadWhiteLabelLogoComplete(data, params) {
        if (data.success) {
            $('#whiteLabelSettings .logo_' + data.logotype).attr('src', data.message);
            $("[id^=canvas_logo_" + data.logotype + "]").hide();
            $('#logoPath_' + data.logotype).val(data.filePath);
        } else {
            toastr.error(data.message);
        }
    };

    function updateWhiteLabelLogosSrc (whiteLabelLogos) {
        for (var logo in whiteLabelLogos) {
            if (whiteLabelLogos.hasOwnProperty(logo)) {
                var now = new Date();
                $('#whiteLabelSettings .logo_' + logo).attr('src', whiteLabelLogos[logo] + '?' + now.getTime());
            }
        }
    }

    function saveWhiteLabelOptions () {
        var data = {
            logoText: $("#whiteLabelLogoText").val(),
            logo: []
        };

        $logoPaths = $('#whiteLabelSettings [id^=logoPath_]'),
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

        if (data.logoText !== $("#whiteLabelLogoText").attr("data-value")) { needToSave = true; }


        if (needToSave) {
            Common.loader.show();
            apiService.post('WhiteLabel/SaveLogos?isDefault=' + _isDefault, data)
                .done(function (response) {
                    if (response.success) {
                        getWhiteLabelData(false);
                    } else {
                        Common.loader.hide();
                        toastr.error(response.message);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    Common.loader.hide();
                    toastr.error(errorThrown);
                });
        }
    };

    function restoreWhiteLabelOptions () {
        Common.loader.show();

        var method = 'whitelabel/restoreDefaultLogos?isDefault=' + _isDefault;
        var data = {};

        if (_isDefault) {
            method = 'rebranding/restoreSelectedLogos';
            data = {
                restoreLogoText: true,
                logoTypes: []
            };
            $logoPaths = $('#whiteLabelSettings [id^=logoPath_]');
            for(var k = 0, l = $logoPaths.length; k < l;  k++)
            {
                var logotype = $($logoPaths[k]).attr('id').split('_')[1];
                data.logoTypes.push(logotype);
            }
        }

        apiService.post(method, data)
            .always(function () {
                Common.loader.hide();
            })
            .done(function (response) {
                if (response.success) {
                    getWhiteLabelData(false);
                } else {
                    toastr.error(response.message);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                console.log(arguments);
                toastr.error(errorThrown);
            });

    };

    function getWhiteLabelData(firstTime) {
        if (firstTime === true) {
            loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);
        }
        apiService.get('WhiteLabel/GetLogos?isDefault=' + _isDefault)
                .always(function () {
                    if (firstTime === true) {
                        loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
                    } else {
                        Common.loader.hide();
                    }
                })
                .done(function (response) {
                    if (response.success) {
                        $("#whiteLabelLogoText").val(response.logoText).attr("data-value", response.logoText);
                        //clean logo path input
                        $('[id^=logoPath_]').val('');

                        var logos = response.logos,
                            t = new Date().getTime();

                        if (firstTime !== true) {
                            var $logoImgs = $("#whiteLabelSettings .logo-img-container>img"),
                                count = $logoImgs.length,
                                loaded_count = 0;
                            for (var i = 0; i < count; i++) {
                                $($logoImgs[i]).one("load", function () {
                                    loaded_count++;
                                    if (loaded_count == count) {
                                        $("[id^=canvas_logo_]").hide();
                                    }
                                });
                            }
                        }

                        for (var l in logos) {
                            $("img.logo_" + l).attr("src", logos[l] + "?t=" + t);
                        }
                        if (firstTime === true) {
                            $("#formContentWhitelabel").removeClass("display-none");
                        } else {
                            toastr.success(_successMsgTest);
                        }
                    } else {
                        $("#errorBlockTmpl").tmpl({ content: response.message }).appendTo('.layoutRightSide:first');
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    if (firstTime === true) {
                        $("#errorBlockTmpl").tmpl({ content: errorThrown }).appendTo('.layoutRightSide:first');
                    } else {
                        toastr.error(errorThrown);
                    }
                })
                .complete(function (jqXHR, textStatus) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    if (firstTime === true) {
                        $(window).trigger("rightSideReady", null);
                    }
                });

    };

    function useTextAsLogo() {

        var $canvas = $("[id^=canvas_logo_]"),
            text = $("#whiteLabelLogoText").val();

        for (var i = 0, n = $canvas.length; i < n; i++) {
            var cnv = $canvas[i],
                $c = $(cnv),
                fontsize = $c.attr("data-fontsize"),
                fontcolor = $c.attr("data-fontcolor"),
                logotype = $c.attr("id").replace("canvas_logo_", ""),
                x = logotype == 3 ? cnv.width / 2 : 0,
                firstChar = $.trim(text).charAt(0),
                firstCharCode = firstChar.charCodeAt(0),
                ctx = cnv.getContext("2d");

            if (logotype.indexOf('_') !== -1) logotype = logotype.split('_')[0]; // for docs editor

            if (firstCharCode >= 0xD800 && firstCharCode <= 0xDBFF) firstChar = $.trim(text).substr(0, 2); // Note: for surrogates pairs only

            ctx.fillStyle = "transparent";
            ctx.clearRect(0, 0, cnv.width, cnv.height);
            ctx.fillStyle = fontcolor;
            ctx.textAlign = logotype == 3 ? "center" : "start";
            ctx.textBaseline = "top";

            ctx.font = fontsize + "px Arial";

            ctx.fillText(logotype == 3 ? firstChar : text, x, (cnv.height - parseInt(fontsize)) / 2);

            var img = cnv.toDataURL("image/png", 1.0);
            $('#logoPath_' + logotype).val(img);

            $c.show();
        }
    };

    function bindUploadEvent() {
        var $uploaderBtns = $('[id^=logoUploader_]');

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

    function init(successMsgTest, isDefault) {
        if (_isInit == true) return;
        _successMsgTest = successMsgTest;
        _isDefault = !!isDefault;


        getWhiteLabelData(true);
       
        $('#saveWhiteLabelSettingsBtn').on("click", function () { saveWhiteLabelOptions(); });
        $('#restoreWhiteLabelSettingsBtn').on("click", function () { restoreWhiteLabelOptions(); });
        $("#useAsLogoBtn").on("click", function () { useTextAsLogo(); });

        bindUploadEvent();
    };

    return {
        init: init
    };

}($, window.ApiService, window.LoaderService);