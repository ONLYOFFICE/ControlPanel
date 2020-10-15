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


window.versionManager = (function () {
    var updatesAvailbale = false,
        buttons = ['#updateCommunityServer', '#updateDocumentServer', '#updateMailServer', '#updateControlPanel'],
        mailDomainReg = null,
        updateTimeOutSeconds = 5,
        updateTimeOut,
        resources,
        apiService,
        loaderService,
        blockUI,
        $,
        isUpdatesAvailableCallbackEventName = "isUpdatesAvailableCallback",
        clickEventName = "click",
        $updatesTmpl,
        $formContentUpdate,
        $window,
        $updatesOrInstallationsList;

    var init = function (mailDomainRegExp) {
        resources = window.Resource;
        apiService = window.ApiService;
        loaderService = window.LoaderService;
        blockUI = Common.blockUI;
        $ = jQuery;

        $formContentUpdate = $("#formContentUpdate");
        $updatesTmpl = $("#updatesTmpl");
        $window = $(window);
        $updatesOrInstallationsList = $("#updatesOrInstallationsList");

        mailDomainReg = mailDomainRegExp;
        
        bindIsUpdatesAvailableTriggerCallback();

        renderPageData(true);

        $formContentUpdate.on(clickEventName, buttons.join(","), function () {
            update(this);
        });
    }

    function bindIsUpdatesAvailableTriggerCallback() {
        $window.on(isUpdatesAvailableCallbackEventName, function () {
            if (updatesAvailbale === true) {
                $(".side-nav .nav-link.nav-update").addClass("with-green-mark");
            }
        });
    }

    function triggerIsUpdatesAvailableTriggerCallback() {
        $window.trigger(isUpdatesAvailableCallbackEventName, null);
    }

    function renderPageData(firstTime) {
        if (firstTime) {
            loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);

            if (Common.offlineMode && !Common.windowsMode) {
                $("#errorBlockTmpl").tmpl({ content: "", htmlcontent: window.Resource.OfflineModeUpdateMsg }).insertBefore($updatesOrInstallationsList);
            }
        }

        apiService.get('update/GetUpdates')
            .done(function(data) {
                updatesAvailbale = data.updateAvailable;
                triggerIsUpdatesAvailableTriggerCallback();

                var $html = $updatesTmpl.tmpl({ items: data.updateList });
                if (!$html.length) {
                    //location.reload();
                    return;
                }

                var unknownVersionList = $.grep(data.updateList, function (item) {
                    return item.currentVersion === "";
                });

                if (unknownVersionList.length && !$("#unknownVersionMsg").length) {
                    $("#errorBlockTmpl").tmpl({ content: window.Resource.UnknownVersionErrorMessage })
                        .attr("id", "unknownVersionMsg")
                        .insertBefore($updatesOrInstallationsList);
                }

                $html.appendTo($updatesOrInstallationsList.empty());

                $formContentUpdate.removeClass("display-none");

                if (data.updateQueueItems && data.updateQueueItems.length) {
                    if (redirectToProcessHtml(data.updateQueueItems)) {
                        setTimeout(function () { location.href = "/"; }, 5000);
                        return;
                    }

                    loaderService.hideFormBlockLoader($('.container-base'));

                    data.updateQueueItems.forEach(function (item) {
                        var container = $("[data-update-server=" + item.serverType + "]").parents(".container-base:first");
                        loaderService.showFormBlockLoader(container);
                    });
                }

                var isDocker = $.grep(data.updateList, function (item) {
                    return item.image && item.container;
                }).length > 0;

                if (isDocker) {
                    /* periodic page content refresh */
                    updateTimeOut = setTimeout(renderPageData, updateTimeOutSeconds * 1000);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                if (!firstTime) {
                    $formContentUpdate.addClass("display-none");
                }
                $("#errorBlockTmpl").tmpl({ content: errorThrown }).appendTo('.layoutRightSide:first');
                //setTimeout(function() { location.reload }, 1000);
            })
            .always(function () {
                if (firstTime) {
                    loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
                }
            })
            .complete(function (qXHR, textStatus) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                if (firstTime) {
                    $window.trigger("rightSideReady", null);
                }
            });
    }

    function redirectToProcessHtml(requestList) {
        if (requestList.length === 1 && requestList[0].updateAction.type === 4) return true;

        return requestList.some(function (item) { return item.serverType === 3 && item.updateAction.type === 1;});
    }

    function isUpdatesAvailable() {
        if (!$formContentUpdate || $formContentUpdate.length > 0) return;

        bindIsUpdatesAvailableTriggerCallback();

        apiService.get('update/UpdateAvailable')
            .done(function (res) {
                updatesAvailbale = res;
                triggerIsUpdatesAvailableTriggerCallback();
            })
            .fail(function () {
                console.log(arguments);
            });
    }

    function update(btn) {
        var self = $(btn),

            request = {
                serverType : self.attr("data-update-server"),
                action     : self.attr("data-update-action")
            };

        if (self.hasClass("disabled")) return;

        if (isReqForInstallOrUpdate(request)) { //Confirmation popup should be shown
            installMailServer(request, btn);
        } else {
            updateComplete(request, btn);
        }
    }

    function checkDomainName(request, btn){
        var container = $("#domainNameDialog");
        var domainName = $.trim(container.find(".domainname-input").val());

        if (!domainName) {
            toastr.error(resources.ErrorDomainNameEmpty);
            return;
        }
        if (domainName.length > 255) {
            toastr.error(resources.ErrorDomainNameTooLong);
            return;
        }
        if (domainName.match(mailDomainReg) == null) {
            toastr.error(resources.ErrorDomainNameIncorrect);
            return;
        }

        loaderService.showFormBlockLoader(container);

        apiService.post('MultiPortals/checkDomainName',
            {
                domain: domainName
            })
            .done(function (response) {
                if (response.success) {
                    blockUI.hide();
                    request.domainName = response.domain;
                    updateComplete(request, btn);
                } else {
                   toastr.error(response.message);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                toastr.error(resources.OperationFailedError);
            })
            .always(function () {
                loaderService.hideFormBlockLoader(container);
            });
    }

    function installMailServer(request, btn) {
        if (isReqMailServer(request) && isReqForInstall(request)) { // Install mail server
            $("#domainNameDialog .domain-name-ok")
                .off(clickEventName)
                .on(clickEventName, function () {
                    checkDomainName(request, btn);
                });

            blockUI.show("domainNameDialog", 500, 500, 0, 0, 1000);

        } else {
            $("#confirmationInstallOrUpdateDialog .confirmation-ok")
                .off(clickEventName)
                .on(clickEventName, function () {
                    blockUI.hide();
                    updateComplete(request, btn);
                });

            blockUI.show("confirmationInstallOrUpdateDialog", 500, 350, 0, 0, 1000);
        }
    }

    function isReqForInstall(request) {
        return request.action == "3";
    }

    function isReqForUpdate(request) {
        return request.action == "1";
    }

    function isReqForInstallOrUpdate(request) {
        return isReqForInstall(request) || isReqForUpdate(request);
    }

    function isReqMailServer(request) {
        return request.serverType == "2";
    }

    function updateComplete(request, btn) {
        clearTimeout(updateTimeOut);
        var container = $(btn).parents(".container-base:first");
        loaderService.showFormBlockLoader(container);

        apiService.post('update/Start', request)
            .done(function (data) {
                if (data.success !== true) {
                    loaderService.hideFormBlockLoader(container);
                    toastr.error(data.message);
                }
                if (isReqForUpdate(request) && (request.serverType == "3" || request.serverType == "0")) {
                    setTimeout(function () { location.href = "/"; }, 5000);
                    return;
                }
                renderPageData();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                loaderService.hideFormBlockLoader(container);
                toastr.error(resources.OperationFailedError);
            });
    }
    return {
        init: init,
        isUpdatesAvailable: isUpdatesAvailable
    };
})();
