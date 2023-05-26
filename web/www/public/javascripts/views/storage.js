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


window.StorageView = function ($, apiService, loaderService) {
    var $view = $('.storageView');
    var changeEvent = "change",
        checked = "checked",
        clickEvent = "click",
        disabledClass = "disabled",
        displayNoneClass = "display-none",
        withErrorClass = "withError",
        sizeNames = {
            bytes: "bytes",
            kb: "KB",
            mb: "MB",
            gb: "GB",
            tb: "TB",
        };
    var $storageSettingsBox = $view.find("#storageSettingsBox");
    var $CDNSettingsBox = $view.find("#CDNSettingsBox");
    var $radioButtons;
    var diskDefault = {
        id: "localStorage",
        isSet: true,
        properties: [],
        title: window.Resource.LocalStorage
    };
    var $helpCenterSwitchers;
    var $connectBtn = $view.find(".connectBtn");
    var $storageButton = $view.find("#storageButton");
    var $cdnButton = $view.find("#CDNButton");
    var $encryptionButton = $view.find("#encryptionButton");
    var $encryptionConfirmButton = $view.find("#encryptionConfirmButton");
    var $storageForm = $view.find("#storageForm");
    var $CdnForm = $view.find("#CDNForm");
    var $encryptionBox = $view.find("#encryptionBox");
    var $encryptionSettingsNotify = $view.find("#encryptionSettingsNotify");
    var storagesMass = {};
    var id;
    var currentStorageProps;
    var currentCdnProps;
    var encryptionAvailable = true;

    function init(portal) {
        currentPortal = portal;

        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);


        function makeRequest(path, skip404error) {
            return function (cb) {
                apiService.get(path, false)
                    .done(function (res) {
                        cb(null, res);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        cb(jqXHR.status == 404 && skip404error ? null : textStatus, null);
                    });
            }
        }

        async.parallel([
            makeRequest('storage/getAllStorages'),
            makeRequest('storage/getAllCdnStorages'),
            makeRequest('storage/encryptionSettings', true),
            makeRequest('storage/getAmazonS3Regions', true)],
            function (textStatus, res) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                if (textStatus != null) {
                    $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
                    $(window).trigger("rightSideReady", null);
                } else {

                    $view.removeClass(displayNoneClass);
                    $(window).trigger("rightSideReady", null);

                    window.ConsumerStorageSettings.initS3Regions(res[3] || []);

                    var thirdPartyJSON = res[0];
                    window.ConsumerStorageSettings.init($view, thirdPartyJSON);

                    var allStorages = initStorages(Object.assign({}, diskDefault), thirdPartyJSON);
                    encryptionAvailable = allStorages[0].current;
                    initAllStorages(allStorages);

                    allStorages = initStorages(Object.assign({}, diskDefault), res[1]);
                    encryptionAvailable = encryptionAvailable && allStorages[0].current;
                    initAllCdnStorages(allStorages);

                    $radioButtons = $view.find('.thirdSelectStorage .radioBox');
                    $helpCenterSwitchers = $view.find('.helpCenterSwitcher');
                    bindEvents();
                    initStorageType($storageSettingsBox);
                    initStorageType($CDNSettingsBox);
                    initEncryptionForm(res[2]);
                }

                loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
            });

        $("body").on("click", function (event) {
            var $rows = $view.find('td.edit-quota');

            var target = (event.target) ? event.target : event.srcElement,
                element = $(target);

            if (!element.is('.edit-quota-btn') && !element.is('.selectBoxValue') && !element.is('.selectBoxSwitch')) {
                $rows.find('.selectOptionsBox').hide();
            }
        });

        getLinkedPortals();
    }

    function initAllStorages(storages) {
        var selected = storages.find(function (item) { return item.current }) || storages[0];
        initStorage($storageSettingsBox, selected, storages);
        initProperties($storageForm, selected);
        id = $storageSettingsBox.closest('.selectTypeStorageBox').attr('id');
        storagesMass[id] = storages;
        var finded = findElement(storages);
        currentStorageProps = $storageSettingsBox.find("[data-id='" + finded.id + "'] .textBox");
    }

    function initAllCdnStorages(storages) {
        var selected = storages.find(function (item) { return item.current }) || storages[0];
        initStorage($CDNSettingsBox, selected, storages);
        initProperties($CdnForm, selected);
        id = $CDNSettingsBox.closest('.selectTypeStorageBox').attr('id');
        storagesMass[id] = storages;
        var finded = findElement(storages);
        currentCdnProps = $CDNSettingsBox.find("[data-id='" + finded.id + "'] .textBox");
    }

    function initProperties($box, selected) {
        var $storage = $box.find("[data-id='" + selected.id + "']");
        for (var i = 0; i < selected.properties.length; i++) {
            var prop = selected.properties[i];
            $storage.find("[data-id='" + prop.name + "'] .textBox").val(prop.value);
        }
    }

    function initStorage($box, selected, storages) {
        var tmplData = window.ConsumerStorageSettings.getTmplData({ storages: storages }, "storage");

        $box.html($("#consumerSettingsTmpl").tmpl(tmplData));
        $box.find(".radioBox[data-value='" + selected.id + "']").addClass(checked);

        window.ConsumerStorageSettings.bindEvents($box);

        if (selected.properties && selected.properties.length && selected.current) {
            window.ConsumerStorageSettings.setProps($box, selected);
        }
    }

    function bindEvents() {
        $radioButtons.on(clickEvent, selectStorage);
        $helpCenterSwitchers.on(clickEvent, window.ConsumerStorageSettings.showStorageHelpBox);
        $connectBtn.on(clickEvent, connectWithStorage);
        currentStorageProps.on(changeEvent, enableConnectBtn);
        currentCdnProps.on(changeEvent, enableConnectBtn);
        $encryptionButton.on(clickEvent, showEncryptionConfirmDialog);
        $encryptionConfirmButton.on(clickEvent, encryptionStart);
    }

    function buildMappingOptions(collection) {
        var htmlMappingOptions = "";

        for (var key in collection) {
            htmlMappingOptions += "<div class=\"option\" data-value=\"" + key + "\">" + collection[key] + "</div>";
        }

        return htmlMappingOptions;
    }

    function getLinkedPortals() {
        loaderService.showFormBlockLoader($('#quotaBox'), 0, $(".layoutBody:first").height() + 70);
        apiService.get('storage/getLinkedPortals')
            .done(function (response) {
                if (response.success) {
                    var data = response.data;
                    var portalList = data.tenants;
                    var protocol = location.href.split("://")[0];

                    for (var i = 0, n = portalList.length; i < n; i++) {
                        var curDomainName = portalList[i].domain;

                        var quota = filesSizeToString(portalList[i].quota);
                        var usedSize = filesSizeToString(portalList[i].usedSize);

                        var row = $("#linkedPortalTmpl").tmpl({
                            domainName: curDomainName,
                            tenantId: portalList[i].tenantId,
                            href: "{0}://{1}".format(protocol, curDomainName),
                            quota: portalList[i].quota > -1 ? '{0} {1}'.format(quota.resultSize, quota.sizeName) : window.Resource.NoQuota,
                            quotaBytes: portalList[i].quota,
                            usedSize: '{0} {1}'.format(usedSize.resultSize, usedSize.sizeName),
                            usedSizeBytes: portalList[i].usedSize
                        });
                        var $editQuotaTd = row.find("td.edit-quota.form");

                        row.find(".selectOptionsBox .option.edit-quota").on(clickEvent, openEditQuotaForm);
                        row.find(".selectOptionsBox .option.no-quota").on(clickEvent, setNoQuota);

                        var options = buildMappingOptions(sizeNames);

                        $("#sizeMappingFieldTmpl")
                            .tmpl({ sizeName: portalList[i].quota > -1 ? quota.sizeName : sizeNames.bytes, options: options }).appendTo($editQuotaTd);

                        var $inputForm = row.find("td.memory-quota.form input");

                        $inputForm.on('input', function () {
                            this.value = this.value.replace(/[^0-9\.\,]/g, '');
                        });

                        $inputForm.val(portalList[i].quota > -1 ? quota.resultSize : 0);
                        row.appendTo("#linkedPortalsList tbody");

                        $(".edit-quota-btn").on(clickEvent, editQuota);
                        $(".save-quota-btn").on(clickEvent, saveQuota);

                        $("#linkedPortalsList").removeClass("display-none");
                        loaderService.hideFormBlockLoader($('#quotaBox'));

                    }
                } else {
                    toastr.error(response.message);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
            });
    }

    function filesSizeToBytes(size) {
        var bytes = -1;
        switch (size.name.toLowerCase()) {
            case "bytes":
                bytes = size.value;
                break;
            case "kb":
                bytes = size.value * 1024;
                break;
            case "mb":
                bytes = size.value * Math.pow(1024, 2);
                break;
            case "gb":
                bytes = size.value * Math.pow(1024, 3);
                break;
            case "tb":
                bytes = size.value * Math.pow(1024, 4);
                break;
            case "pb":
                bytes = size.value * Math.pow(1024, 5);
                break;
        }
        return bytes;
    }
    function filesSizeToString(size) {
        var sizeNames = ["bytes", "KB", "MB", "GB", "TB"];
        var power = 0;

        var resultSize = size || 0;
        if (1024 <= resultSize) {
            power = parseInt(Math.log(resultSize) / Math.log(1024));
            power = power < sizeNames.length ? power : sizeNames.length - 1;
            resultSize = resultSize / Math.pow(1024, power);
        }

        var intRegex = /^\d+$/;
        if (intRegex.test(resultSize)) {
            resultSize = parseInt(resultSize);
        } else {
            resultSize = parseFloat(resultSize.toFixed(2));
        }

        return {
            resultSize: resultSize,
            sizeName: sizeNames[power]
        }
    };

    function selectStorage() {
        var $self = $(this);
        var $box = $self.closest('.selectTypeStorageBox');
        var $radio = $box.find('.thirdSelectStorage .radioBox');

        if ($self.hasClass(disabledClass)) {
            return;
        }

        $radio.removeClass(checked);
        $self.addClass(checked);

        var newVal = $self.attr("data-value");
        $box.find(".textBox").removeClass(withErrorClass);
        $box.find("div[data-id]").not('.flexContainer').addClass(displayNoneClass).removeClass('flexTextBox');
        $box.find("[data-id='" + newVal + "']").removeClass(displayNoneClass).addClass('flexTextBox');
        var currentConnectBtn = $box.find('.connectBtn');
        id = $box.attr("id");
        var finded = findElement(storagesMass[id]);
        if (finded.id === newVal && finded.isChange === false) {
            currentConnectBtn.addClass(disabledClass);
        } else {
            currentConnectBtn.removeClass(disabledClass);
        }

    }

    function initStorageType($box) {
        $box.find(".thirdSelectStorage .radioBox.checked").click();
    }

    function initStorages(diskStorages, consumerStorages) {
        var allStorages = consumerStorages;
        if (Object.keys(allStorages).length > 0) {
            var finded = findElement(allStorages);
            if (!finded) {
                diskStorages.current = true;
                diskStorages.isChange = false;
            }
            else {
                finded.isChange = false;
            }
            allStorages.unshift(diskStorages);
        }
        else {
            diskStorages.current = true;
            diskStorages.isChange = false;
            allStorages = [diskStorages];
        }
        return allStorages;
    }

    function connectWithStorage() {
        var $box = $(this).closest('.selectTypeStorageBox');
        var storage = getStorage($box);
        if (!storage) {
            return;
        }

        var $currentButton = $(this);
        if ($currentButton.hasClass(disabledClass)) return;
        $currentButton.addClass(disabledClass);
        var request;

        if (storage.default) {
            if ($currentButton.is($storageButton)) {
                request = 'storage/resetStorageToDefault';
            }
            else if ($currentButton.is($cdnButton)) {
                request = 'storage/resetCdnStorageToDefault';
            }

            apiService.delete(request)
                .done(function () {
                    location.href = "/";
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    toastr.error(data);
                    $currentButton.removeClass(disabledClass);
                });
        }
        else {
            if ($currentButton.is($storageButton)) {
                request = 'storage/updateStorage';
            }
            else if ($currentButton.is($cdnButton)) {
                request = 'storage/updateCdnStorage';
            }

            var data = {
                module: storage.id,
                props: storage.params
            };

            apiService.put(request, data)
                .done(function () {
                    location.href = "/";
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    toastr.error(data);
                    $currentButton.removeClass(disabledClass);
                });

        }

    }

    function getStorage($box) {
        var $storage = $box.find('.radioBox.checked');
        var storage = {
            id: $storage.attr('data-value'),
            params: []
        };

        var storageBox = $box.find("[data-id='" + storage.id + "']");
        var flexContainers = storageBox.find(".flexContainer");
        if (flexContainers.length == 0) {
            storage.default = true;
        } else {
            storage.params = window.ConsumerStorageSettings.getProps(storage.id, $box);
            if (!storage.params) {
                return false;
            }
        }

        return storage;
    }

    function enableConnectBtn() {
        var $self = $(this);
        var $box = $self.closest('.selectTypeStorageBox');
        var newId = $box.attr('id');
        var currentConnectBtn = $box.find('.connectBtn');
        var finded = findElement(storagesMass[newId]);
        finded.isChange = true;
        currentConnectBtn.removeClass(disabledClass);
    }

    function findElement(storage) {
        var findedElem = storage.find(function (c) {
            return c.current === true;
        });
        return findedElem;
    }

    function initEncryptionForm(settings) {
        if (jQuery.isEmptyObject(settings)) return;

        if (settings.status == 1 || settings.status == 3) {
            var $header = $encryptionBox.find("h2:first");
            $("#errorBlockTmpl").tmpl({ content: window.Resource.EncryptionLastOperationFailed }).insertAfter($header);
        }

        $encryptionBox.removeClass(displayNoneClass);
        $encryptionSettingsNotify.toggleClass(disabledClass, !encryptionAvailable);
        $encryptionButton.toggleClass(disabledClass, !encryptionAvailable).text(settings.status == 0 || settings.status == 1 ? window.Resource.EncryptionEncryptStorage : window.Resource.EncryptionDecryptStorage);
        $encryptionBox.find(".green-ticket").toggle(settings.status != 0);
        $encryptionSettingsNotify.toggleClass(checked, settings.notifyUsers);
    }

    function showEncryptionConfirmDialog() {
        if ($encryptionButton.hasClass(disabledClass)) return;

        Common.blockUI.show("encryptionConfirmDialog", 500, 350, 0, 0, 1000);
    }

    function encryptionStart() {
        if ($encryptionConfirmButton.hasClass(disabledClass)) {
            return;
        }

        $encryptionConfirmButton.addClass(disabledClass);

        var data = {
            notifyUsers: $encryptionSettingsNotify.hasClass(checked)
        };

        apiService.post("storage/encryptionStart", data)
            .done(function () {
                Common.blockUI.hide();
                location.href = "/";
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                window.toastr.error(jqXHR ? (jqXHR.responseText || jqXHR.statusText) : window.Resource.OperationFailedError);
                Common.blockUI.hide();
                $encryptionConfirmButton.removeClass(disabledClass);
            });
    }

    function editQuota() {
        var $select = $(this).parent().find(".selectOptionsBox");
        $select.show();
    }
    function setNoQuota() {

        var $row = $(this).closest("tr");
        var tenantId = $row.closest("tr").attr("data-id");

        var data = {
            tenantId: tenantId,
            disableQuota: true
        }

        apiService.put("storage/setTenantQuotaSettings", data)
            .done(function (res) {
                $row.find(".memory-quota span").html(window.Resource.NoQuota);
                window.toastr.success(window.Resource.OperationSucceededMsg);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                toastr.error(textStatus);
            });
    }

    function saveQuota() {

        var $row = $(this).closest("tr");
        var tenantId = $row.closest("tr").attr("data-id");
        var $form = $('tr.form[data-id=' + tenantId + ']');

        var quotaValue = $form.find("input").val();
        var quotaSize = $form.find(".selectBox").attr("data-value");

        var quotaSizeByte = filesSizeToBytes({
            name: quotaSize,
            value: quotaValue
        });

        var usedSize = parseInt($row.find(".used-memory").attr("data"));

        if (usedSize > quotaSizeByte) {
            toastr.error(window.Resource.ErrorSetQuota);
            return;
        }

        var data = {
            maxTotalSize: quotaSizeByte,
            tenantId: tenantId
        };

        apiService.put("storage/quota", data)
            .done(function (res) {
                if (res.success) {

                    var quota = filesSizeToString(res.data.tariff.maxTotalSize);
                    var currentQuota = parseInt($row.find(".memory-quota").attr("data"));
                    if (currentQuota == -1) {

                        apiService.put("storage/setTenantQuotaSettings", {
                            tenantId: tenantId,
                            disableQuota: false
                        })
                            .done(function (r) {
                                $row.find(".memory-quota").attr("data", res.data.tariff.maxTotalSize)
                                $row.find(".memory-quota span").html('{0} {1}'.format(quota.resultSize, quota.sizeName));
                                window.toastr.success(window.Resource.OperationSucceededMsg);
                            })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                toastr.error(textStatus);
                            });
                    } else {
                        $row.find(".memory-quota").attr("data", res.data.tariff.maxTotalSize)
                        $row.find(".memory-quota span").html('{0} {1}'.format(quota.resultSize, quota.sizeName));
                        window.toastr.success(window.Resource.OperationSucceededMsg);
                    }
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                toastr.error(textStatus);
            });

        closeEditQuotaForm($row)
    }
    
    function openEditQuotaForm() {
        var $row = $(this).closest("tr");
        var portalId = $row.attr("data-id");
        var $form = $('tr.form[data-id=' + portalId + ']');

        if (!$form.is(":visible")) {

            $form.show();
            $row.find(".edit-quota-btn").hide();
            $row.find(".save-quota-btn").show();

            $('table.table-list tbody tr').removeClass("border-bottom");
            $('table.table-list tbody tr:visible:last').addClass("border-bottom");

        }
    }

    function closeEditQuotaForm($row) {
        var portalId = $row.attr("data-id");
        var $form = $('tr.form[data-id=' + portalId + ']');

        if ($form.is(":visible")) {

            $form.hide();
            $row.find(".edit-quota-btn").show();
            $row.find(".save-quota-btn").hide();

            $('table.table-list tbody tr').removeClass("border-bottom");
            $('table.table-list tbody tr:visible:last').addClass("border-bottom");
        }
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);