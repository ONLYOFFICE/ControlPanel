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


;
var PhoneController = new function() {

    _renderControl = function($input) {
        $input.addClass("phoneControlInput");
        var innerHtml = [
            "<table cellpadding='0' cellspacing='0'>",
                "<colgroup>",
                    "<col style='width: 50px;' />",
                    "<col />",
                "</colgroup>",
                "<tbody>",
                    "<tr>",
                        "<td>",
                            "<span class='phoneControlSwitherWrapper'>",
                                "<div class='phoneControlSwither'>",
                                    "<div class='selectedPhoneCountry'></div>",
                                "</div>",
                            "</span>",
                        "</td>",
                        "<td>",
                            "<div class='phoneControlInputContainer'>",
                                $input[0].outerHTML,
                            "</div>",
                        "</td>",
                    "</tr>",
                "</tbody>",
            "</table>",
            "<div class='studio-action-panel' id='phoneControlDropDown'>",
                "<div class='corner-top left'></div>",
                "<ul class='dropdown-content'></ul>",
            "</div>"
            ].join('');

        var o = document.createElement('span');
        o.className = 'phoneControlContainer';
        o.innerHTML = innerHtml;
        $($input).replaceWith(o);
        PhoneController.phoneControlContainer = $(o);
    };

    _getCountryByKey = function(key) {
        for (var i = 0, n = PhoneController.countryList.length; i < n; i++) {
            if (PhoneController.countryList[i].key == key) {
                return PhoneController.countryList[i];
            }
        }
        return null;
    };

    _sortCountriesByCode = function(a, b) {
        var aInt = a.code * 1,
            bInt = b.code * 1;
        if (aInt > bInt) {
            return -1;
        }
        if (aInt < bInt) {
            return 1;
        }
        return typeof (a.def) != "undefined"
                ? -1
                : (typeof (b.def) != "undefined" ? 1 : 0);
    };

    _initCountryPhonesDropDown = function() {
        var html = "",
            tmp = null,
            country = null;

        for (var i = 0, n = PhoneController.countryList.length; i < n; i++) {
            country = PhoneController.countryList[i];
            if (PhoneController.defaultCountryCallingCode == country.key) {
                PhoneController.selectedCountryPhone = country;
                PhoneController.selectedCountryPhone["def"] = true;
            }
            html += ["<li class='li_",
                    country.key,
                    PhoneController.defaultCountryCallingCode == country.key ? " default-item selected'" : "'",
                    ">",
                "<table><tbody>",
                    "<tr>",
                        "<td>",
                            "<div class='fg-item fg_",
                                country.key,
                                "'>",
                            "</div>",
                        "</td>",
                        "<td>",
                            "<a class='dropdown-item' data-key='",
                            country.key,
                            "'>",
                            country.title,
                            " ",
                            country.code,
                            "</a>",
                        "</td>",
                    "</tr>",
                "</tbody></table>",
                "</li>"
                ].join('');
        }

        PhoneController.phoneControlContainer.find("#phoneControlDropDown ul.dropdown-content").html(html);

        PhoneController.countryListSortedByCode = $.extend([], PhoneController.countryList);
        PhoneController.countryListSortedByCode.sort(_sortCountriesByCode);

        PhoneController.phoneControlContainer.find(".phoneControlSwither .selectedPhoneCountry:first")
            .attr("class", "selectedPhoneCountry fg_" + PhoneController.selectedCountryPhone.key);

        PhoneController.phoneControlContainer.find("input.phoneControlInput:first").val(PhoneController.selectedCountryPhone.code + " ");
        PhoneController.phoneControlContainer.find("input.phoneControlInput:first").on("keyup", function(event) {
            var country = _findCountryByPhone($(this).val());
            if (country != PhoneController.selectedCountryPhone
                && !(country == null && PhoneController.selectedCountryPhone.code == PhoneController.defaultCountryCallingCode)) {
                _selectCountryPhoneComplete(null, country != null ? country.key : null);
            }
        });

        PhoneController.phoneControlContainer.find("input.phoneControlInput:first").unbind('paste').bind('paste', function(e) {
            var $obj = this;
            setTimeout(
                function() {
                    var country = _findCountryByPhone($($obj).val());
                    if (country != PhoneController.selectedCountryPhone
                        && !(country == null && PhoneController.selectedCountryPhone.code == PhoneController.defaultCountryCallingCode)) {
                        _selectCountryPhoneComplete(null, country != null ? country.key : null);
                    }
                }, 0);
            return true;
        });
        PhoneController.phoneControlContainer.find("#phoneControlDropDown ul.dropdown-content").on("click", "a.dropdown-item", function() {
            _selectCountryPhoneComplete($(this), $(this).attr("data-key"));
            $("#phoneControlDropDown").hide();
        });
        $.dropdownToggle({
            dropdownID: "phoneControlDropDown",
            switcherSelector: ".phoneControlContainer .phoneControlSwither",
            simpleToggle: true
        });
    };

    _selectCountryPhoneComplete = function($opt, key) {
        var phone_text = $.trim(PhoneController.phoneControlContainer.find("input.phoneControlInput:first").val());

        delete PhoneController.selectedCountryPhone["def"];
        PhoneController.countryListSortedByCode.sort(_sortCountriesByCode);

        if ($opt == null || $opt == {}) {
            if (typeof (key) != "string" || key == "") {
                key = PhoneController.defaultCountryCallingCode;
                PhoneController.selectedCountryPhone = _getCountryByKey(key);
            } else {
                PhoneController.selectedCountryPhone = _getCountryByKey(key);
                phone_text = $.trim(phone_text.replace(PhoneController.GetCountryPhoneReg(PhoneController.selectedCountryPhone.code), ""));
                phone_text = [PhoneController.selectedCountryPhone.code, phone_text].join(" ");
                PhoneController.phoneControlContainer.find("input.phoneControlInput:first").val(phone_text);
            }
        } else {
            phone_text = $.trim(phone_text.replace(PhoneController.GetCountryPhoneReg(null), ""));
            PhoneController.selectedCountryPhone = _getCountryByKey(key);

            phone_text = [PhoneController.selectedCountryPhone.code, phone_text].join(" ");
            PhoneController.phoneControlContainer.find("input.phoneControlInput:first").val(phone_text);
        }
        PhoneController.selectedCountryPhone["def"] = true;
        PhoneController.countryListSortedByCode.sort(_sortCountriesByCode);
        $("#phoneControlDropDown ul.dropdown-content li.selected").removeClass("selected");
        $("#phoneControlDropDown ul.dropdown-content li.li_" + key).addClass("selected");
        PhoneController.phoneControlContainer.find(".phoneControlSwither .selectedPhoneCountry").attr("class", "selectedPhoneCountry fg_" + key);
    };

    _findCountryByPhone = function(phone) {
        if (phone == null || typeof (phone) != "string") {
            return null;
        }
        phone = $.trim(phone);
        if (phone == "" || phone.length < 2 || phone[0] != '+') {
            return null;
        }
        for (var i = 0, n = PhoneController.countryListSortedByCode.length; i < n; i++) {
            country = PhoneController.countryListSortedByCode[i];
            if (PhoneController.GetCountryPhoneReg(country.code).test(phone)) {
                return country;
            }
        }
        return null;
    };

    return {

        isInit: false,
        phoneControlContainer: null,
        selectedCountryPhone: null,
        defaultCountryCallingCode: "",
        countryList: [],
        countryListSortedByCode: [],

        Init: function($input, countryList, testDefaultCountryCallingCodeList) {
            if (this.isInit === false) {
                this.countryList = countryList;

                this.defaultCountryCallingCode = "";
                var tmp = null;

                if (typeof (testDefaultCountryCallingCodeList) !== "undefined" && testDefaultCountryCallingCodeList.length > 0) {
                    for (var i = 0, n = testDefaultCountryCallingCodeList.length; i < n; i++) {
                        tmp = _getCountryByKey(testDefaultCountryCallingCodeList[i]);
                        if (tmp != null) {
                            this.defaultCountryCallingCode = tmp.key;
                            break;
                        }
                    }
                }

                if (this.defaultCountryCallingCode == "") {
                    return;
                }
                _renderControl($input);
                _initCountryPhonesDropDown();

                this.isInit = true;
            }
        },

        GetCountryPhoneReg: function(code) {
            if (typeof (code) == "undefined" || code == null || code == "") {
                code = PhoneController.selectedCountryPhone.code;
            }
            return new RegExp("^\s*" + code.replace("+", "\\+"));
        },

        ClearDataAndErrors: function() {
            PhoneController.selectedCountryPhone = _getCountryByKey(PhoneController.defaultCountryCallingCode);
            PhoneController.phoneControlContainer.find("input.phoneControlInput:first").val(PhoneController.selectedCountryPhone.code + " ");
            _selectCountryPhoneComplete(null, PhoneController.selectedCountryPhone.key);
            PhoneController.ClearErrors();
        },

        ClearErrors: function() {
            PhoneController.DeleteErrorClass(PhoneController.phoneControlContainer);
        },

        ShowErrors: function() {
            PhoneController.phoneControlContainer.addClass('error');
        },

        DeleteErrorClass: function($o) {
            $o.attr("class", $o.attr("class").replace(/\s*error/gi, ''));
        },

        GetPhone: function() {
            var phone = $.trim(PhoneController.phoneControlContainer.find("input.phoneControlInput:first").val());
            if (!PhoneController.GetCountryPhoneReg(null).test(phone)) {
                phone = [PhoneController.selectedCountryPhone.code, phone].join(' ');
            }
            return phone;
        }
    };
};