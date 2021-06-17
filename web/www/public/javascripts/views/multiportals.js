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


window.MultiPortalsManager = function ($, apiService, loaderService) {
    var _loadedSuccessfull = true;
    var _domainReg = /.*/;
    var _currentDomain = null;
    var _currentTenant = null;
    var _portalList = [];

    function getMsgByErrKey(key) {
        switch (key) {
            case "portalNameExist": return window.MultiPortalsResource.ErrorPortalNameExist;
            case "tooShortError": return window.MultiPortalsResource.ErrorPortalNameTooShort;
            case "portalNameIncorrect": return window.MultiPortalsResource.ErrorPortalNameIncorrect;

            case "portalsCountTooMuch": return window.MultiPortalsResource.ErrorPortalsCountLimit;
            case "portalNameEmpty": return window.MultiPortalsResource.ErrorPortalNameEmpty;
            case "portalNameTooLong": return window.MultiPortalsResource.ErrorPortalNameTooLong;

            case "domainNameDNS": return window.Resource.ErrorDomainNameDNS;

            default: return window.Resource.OperationFailedError;
        }
    };

    function validatePortalNameInput(portalName, $input) {
        var errMsg = "";
        if (portalName == "") {
            errMsg = window.MultiPortalsResource.ErrorPortalNameEmpty;
        } else if (portalName.length > 100) {
            errMsg = window.MultiPortalsResource.ErrorPortalNameTooLong;
        } else if (portalName.length < 6) {
            errMsg = window.MultiPortalsResource.ErrorPortalNameTooShort;
        }
        if (errMsg != '') {
            $input.addClass("error");
            toastr.error(errMsg);
            return false;
        }

        $input.removeClass("error");
        return true;
    };

    function validateDomainNameInput(domainName, $input) {
        var errMsg = "";
        if (domainName == "") {
            errMsg = window.Resource.ErrorDomainNameEmpty;
        } else if (domainName.length > 255) {
            errMsg = window.Resource.ErrorDomainNameTooLong;
        } else if (domainName.match(_domainReg) == null) {
            errMsg = window.Resource.ErrorDomainNameIncorrect;
        }

        if (errMsg != '') {
            $input.addClass("error");
            toastr.error(errMsg);
            return false;
        }

        $input.removeClass("error");
        return true;
    };

    function saveMainSettings() {

        var $domainNameInput = $("#multiPortalsViewMainSettings .domainname-input:first"),
            $portalNameInput = $("#multiPortalsViewMainSettings .portalname-input:first"),
            domainName = $.trim($domainNameInput.val()),
            portalName = $.trim($portalNameInput.val());

        if (!validatePortalNameInput(portalName, $portalNameInput) ||
            !validateDomainNameInput(domainName, $domainNameInput)) {
            return;
        }

        _currentDomain = domainName;

        loaderService.showFormBlockLoader($('#multiPortalsViewMainSettings'));
        apiService.post('MultiPortals/SetBaseDomainAndTenantName',
            {
                domain: _currentDomain,
                alias: portalName
            })
           .done(function (response) {
               loaderService.hideFormBlockLoader($('#multiPortalsViewMainSettings'));
               if (response.success) {
                   var reference = response.reference;
                   toastr.success(response.message);
                   window.location = reference;
               } else {
                   var errText = getMsgByErrKey(response.message);
                   toastr.error(errText);
               }
           })
           .fail(function (jqXHR, textStatus, errorThrown) {
               if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
               loaderService.hideFormBlockLoader($('#multiPortalsViewMainSettings'));
               toastr.error(errorThrown);
           });
    };

    function showNewPortalPopup() {
        $("#newPortalPanel .portalname-input:first").val('');
        $("#visitPoralCheckbox").addClass("checked");
        $("#limitedControlPanelCheckbox").addClass("checked");
        Common.blockUI.show("newPortalPanel", 500, 500);
    };

    function showChangeBaseDomainPopup() {
        $("#changeBaseDomainPanel .domainname-input:first").val(_currentDomain).removeClass("error");
        Common.blockUI.show("changeBaseDomainPanel", 500, 500);
    };

    function createNewPortal() {
        var $portalNameInput = $("#newPortalPanel .portalname-input:first"),
            alias = $.trim($portalNameInput.val()),
            limitedControlPanel = $("#limitedControlPanelCheckbox").hasClass("checked");

        if (!validatePortalNameInput(alias, $portalNameInput)) { return; }

        loaderService.showFormBlockLoader($('#newPortalPanel'));

        if ($("#visitPoralCheckbox").hasClass("checked")) {
            var winPortal = window.open();
        }

        apiService.post('MultiPortals/CreateNewTenant', { alias: alias, limitedControlPanel: limitedControlPanel })
           .done(function (response) {
               loaderService.hideFormBlockLoader($('#newPortalPanel'));
               if (response.success) {
                   try {
                       var resp = response.data;

                        if (winPortal) {
                            winPortal.location.href = resp.reference;
                        }

                        var newPortal = resp.tenant.domain;
                        _portalList.push(newPortal);

                        $("#linkedPortalTmpl").tmpl(
                            {
                                domainName: newPortal,
                                href: resp.reference,
                                isCurrent: false,
                                tenantId: resp.tenant.tenantId
                            }).appendTo('#linkedPortalsList tbody');

                       $("#portalCount").attr("data-createdPortals", parseInt($("#portalCount").attr("data-createdPortals")) + 1);
                       updateCounts();

                        Common.blockUI.hide();
                   }
                   catch (e) { }
               } else {
                    if (winPortal) {
                        winPortal.close();
                    }

                    var errTest = getMsgByErrKey(response.message);
                    toastr.error(errTest);
               }
           })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (winPortal) {
                    winPortal.close();
                }

                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                loaderService.hideFormBlockLoader($('#newPortalPanel'));
                toastr.error(errorThrown);
            });
    };

    function changeBaseDomain() {
        var $domainNameInput = $("#changeBaseDomainPanel .domainname-input:first"),
            domainName = $.trim($domainNameInput.val());

        if (!validateDomainNameInput(domainName, $domainNameInput)) { return; }

        loaderService.showFormBlockLoader($('#changeBaseDomainPanel'));
        apiService.post('MultiPortals/ChangeBaseDomain',
            {
                domain: domainName
            })
           .done(function (response) {
               loaderService.hideFormBlockLoader($('#changeBaseDomainPanel'));
               if (response.success) {
                   var savedDomainName = response.baseDomain,//saved domain
                       newHref = window.location.href.replace(_currentDomain, savedDomainName);

                   toastr.success(window.Resource.OperationSucceededMsg);
                   window.location.replace(newHref);
               } else {
                   var errText = getMsgByErrKey(response.message);
                   toastr.error(errText);
               }
           })
           .fail(function (jqXHR, textStatus, errorThrown) {
               if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
               loaderService.hideFormBlockLoader($('#multiPortalsViewMainSettings'));
               toastr.error(errorThrown);
           });
    };

    function getBaseDomainAndTenantDomain() {
        apiService.get('MultiPortals/GetBaseDomainAndTenantDomain')
           .done(function (response) {
               if (response.success) {
                   if (response.isdomaindefault === true || response.data === "") {
                        $("#multiPortalsViewMainSettings")
                        .on("click", ".connectbtn", function () {
                            saveMainSettings();
                        })
                        .removeClass("display-none");
                   } else {
                       $("#multiPortalsViewMainSettings").remove();
                       _currentDomain = response.baseDomain; 
                       var tenant = _portalList.find(function (item) {
                           return item.tenantId === response.tenantId;
                       });
                       _currentTenant = tenant ? tenant.domain : "";

                       $("#currentDomain").text(_currentDomain);
                       $("#currentPortalName").text(_currentTenant);

                       $("#newPortalPanel .portaldomain-text").text("." + _currentDomain);

                       if ($("#linkedPortalsList tbody tr .status.green").length == 0) {
                           $("#linkedPortalsList tbody tr[data-id='" + response.tenantId + "'] .status").addClass("green");
                       }

                       $("#multiPortalsView").removeClass("display-none");
                   }
               } else {
                   _loadedSuccessfull = false;
                   toastr.error(response.message);
               }
           })
           .fail(function (jqXHR, textStatus, errorThrown) {
               if (apiService.unloaded || textStatus != null && textStatus === "abort") { _loadedSuccessfull = null; return; }

               _loadedSuccessfull = false;
           });


    };

    function getLinkedPortals () {
        apiService.get('MultiPortals/GetLinkedPortals')
            .done(function (response) {
                if (response.success) {
                    var resp = response.data;
                    _portalList = resp.tenants;

                    var protocol = location.href.split("://")[0];
                    for (var i = 0, n = _portalList.length; i < n; i++) {
                        var curDomainName = _portalList[i].domain;

                        $("#linkedPortalTmpl").tmpl({
                            domainName: curDomainName,
                            tenantId: _portalList[i].tenantId,
                            href: "{0}://{1}".format(protocol, curDomainName),
                            isCurrent: (_currentTenant != null && curDomainName == _currentTenant)
                        }).appendTo("#linkedPortalsList tbody");
                    }

                    $("#portalCount").attr("data-createdPortals", _portalList.length);
                    getPortalsQuota();
                    getBaseDomainAndTenantDomain();
                } else {
                    _loadedSuccessfull = false;
                    toastr.error(response.message);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(arguments);
                if (apiService.unloaded || textStatus != null && textStatus === "abort") {
                    _loadedSuccessfull = null;
                    return;
                }

                _loadedSuccessfull = false;
            });
    }

    function updateCounts () {
        var createdPortals = $("#portalCount").attr("data-createdPortals");

        var countPortals = $("#portalCount").attr("data-countPortal");

        var unlim = countPortals == $("#portalCount").attr("data-max");

        $("#portalCount").text(
            unlim
                ? createdPortals
                : window.MultiPortalsResource.PortalCounts.format(createdPortals, countPortals));

        if (countPortals == createdPortals) {
            $("#newPortalBtn").addClass("disabled");
        }
    }

    function getPortalsQuota () {
        apiService.get("MultiPortals/GetPortalsQuota")
            .done(function (response) {
                if (response.success) {
                    $("#portalCount").attr("data-countPortal", response.countPortals);
                    updateCounts();
                    var dueDate = response.dueDate;
                    if (!dueDate) {
                        $(".duedate-block").remove();
                    } else {
                        $("#dueDate").text(response.dueDate);
                    }
                } else {
                    _loadedSuccessfull = false;
                    toastr.error(response.message);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(arguments);
                if (apiService.unloaded || textStatus != null && textStatus === "abort") {
                    _loadedSuccessfull = null;
                    return;
                }

                _loadedSuccessfull = false;
            });
    }

    function init(reg) {
        _domainReg = reg;

        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);

        $(document).one("ajaxStop", function () {
            loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
            if (_loadedSuccessfull != null) {
                if (_loadedSuccessfull) {
                    //$("#multiPortalsView").removeClass("display-none");
                } else {
                    $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
                }
                $(window).trigger("rightSideReady", null);
            }
        });

        getLinkedPortals();

        $("#multiPortalsView").on("click", "#newPortalBtn:not(.disabled)", function () {
            showNewPortalPopup();
        });

        $("#newPortalPanel .new-portal-ok").on("click", function () {
            createNewPortal();
        });

        $("#changeBaseDomainBtn").on("click", function () {
            showChangeBaseDomainPopup();
        });

        $("#changeBaseDomainPanel .change-domain-ok").on("click", function () {
            changeBaseDomain();
        });
    };

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);