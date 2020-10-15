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


String.prototype.format = function () {
    var txt = this,
        i = arguments.length;

    while (i--) {
        txt = txt.replace(new RegExp("\\{" + i + "\\}", "gm"), arguments[i]);
    }
    return txt;
};

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

var Common = (function () {
    var basePath = "/";
    var offlineMode = false;
    var windowsMode = false;

    var loader = function() {
        var animateDelay = 100;
        var displayOpacity = 1;
        var loaderId = "mainLoader";
        var loaderText = window.Resource.LoaderMsg;

        return {
            animateDelay: animateDelay,
            displayOpacity: displayOpacity,
            loaderId: loaderId,
            loaderText: loaderText,

            show: function() {
                var id = "#" + loaderId;

                if ($(id).length) {
                    return;
                }

                var innerHtml = '<div id="{0}" class="loader-container"><div class="loader">{1}</div></div>'
                    .format(loaderId, loaderText);

                $("body").append(innerHtml).addClass("loading");

                $(id).animate({ opacity: 0 }, 0, function() {
                    $(id).animate({ opacity: displayOpacity }, animateDelay);
                });
            },

            hide: function() {
                $("#" + loaderId).remove();
                $("body").removeClass("loading");
            }
        };
    }();

    var blockUI = function() {

        function block(obj, width, height, left, top, baseZ, overlayClick) {
            try {
                width = parseInt(width || 0);
                height = parseInt(height || 0);
                left = parseInt(left || -width / 2);
                top = parseInt(top || -height / 2);
                baseZ = parseInt(baseZ || 666);
                $.blockUI({
                    message: $(obj),
                    css: {
                        left: "50%",
                        top: "50%",
                        opacity: "1",
                        border: "none",
                        padding: "0px",
                        width: width > 0 ? width + "px" : "auto",
                        height: height > 0 ? height + "px" : "auto",
                        cursor: "default",
                        textAlign: "left",
                        position: "fixed",
                        "margin-left": left + "px",
                        "margin-top": top + "px",
                        "background-color": "Transparent"
                    },

                    overlayCSS: {
                        backgroundColor: "#adadad",
                        cursor: "default",
                        opacity: "0.4"
                    },

                    focusInput: true,
                    baseZ: baseZ,

                    fadeIn: 0,
                    fadeOut: 0,

                    onOverlayClick: overlayClick
                });
            } catch(e) {
            }
        }

        return {
            show: function(popupId, width, height, marginLeft, marginTop, baseZindex, onOverlayClick) {
                width = width || 500;
                height = height || 350;
                marginLeft = marginLeft || 0;
                marginTop = marginTop || 0;
                baseZindex = baseZindex || 666;
                block("#" + popupId, width, height, marginLeft, marginTop, baseZindex, onOverlayClick);
            },
            hide: function() {
                $.unblockUI();
            }
        };
    }();

    var isValidEmail = function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    var isValidPhone = function (phone) {
        var re = /^([0-9\(\)\/\+ \-]*)$/;
        return re.test(phone);
    }

    // https://gist.github.com/dperini/729294
    var isValidUrl = function (url) {
        return /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
    }

    var datetimeFormat = function (date) {
        return moment(date).format('YYYY-MM-DD HH:mm');
    };

    /*--------Error messages for required field-------*/
    var requiredField = function () {
        var showError = function (item, withouthScroll, withoutFocus, doNotHideOnChange) {
            $("div[class='infoPanel alert']").hide();
            $("div[class='infoPanel alert']").empty();

            var parentBlock = $(item).parents(".requiredField");
            if (!parentBlock.length)
                return;

            parentBlock = $(parentBlock);

            parentBlock.addClass("requiredFieldError");
            parentBlock.find("input,textarea").toggleClass("error", true);

            if (typeof (withouthScroll) == "undefined" || withouthScroll == false) {
                $.scrollTo(parentBlock.position().top - 50, { speed: 500 });
            }
            if (typeof (withoutFocus) == "undefined" || withoutFocus == false) {
                $(item).focus();
            }

            if (doNotHideOnChange)
                return;

            var onChange = function() {
                var item = $(this);
                hideError(item);

                item.off("change", onChange)
                .off("keyup", onChange)
                .off("paste", onChange);
            }

            $(item).on("change", onChange)
                .on("keyup", onChange)
                .on("paste", onChange);
        };

        var hideError = function (item) {
            var parentBlock = $(item).parents(".requiredField");

            if (!parentBlock.length)
                return;

            parentBlock = $(parentBlock);

            parentBlock.removeClass("requiredFieldError");
            parentBlock.find("input, textarea").toggleClass("error", false);
        };

        var hideErrors = function () {
            var requredField = $(".requiredField");
            if (!requredField.length)
                return;

            requredField.removeClass("requiredFieldError");
            requredField.find("input, textarea").toggleClass("error", false);
        };

        return {
            showError: showError,
            hideError: hideError,
            hideErrors: hideErrors
        };
    }();

    var selectorListener = function () {
        var $view = $('.layoutWrapper, .popup');

        var init = function () {
            $view.on('click', '.selectBox',showSelectOptions);
            $view.on('click', '.selectBox .option', selectOption);

            $("body").on("click", function (event) {
                var $selectors = $view.find('.selectBox');
                var target = (event.target) ? event.target : event.srcElement,
                    element = $(target);
                
                if (!element.is('.selectBox') && !element.is('.selectBoxValue') && !element.is('.selectBoxSwitch')) {
                    $selectors.find('.selectOptionsBox').hide();
                } else {
                    var curBox = element.is('.selectBox') ? element : element.parents('.selectBox:first');
                    $selectors.not(curBox).find('.selectOptionsBox').hide();
                }
            });
        };

        var initSingle = function(selectBox) {
            $selectors = $view.find('.selectBox');
            selectBox.on('click', showSelectOptions);
            selectBox.on('click', '.option', selectOption);
        }

        function showSelectOptions() {
            var $selector = $(this);

            if ($selector.attr("disabled") || $selector.hasClass("disabled"))
                return;

            var $options = $selector.find('.selectOptionsBox');

            if ($options.is(':visible')) {
                $options.hide();
                $options.css('top', 0);
                $options.css('left', 0);
            } else {
                var offset = $selector.position();

                if ($options.is('.top')) {
                    $options.css('top', offset.top - $options.outerHeight() - 3 + 'px');
                    $options.css('left', offset.left + $selector.outerWidth() - $options.outerWidth() + 'px');
                } else {
                    $options.css('top', offset.top + $selector.outerHeight() + 3 + 'px');
                    $options.css('left', offset.left + $selector.outerWidth() - $options.outerWidth() + 'px');
                }

                $options.show();
            }
        }

        function selectOption() {
            var $option = $(this),
                $select = $option.closest('.selectBox'),
                value =  $option.attr('data-value');

            $select.find('.selectBoxValue').text($option.text());
            $select.attr('data-value', value);

            $option.closest('.selectOptionsBox').hide();
            $option.siblings('.option').removeClass('selected');
            $option.addClass('selected');

            $select.trigger("valueChanged", value);
        }

        function set(selectBox, value) {
            if (!selectBox.is(".selectBox")) {
                return;
            }

            selectBox.find(".option[data-value=\"" + value + "\"]").click();
        }

        function get(selectBox) {
            if (!selectBox.is(".selectBox")) {
                return undefined;
            }

            return selectBox.attr('data-value');
        }

        return {
            init: init,
            initSingle: initSingle,
            set: set,
            get: get
        };
    }();

    var spoiler = function () {
        var toggle = function (toggleEl, spoilerEl, force, hideLinkText, showLinkText) {
            var el = $(toggleEl);
            var $this = $(spoilerEl);
            if (!el)
                return;

            var enabled = typeof force === "boolean" ? force : el.hasClass('display-none');
            var linkText = "";

            if (enabled) {
                el.toggleClass('display-none', false);
                if ($this) {
                    linkText = hideLinkText || window.Resource.HideLink;
                    $this.text(linkText).prop('title', linkText);
                }
            } else {
                el.toggleClass('display-none', true);
                if ($this) {
                    linkText = showLinkText || window.Resource.ShowLink;
                    $this.text(linkText).prop('title', linkText);
                }
            }
        };

        return {
            toggle: toggle
        };
    }();

    return {
        basePath: basePath,
        offlineMode: offlineMode,
        windowsMode: windowsMode,

        loader: loader,
        blockUI: blockUI,
        isValidEmail: isValidEmail,
        isValidPhone: isValidPhone,
        isValidUrl: isValidUrl,
        datetimeFormat: datetimeFormat,
        requiredField: requiredField,
        selectorListener: selectorListener,
        spoiler: spoiler
    };
})($);

window.ApiService = function ($) {
    var statusCodeHandler = function (response) {
        if (response.status === 401 || response.status === 301 || response.status === 504) {
            location.reload();
        }
    };

    function get(requestUrl, async) {
        var self = this;
        if (typeof(window.ApiService.unloaded) === "undefined") {
            window.ApiService.unloaded = false;

            $(window).bind('beforeunload', function () {
                window.ApiService.unloaded = true;
            });
        }

        if (typeof async == "undefined") {
            async = true;
        }

        return $.ajax({
                type: "GET",
                url: Common.basePath + requestUrl,
                async: async
            }).fail(function (xhr) {
                statusCodeHandler(xhr);
            });
    }

    function post(requestUrl, data, async) {
        if (typeof (window.ApiService.unloaded) === "undefined") {
            window.ApiService.unloaded = false;

            $(window).bind('beforeunload', function () {
                window.ApiService.unloaded = true;
            });
        }

        return $.ajax({
            type: "POST",
            url: Common.basePath + requestUrl,
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: typeof async === "boolean" ? async : true
        }).fail(statusCodeHandler);
    }

    function del(requestUrl, data) {
        if (typeof (window.ApiService.unloaded) === "undefined") {
            window.ApiService.unloaded = false;

            $(window).bind('beforeunload', function () {
                window.ApiService.unloaded = true;
            });
        }

        return $.ajax({
            type: "DELETE",
            url: Common.basePath + requestUrl,
            data: data
        }).fail(statusCodeHandler);
    }

    function put(requestUrl, data, async) {
        if (typeof (window.ApiService.unloaded) === "undefined") {
            window.ApiService.unloaded = false;

            $(window).bind('beforeunload', function () {
                window.ApiService.unloaded = true;
            });
        }

        return $.ajax({
            type: "PUT",
            url: Common.basePath + requestUrl,
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: typeof async === "boolean" ? async : true
        }).fail(statusCodeHandler);
    }

    return {
        get: get,
        post: post,
        put:put,
        "delete": del
    };
}($);

window.LoaderService = function() {
    function showFormBlockLoader($box, padding, top) {

        if ($box.next().hasClass("formBlock") || $box.next().hasClass("formBlockLoader")) return;

        padding = padding || 0;

        var $formBlock = $('<div class="formBlock hidden"></div>');
        var $formBlockLoader = $('<div class="formBlockLoader hidden">' + window.Resource.PleaseWaitMsg + '</div>');

        $box.after($formBlock);
        $box.after($formBlockLoader);

        $formBlock.width($box.outerWidth() + 2 * padding);
        $formBlock.height($box.outerHeight() + 2 * padding);

        $formBlock.offset({
            top: $box.offset().top - padding,
            left: $box.offset().left - padding
        });
        
        $formBlockLoader.offset({
            top: typeof(top) === "number" ? top : $box.offset().top + $box.outerHeight() / 2 - $formBlockLoader.outerHeight() / 2,
            left: $box.offset().left + $box.outerWidth() / 2 - $formBlockLoader.outerWidth() / 2
        });

        $formBlock.removeClass('hidden');
        $formBlockLoader.removeClass('hidden');
    }

    function hideFormBlockLoader($box) {
        $box.siblings('.formBlock').remove();
        $box.siblings('.formBlockLoader').remove();
    }
    
    return {
        showFormBlockLoader: showFormBlockLoader,
        hideFormBlockLoader: hideFormBlockLoader
    };
}();

var errorBlockTmpl = $("#errorBlockTmpl").tmpl({
    content: "",
    htmlcontent: Resource.LicenseFeatureError.format("<a href=\"" + ($(".toportal-btn").attr("href")) + "/Tariffs.aspx\" target=\"_blank\">", "</a>")
});
if (errorBlockTmpl.length) {
    errorBlockTmpl.appendTo("#licenseFeatureError");
}

/**
 * Encoder
 */
Encoder = { EncodeType: "entity", isEmpty: function (val) { if (val) { return (val.length == 0 || /^\s+$/.test(val)); } else { return true; } }, HTML2Numerical: function (s) { var arr1 = new Array('&nbsp;', '&iexcl;', '&cent;', '&pound;', '&curren;', '&yen;', '&brvbar;', '&sect;', '&uml;', '&copy;', '&ordf;', '&laquo;', '&not;', '&shy;', '&reg;', '&macr;', '&deg;', '&plusmn;', '&sup2;', '&sup3;', '&acute;', '&micro;', '&para;', '&middot;', '&cedil;', '&sup1;', '&ordm;', '&raquo;', '&frac14;', '&frac12;', '&frac34;', '&iquest;', '&agrave;', '&aacute;', '&acirc;', '&atilde;', '&Auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&Ouml;', '&times;', '&oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&Uuml;', '&yacute;', '&thorn;', '&szlig;', '&agrave;', '&aacute;', '&acirc;', '&atilde;', '&auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&ouml;', '&divide;', '&Oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;', '&thorn;', '&yuml;', '&quot;', '&amp;', '&lt;', '&gt;', '&oelig;', '&oelig;', '&scaron;', '&scaron;', '&yuml;', '&circ;', '&tilde;', '&ensp;', '&emsp;', '&thinsp;', '&zwnj;', '&zwj;', '&lrm;', '&rlm;', '&ndash;', '&mdash;', '&lsquo;', '&rsquo;', '&sbquo;', '&ldquo;', '&rdquo;', '&bdquo;', '&dagger;', '&dagger;', '&permil;', '&lsaquo;', '&rsaquo;', '&euro;', '&fnof;', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;', '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;', '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', '&sigmaf;', '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;', '&thetasym;', '&upsih;', '&piv;', '&bull;', '&hellip;', '&prime;', '&prime;', '&oline;', '&frasl;', '&weierp;', '&image;', '&real;', '&trade;', '&alefsym;', '&larr;', '&uarr;', '&rarr;', '&darr;', '&harr;', '&crarr;', '&larr;', '&uarr;', '&rarr;', '&darr;', '&harr;', '&forall;', '&part;', '&exist;', '&empty;', '&nabla;', '&isin;', '&notin;', '&ni;', '&prod;', '&sum;', '&minus;', '&lowast;', '&radic;', '&prop;', '&infin;', '&ang;', '&and;', '&or;', '&cap;', '&cup;', '&int;', '&there4;', '&sim;', '&cong;', '&asymp;', '&ne;', '&equiv;', '&le;', '&ge;', '&sub;', '&sup;', '&nsub;', '&sube;', '&supe;', '&oplus;', '&otimes;', '&perp;', '&sdot;', '&lceil;', '&rceil;', '&lfloor;', '&rfloor;', '&lang;', '&rang;', '&loz;', '&spades;', '&clubs;', '&hearts;', '&diams;'); var arr2 = new Array('&#160;', '&#161;', '&#162;', '&#163;', '&#164;', '&#165;', '&#166;', '&#167;', '&#168;', '&#169;', '&#170;', '&#171;', '&#172;', '&#173;', '&#174;', '&#175;', '&#176;', '&#177;', '&#178;', '&#179;', '&#180;', '&#181;', '&#182;', '&#183;', '&#184;', '&#185;', '&#186;', '&#187;', '&#188;', '&#189;', '&#190;', '&#191;', '&#192;', '&#193;', '&#194;', '&#195;', '&#196;', '&#197;', '&#198;', '&#199;', '&#200;', '&#201;', '&#202;', '&#203;', '&#204;', '&#205;', '&#206;', '&#207;', '&#208;', '&#209;', '&#210;', '&#211;', '&#212;', '&#213;', '&#214;', '&#215;', '&#216;', '&#217;', '&#218;', '&#219;', '&#220;', '&#221;', '&#222;', '&#223;', '&#224;', '&#225;', '&#226;', '&#227;', '&#228;', '&#229;', '&#230;', '&#231;', '&#232;', '&#233;', '&#234;', '&#235;', '&#236;', '&#237;', '&#238;', '&#239;', '&#240;', '&#241;', '&#242;', '&#243;', '&#244;', '&#245;', '&#246;', '&#247;', '&#248;', '&#249;', '&#250;', '&#251;', '&#252;', '&#253;', '&#254;', '&#255;', '&#34;', '&#38;', '&#60;', '&#62;', '&#338;', '&#339;', '&#352;', '&#353;', '&#376;', '&#710;', '&#732;', '&#8194;', '&#8195;', '&#8201;', '&#8204;', '&#8205;', '&#8206;', '&#8207;', '&#8211;', '&#8212;', '&#8216;', '&#8217;', '&#8218;', '&#8220;', '&#8221;', '&#8222;', '&#8224;', '&#8225;', '&#8240;', '&#8249;', '&#8250;', '&#8364;', '&#402;', '&#913;', '&#914;', '&#915;', '&#916;', '&#917;', '&#918;', '&#919;', '&#920;', '&#921;', '&#922;', '&#923;', '&#924;', '&#925;', '&#926;', '&#927;', '&#928;', '&#929;', '&#931;', '&#932;', '&#933;', '&#934;', '&#935;', '&#936;', '&#937;', '&#945;', '&#946;', '&#947;', '&#948;', '&#949;', '&#950;', '&#951;', '&#952;', '&#953;', '&#954;', '&#955;', '&#956;', '&#957;', '&#958;', '&#959;', '&#960;', '&#961;', '&#962;', '&#963;', '&#964;', '&#965;', '&#966;', '&#967;', '&#968;', '&#969;', '&#977;', '&#978;', '&#982;', '&#8226;', '&#8230;', '&#8242;', '&#8243;', '&#8254;', '&#8260;', '&#8472;', '&#8465;', '&#8476;', '&#8482;', '&#8501;', '&#8592;', '&#8593;', '&#8594;', '&#8595;', '&#8596;', '&#8629;', '&#8656;', '&#8657;', '&#8658;', '&#8659;', '&#8660;', '&#8704;', '&#8706;', '&#8707;', '&#8709;', '&#8711;', '&#8712;', '&#8713;', '&#8715;', '&#8719;', '&#8721;', '&#8722;', '&#8727;', '&#8730;', '&#8733;', '&#8734;', '&#8736;', '&#8743;', '&#8744;', '&#8745;', '&#8746;', '&#8747;', '&#8756;', '&#8764;', '&#8773;', '&#8776;', '&#8800;', '&#8801;', '&#8804;', '&#8805;', '&#8834;', '&#8835;', '&#8836;', '&#8838;', '&#8839;', '&#8853;', '&#8855;', '&#8869;', '&#8901;', '&#8968;', '&#8969;', '&#8970;', '&#8971;', '&#9001;', '&#9002;', '&#9674;', '&#9824;', '&#9827;', '&#9829;', '&#9830;'); return this.swapArrayVals(s, arr1, arr2); }, NumericalToHTML: function (s) { var arr1 = new Array('&#160;', '&#161;', '&#162;', '&#163;', '&#164;', '&#165;', '&#166;', '&#167;', '&#168;', '&#169;', '&#170;', '&#171;', '&#172;', '&#173;', '&#174;', '&#175;', '&#176;', '&#177;', '&#178;', '&#179;', '&#180;', '&#181;', '&#182;', '&#183;', '&#184;', '&#185;', '&#186;', '&#187;', '&#188;', '&#189;', '&#190;', '&#191;', '&#192;', '&#193;', '&#194;', '&#195;', '&#196;', '&#197;', '&#198;', '&#199;', '&#200;', '&#201;', '&#202;', '&#203;', '&#204;', '&#205;', '&#206;', '&#207;', '&#208;', '&#209;', '&#210;', '&#211;', '&#212;', '&#213;', '&#214;', '&#215;', '&#216;', '&#217;', '&#218;', '&#219;', '&#220;', '&#221;', '&#222;', '&#223;', '&#224;', '&#225;', '&#226;', '&#227;', '&#228;', '&#229;', '&#230;', '&#231;', '&#232;', '&#233;', '&#234;', '&#235;', '&#236;', '&#237;', '&#238;', '&#239;', '&#240;', '&#241;', '&#242;', '&#243;', '&#244;', '&#245;', '&#246;', '&#247;', '&#248;', '&#249;', '&#250;', '&#251;', '&#252;', '&#253;', '&#254;', '&#255;', '&#34;', '&#38;', '&#60;', '&#62;', '&#338;', '&#339;', '&#352;', '&#353;', '&#376;', '&#710;', '&#732;', '&#8194;', '&#8195;', '&#8201;', '&#8204;', '&#8205;', '&#8206;', '&#8207;', '&#8211;', '&#8212;', '&#8216;', '&#8217;', '&#8218;', '&#8220;', '&#8221;', '&#8222;', '&#8224;', '&#8225;', '&#8240;', '&#8249;', '&#8250;', '&#8364;', '&#402;', '&#913;', '&#914;', '&#915;', '&#916;', '&#917;', '&#918;', '&#919;', '&#920;', '&#921;', '&#922;', '&#923;', '&#924;', '&#925;', '&#926;', '&#927;', '&#928;', '&#929;', '&#931;', '&#932;', '&#933;', '&#934;', '&#935;', '&#936;', '&#937;', '&#945;', '&#946;', '&#947;', '&#948;', '&#949;', '&#950;', '&#951;', '&#952;', '&#953;', '&#954;', '&#955;', '&#956;', '&#957;', '&#958;', '&#959;', '&#960;', '&#961;', '&#962;', '&#963;', '&#964;', '&#965;', '&#966;', '&#967;', '&#968;', '&#969;', '&#977;', '&#978;', '&#982;', '&#8226;', '&#8230;', '&#8242;', '&#8243;', '&#8254;', '&#8260;', '&#8472;', '&#8465;', '&#8476;', '&#8482;', '&#8501;', '&#8592;', '&#8593;', '&#8594;', '&#8595;', '&#8596;', '&#8629;', '&#8656;', '&#8657;', '&#8658;', '&#8659;', '&#8660;', '&#8704;', '&#8706;', '&#8707;', '&#8709;', '&#8711;', '&#8712;', '&#8713;', '&#8715;', '&#8719;', '&#8721;', '&#8722;', '&#8727;', '&#8730;', '&#8733;', '&#8734;', '&#8736;', '&#8743;', '&#8744;', '&#8745;', '&#8746;', '&#8747;', '&#8756;', '&#8764;', '&#8773;', '&#8776;', '&#8800;', '&#8801;', '&#8804;', '&#8805;', '&#8834;', '&#8835;', '&#8836;', '&#8838;', '&#8839;', '&#8853;', '&#8855;', '&#8869;', '&#8901;', '&#8968;', '&#8969;', '&#8970;', '&#8971;', '&#9001;', '&#9002;', '&#9674;', '&#9824;', '&#9827;', '&#9829;', '&#9830;'); var arr2 = new Array('&nbsp;', '&iexcl;', '&cent;', '&pound;', '&curren;', '&yen;', '&brvbar;', '&sect;', '&uml;', '&copy;', '&ordf;', '&laquo;', '&not;', '&shy;', '&reg;', '&macr;', '&deg;', '&plusmn;', '&sup2;', '&sup3;', '&acute;', '&micro;', '&para;', '&middot;', '&cedil;', '&sup1;', '&ordm;', '&raquo;', '&frac14;', '&frac12;', '&frac34;', '&iquest;', '&agrave;', '&aacute;', '&acirc;', '&atilde;', '&Auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&Ouml;', '&times;', '&oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&Uuml;', '&yacute;', '&thorn;', '&szlig;', '&agrave;', '&aacute;', '&acirc;', '&atilde;', '&auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&ouml;', '&divide;', '&Oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;', '&thorn;', '&yuml;', '&quot;', '&amp;', '&lt;', '&gt;', '&oelig;', '&oelig;', '&scaron;', '&scaron;', '&yuml;', '&circ;', '&tilde;', '&ensp;', '&emsp;', '&thinsp;', '&zwnj;', '&zwj;', '&lrm;', '&rlm;', '&ndash;', '&mdash;', '&lsquo;', '&rsquo;', '&sbquo;', '&ldquo;', '&rdquo;', '&bdquo;', '&dagger;', '&dagger;', '&permil;', '&lsaquo;', '&rsaquo;', '&euro;', '&fnof;', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;', '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;', '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', '&sigmaf;', '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;', '&thetasym;', '&upsih;', '&piv;', '&bull;', '&hellip;', '&prime;', '&prime;', '&oline;', '&frasl;', '&weierp;', '&image;', '&real;', '&trade;', '&alefsym;', '&larr;', '&uarr;', '&rarr;', '&darr;', '&harr;', '&crarr;', '&larr;', '&uarr;', '&rarr;', '&darr;', '&harr;', '&forall;', '&part;', '&exist;', '&empty;', '&nabla;', '&isin;', '&notin;', '&ni;', '&prod;', '&sum;', '&minus;', '&lowast;', '&radic;', '&prop;', '&infin;', '&ang;', '&and;', '&or;', '&cap;', '&cup;', '&int;', '&there4;', '&sim;', '&cong;', '&asymp;', '&ne;', '&equiv;', '&le;', '&ge;', '&sub;', '&sup;', '&nsub;', '&sube;', '&supe;', '&oplus;', '&otimes;', '&perp;', '&sdot;', '&lceil;', '&rceil;', '&lfloor;', '&rfloor;', '&lang;', '&rang;', '&loz;', '&spades;', '&clubs;', '&hearts;', '&diams;'); return this.swapArrayVals(s, arr1, arr2); }, numEncode: function (s) { if (this.isEmpty(s)) return ""; var e = ""; for (var i = 0; i < s.length; i++) { var c = s.charAt(i); if (c < " " || c > "~") { c = "&#" + c.charCodeAt() + ";"; } e += c; } return e; }, htmlDecode: function (s) { var c, m, d = s; if (this.isEmpty(d)) return ""; d = this.HTML2Numerical(d); arr = d.match(/&#[0-9]{1,5};/g); if (arr != null) { for (var x = 0; x < arr.length; x++) { m = arr[x]; c = m.substring(2, m.length - 1); if (c >= -32768 && c <= 65535) { d = d.replace(m, String.fromCharCode(c)); } else { d = d.replace(m, ""); } } } return d; }, htmlEncode: function (s, dbl) { if (this.isEmpty(s)) return ""; dbl = dbl | false; if (dbl) { if (this.EncodeType == "numerical") { s = s.replace(/&/g, "&#38;"); } else { s = s.replace(/&/g, "&amp;"); } } s = this.XSSEncode(s, false); if (this.EncodeType == "numerical" || !dbl) { s = this.HTML2Numerical(s); } s = this.numEncode(s); if (!dbl) { s = s.replace(/&#/g, "##AMPHASH##"); if (this.EncodeType == "numerical") { s = s.replace(/&/g, "&#38;"); } else { s = s.replace(/&/g, "&amp;"); } s = s.replace(/##AMPHASH##/g, "&#"); } s = s.replace(/&#\d*([^\d;]|$)/g, "$1"); if (!dbl) { s = this.correctEncoding(s); } if (this.EncodeType == "entity") { s = this.NumericalToHTML(s); } return s; }, XSSEncode: function (s, en) { if (!this.isEmpty(s)) { en = en || true; if (en) { s = s.replace(/\'/g, "&#39;"); s = s.replace(/\"/g, "&quot;"); s = s.replace(/</g, "&lt;"); s = s.replace(/>/g, "&gt;"); } else { s = s.replace(/\'/g, "&#39;"); s = s.replace(/\"/g, "&#34;"); s = s.replace(/</g, "&#60;"); s = s.replace(/>/g, "&#62;"); } return s; } else { return ""; } }, hasEncoded: function (s) { if (/&#[0-9]{1,5};/g.test(s)) { return true; } else if (/&[A-Z]{2,6};/gi.test(s)) { return true; } else { return false; } }, stripUnicode: function (s) { return s.replace(/[^\x20-\x7E]/g, ""); }, correctEncoding: function (s) { return s.replace(/(&amp;)(amp;)+/, "$1"); }, swapArrayVals: function (s, arr1, arr2) { if (this.isEmpty(s)) return ""; var re; if (arr1 && arr2) { if (arr1.length == arr2.length) { for (var x = 0, i = arr1.length; x < i; x++) { re = new RegExp(arr1[x], 'g'); s = s.replace(re, arr2[x]); } } } return s; }, inArray: function (item, arr) { for (var i = 0, x = arr.length; i < x; i++) { if (arr[i] === item) { return i; } } return -1; } }
less = {}; less.env = 'development';