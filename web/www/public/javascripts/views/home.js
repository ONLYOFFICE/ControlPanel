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


$(".radioBox").on("click", function () {
    if ($(this).hasClass("disabled")) {
        return;
    }

    var dataName = $(this).attr("data-name");
    if (dataName) {
        $(".radioBox[data-name={0}]".format(dataName)).removeClass("checked");
    }
    $(this).addClass("checked");
});


$(".custom-checkbox, .checkBox").on("click", function () {
    if ($(this).hasClass("disabled")) {
        return;
    }

    $(this).toggleClass("checked");
});

window.HomeView = function ($, apiService) {

    var $view = $('.layoutWrapper');

    var $dateTimeSelectors = $view.find('.datetimeSelectorBox');

    var $sideNav = $view.find('.side-nav');
    var $topNav = $view.find('.top-panel-btns-container');

    function init() {

        bindEvents();

        $view.show();
    }

    $(window).on("rightSideReady", function () {
        $('.layoutFooter').removeClass('display-none');
        inputWithBtnCorrect();
    });

    function bindEvents() {

        $dateTimeSelectors.on('click', '.typeSelector .option', changeDateTimeSelectorType);


        $(".popup").on("click", ".cancelbtn, .popup-close", closePopup);

        Common.selectorListener.init();


        $(window).on("resize", function () {
            $(".popup_helper").hide();
        });

        if ($sideNav.length == 1) {
            var nav = location.pathname.replace(Common.basePath, '').toLowerCase().replace(/\//g, "");
            if (nav !== "") {
                $sideNav.find('.nav-link.nav-' + nav).addClass("selected");
                $topNav.find('.top-link.nav-' + nav).addClass("active");
            } else {
                $sideNav.find('.nav-link:first').addClass("selected");
            }
        }

        $(document).keyup(function (event) {
            var code;

            if (event.keyCode) {
                code = event.keyCode;
            } else if (event.which) {
                code = event.which;
            }

            if (code == 27) {
                if ($(".blockUI").is(":visible")) {
                    $(window).trigger("popupIsClosing", [$(".blockUI"), $(".blockUI").children(".popup:first").attr('id')]);
                    Common.blockUI.hide();
                }
            }
        });


        $("#aboutLink").click(function () {
            Common.blockUI.show("aboutDialog", 680, 500, 0);
        });
    }

    function inputWithBtnCorrect() {
        $("div.inputWithBtn:not(.withPlusBtn)").each(function (index, item) {
            var paddingRightBase = parseInt($(item).children("input").css("padding-right")),
                btnWidth = $(item).children(".button").outerWidth();

            $(item).children("input").css("padding-right", btnWidth + paddingRightBase);
        });
    }

    function changeDateTimeSelectorType() {
        var $el = $(this);
        var val = $el.attr('data-value');
        var $select = $el.closest('.selectBox');

        if (val == 0) {
            $select.siblings('.daysSelector').hide();
            $select.siblings('.daysweekSelector').hide();
            $select.siblings('.hoursSelector').show();
        } else if (val == 1) {
            $select.siblings('.daysSelector').hide();
            $select.siblings('.daysweekSelector').show();
            $select.siblings('.hoursSelector').show();
        } else {
            $select.siblings('.daysSelector').show();
            $select.siblings('.daysweekSelector').hide();
            $select.siblings('.hoursSelector').show();
        }
    }

    function closePopup() {
        $(window).trigger("popupIsClosing", [this, $(this).parents(".popup:first").attr('id')]);
        Common.blockUI.hide();
    }

    return {
        init: init
    };
}($, window.ApiService);
