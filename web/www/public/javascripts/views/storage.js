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
        withErrorClass = "withError";
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
    var thirdPartyDescriptions = {};
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
            makeRequest('storage/encryptionSettings', true)],
            function (textStatus, res) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                if (textStatus != null) {
                    $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
                    $(window).trigger("rightSideReady", null);
                } else {

                    $view.removeClass(displayNoneClass);
                    $(window).trigger("rightSideReady", null);
                    var thirdPartyJSON = res[0];
                    initThirdPartyResources(thirdPartyJSON);

                    var allStorages = initStorages(Object.assign({}, diskDefault), thirdPartyJSON);
                    encryptionAvailable = allStorages[0].current;
                    initAllStorages(allStorages);

                    allStorages = initStorages(Object.assign({}, diskDefault), res[1]);
                    encryptionAvailable = encryptionAvailable && allStorages[0].current;
                    initAllCdnStorages(allStorages);

                    $radioButtons = $view.find('.radioBox');
                    $helpCenterSwitchers = $view.find('.helpCenterSwitcher');
                    bindEvents();
                    initStorageType($storageSettingsBox);
                    initStorageType($CDNSettingsBox);
                    initEncryptionForm(res[2]);
                }

                loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
            });
    }

    function initThirdPartyResources(thirdPartyStorages) {
        var storagesLength = thirdPartyStorages.length;
        for (var i = 0; i < storagesLength; i++) {
            var properties = thirdPartyStorages[i].properties;
            var propertiesLength = thirdPartyStorages[i].properties.length;
            thirdPartyDescriptions[thirdPartyStorages[i].id] = {};
            var thirdPartyItem = thirdPartyDescriptions[thirdPartyStorages[i].id];
            for (var j = 0; j < propertiesLength; j++) {
                var key = properties[j].name;
                var value = properties[j].description;
                thirdPartyItem[key] = value;
            }
        }
    };

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
        $box.html($("#consumerSettingsTmpl").tmpl({ storages: storages }));
        $box.find(".radioBox[data-value='" + selected.id + "']").addClass(checked);

        $box.off("input.textbox").on("input.textbox", ".textBox", function () {
            $(this).removeClass(withErrorClass);
        });
    }

    function bindEvents() {
        $radioButtons.on(clickEvent, selectStorage);
        $helpCenterSwitchers.on(clickEvent, showStorageHelpBox);
        $connectBtn.on(clickEvent, connectWithStorage);
        currentStorageProps.on(changeEvent, enableConnectBtn);
        currentCdnProps.on(changeEvent, enableConnectBtn);
        $encryptionButton.on(clickEvent, showEncryptionConfirmDialog);
        $encryptionConfirmButton.on(clickEvent, encryptionStart);
    }

    function selectStorage() {
        var $self = $(this);
        var $box = $self.closest('.selectTypeStorageBox');
        var $radio = $box.find('.radioBox');

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
        }
        else {
            currentConnectBtn.removeClass(disabledClass);
        }

    }

    function initStorageType($box) {
        $box.find(".radioBox.checked").click();
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

    function showStorageHelpBox() {
        var $box = $(this).closest('.helpCenterSwitcher');
        var existPopup = $box.find('.popup_helper');
        if (existPopup.length) {
            existPopup.remove();
            return;
        }
        $view.find(".popup_helper").remove();
        var storageName = $(this).parents(".flexTextBox").attr('data-id');
        var textBoxName = $(this).parent().attr('data-id');
        var description = thirdPartyDescriptions[storageName][textBoxName];
        var descriptionId = textBoxName + 'storageHelper';
        $box.html($("#storageHelpBox").tmpl({ description: description, descriptionId: descriptionId }));

        $(this).helper({
            BlockHelperID: descriptionId
        });
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

    function checkValid(consumer, key, value) {
        var needCheck = true;
        if  (consumer == "S3")  {
            needCheck = key == "bucket" || key == "region";
        }
        return needCheck ? !!value : true;
    }

    function getStorage($box) {
        var $storage = $box.find('.radioBox.checked');
        var storage = {
            id: $storage.attr('data-value'),
            params: []
        };

        var storageTextBoxes = $box.find("[data-id='" + storage.id + "']");
        var flexContainer = storageTextBoxes.find(".flexContainer");
        var countTextBoxes = flexContainer.length;
        if (countTextBoxes == 0) {
            storage.default = true;
        }
        else {
            var isError;
            for (var i = 0; i < countTextBoxes; i++) {
                var $item = $(flexContainer[i]).find('.textBox');
                var itemKey = $item.parent().attr("data-id");
                var itemValue = $item.val();
                if (!checkValid(storage.id, itemKey, itemValue)) {
                    $item.addClass(withErrorClass);
                    isError = true;
                } else {
                    $item.removeClass(withErrorClass);
                    storage.params.push({ key: itemKey, value: itemValue })
                }
            }

            if (isError) {
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

    function showEncryptionConfirmDialog () {
        if ($encryptionButton.hasClass(disabledClass)) return;

        Common.blockUI.show("encryptionConfirmDialog", 500, 350, 0, 0, 1000);
    }

    function encryptionStart () {
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

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);