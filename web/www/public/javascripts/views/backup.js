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


window.BackupView = function ($, apiService, loaderService) {
    var selectedStorages = {};
    var currentPortal;
    var backupTeamlabFolderSelected;
    var storageId;
    var selectorId;
    var realStorageId;

    var scheduleInitOff = null;

    var $view = $('#backupView');

    var $thirdStorageHelpers;

    var $backupBox = $view.find('#backupBox');
    var $backupForm = $view.find('#backupForm');

    var $backupStorageBox = $backupBox.find('#backupStorageBox');
    var $backupTeamlabStorageFolderSelector = $backupBox.find('#backupTeamlabStorageFolderSelector');
    var $backupTeamlabStorageFolderSelectorBtn = $backupBox.find('#backupTeamlabStorageFolderSelectorBtn');
    var $backupTeamlabStorage = $backupStorageBox.find('#backupTeamlabStorage');

    var $backupWithMailCheck = $backupBox.find('#backupWithMailCheck');
    var $backupForMigrationCheck = $backupBox.find('#backupForMigrationCheck');

    CheckForMigration = function () {

        if (!$(this).hasClass("checked") && $($backupWithMailCheck).hasClass("checked")) {
            $($backupWithMailCheck).toggleClass("checked");
        }
    }
    
    CheckMail = function () {

        if (!$(this).hasClass("checked") && $($backupForMigrationCheck).hasClass("checked")) {
            $($backupForMigrationCheck).toggleClass("checked");
        }
    }

    $backupForMigrationCheck.on("click", CheckForMigration);
    $backupWithMailCheck.on("click", CheckMail);

    var $startBackupBtn = $backupBox.find('#startBackupBtn');

    var $backupProgressBox = $backupBox.find('#backupProgressBox');
    var $backupProgressValue = $backupBox.find('#backupProgressValue');
    var $backupProgressText = $backupBox.find('#backupProgressText');

    var $backupResultLinkBox = $backupBox.find('#backupResultLinkBox');
    var $backupResultLink = $backupBox.find('#backupResultLink');

    var $scheduleBox = $view.find('#scheduleBox');
    var $scheduleForm = $view.find('#scheduleForm');

    var $scheduleSwitch = $scheduleBox.find('#scheduleSwitch');

    var $scheduleSettingsBox = $scheduleBox.find('#scheduleSettingsBox');
    var $scheduleStorageBox = $scheduleSettingsBox.find('#scheduleStorageBox');

    var $scheduleTeamlabStorageBox = $scheduleSettingsBox.find('#scheduleTeamlabStorageBox');
    var $scheduleTeamlabStorageSelector = $scheduleSettingsBox.find('#scheduleTeamlabStorageSelector');
    var $scheduleTeamlabStorageSelectorBtn = $scheduleSettingsBox.find('#scheduleTeamlabStorageSelectorBtn');
    var $scheduleTeamlabStorage = $scheduleSettingsBox.find('#scheduleTeamlabStorage');


    var $scheduleWithMail = $scheduleSettingsBox.find('#scheduleWithMail');
    var $scheduleDateTime = $scheduleSettingsBox.find('.datetimeSelectorBox');

    var $scheduleCopiesCount = $view.find('#maxStoredCopiesCount');

    var $saveScheduleBtn = $view.find('#saveSettingsBtn');

    var FOLDER_TITLE_COMMON_FILES = '';
    var FOLDER_VALUE_COMMON_FILES;

    var thirdPartyJSON;
    var $teamlabStorageFolderSelectorBox = $backupBox.find('.teamlabStorageFolderSelectorBox');
    var $teamlabStorageFolderSelector = $teamlabStorageFolderSelectorBox.find('.teamlabStorageFolderSelector');
    var $backupConsumerStorageSettingsBox = $view.find("#backupConsumerStorageSettingsBox");
    var $backupConsumerStorageScheduleSettingsBox = $view.find("#backupConsumerStorageScheduleSettingsBox");

    var storageTypes = {
        Temp: "4",
        Docs: "0",
        ThirdPartyDocs: "1",
        Consumers: "5",
        Local: "3"
    }
    var
        checked = "checked",
        clickEvent = "click",
        displayNoneClass = "display-none",
        withErrorClass = "withError";

    var checkedThirdParty;
    var $thirdPartyPopupBody;

    function getTeamlabFolderSelectorIframeUrl() {
        return currentPortal + '/Products/Files/FileChoice.aspx?root=1&onlyFolder=true';
    }

    function getThirdFolderSelectorIframeUrl(url) {
        return currentPortal + '/Products/Files/FileChoice.aspx?root=1&onlyFolder=true&thirdParty=true&folderID=' + url;
    }

    function init(portal) {
        currentPortal = portal;

        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);

        initFolderSelector();

        function makeRequest(path) {
            return function (cb) {
                apiService.get(path, false)
                    .done(function (res) {
                        cb(null, res);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        cb(textStatus, null);
                    });
            }
        }

        async.parallel([
            makeRequest('backup/getSchedule'),
            makeRequest('backup/getThirdParty'),
            makeRequest('backup/getProgress'),
            makeRequest('backup/getFoldersInCommonFolder'),
            makeRequest('backup/getStorages'),
            makeRequest('backup/getAllThirdParty'),
            makeRequest('backup/getAmazonS3Regions', true)],
            function (textStatus, res) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                if (textStatus != null) {
                    $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
                    $(window).trigger("rightSideReady", null);
                } else {

                    $view.removeClass(displayNoneClass);
                    $(window).trigger("rightSideReady", null);

                    handleStartedBackup(res[2]);

                    FOLDER_TITLE_COMMON_FILES = res[3].current.title;
                    FOLDER_VALUE_COMMON_FILES = res[3].current.id;

                    $backupTeamlabStorageFolderSelector
                        .val(FOLDER_TITLE_COMMON_FILES);

                    window.ConsumerStorageSettings.initS3Regions(res[6] || []);

                    thirdPartyJSON = res[4];
                    window.ConsumerStorageSettings.init($view, thirdPartyJSON);
                    initAllThirdStorages(res[5], res[1], thirdPartyJSON);

                    initConsumerStorages(thirdPartyJSON);
                    $thirdStorageHelpers = $view.find('.helpCenterSwitcher');
                    bindEvents();
                    initSchedule(res[0]);
                }

                loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
            });
    }

    function fillSelectedStorages(selectorId, storageId, newFolderId, newFolderTitle) {
        selectedStorages[selectorId + storageId] =
            {
                folder:
                {
                    id: newFolderId,
                    title: newFolderTitle
                }
            };
    }

    function initFolderSelector() {
        if (window.addEventListener) {
            window.addEventListener('message', setFolderSelector, false);
        } else {
            window.attachEvent('onmessage', setFolderSelector);
        }
    }

    function setFolderSelector(e) {
        var obj = JSON.parse(e.data);
        if (!obj) {
            Common.blockUI.hide();
            return;
        }

        if (!obj.file && !obj.pathTitle && !obj.folderId) {
            obj.pathTitle = selectedStorages[selectorId + storageId].folder.title;
            obj.folderId = selectedStorages[selectorId + storageId].folder.id;
        }

        if (backupTeamlabFolderSelected) {
            $backupTeamlabStorageFolderSelector.val(obj.pathTitle);
        } else {
            $scheduleTeamlabStorageSelector.val(obj.pathTitle);
        }

        fillSelectedStorages(selectorId, storageId, obj.folderId, obj.pathTitle);
        Common.blockUI.hide();
    }

    function initSchedule(schedule) {
        if (schedule && schedule.storageType !== undefined) {
            var storage = {
                isThirdPartyDocs: schedule.storageParams.isThirdPartyDocs,
                name: schedule.storageType,
                params: schedule.storageParams,
                title: schedule.storageParams.title
            },
                withMail = schedule.backupMail,
                maxStoredCopiesCount = schedule.backupsStored;
            $scheduleStorageBox.find('.selectButton').removeClass(checked);
            if (storage.name == storageTypes.ThirdPartyDocs) {
                storage.name = storageTypes.Consumers;
            }
            $scheduleStorageBox.find('.selectButton[data-value="' + storage.name + '"]').click();
            switch (storage.name.toString()) {

                case storageTypes.Docs:
                    fillSelectedStorages(selectorId, storageId, storage.params.folderId, storage.params.filePath);
                    $teamlabStorageFolderSelector = $scheduleSettingsBox.find('.teamlabStorageFolderSelector');
                    $teamlabStorageFolderSelector.val(storage.params.filePath);
                    break;

                case storageTypes.Consumers:
                    $view.find("#backupConsumerStorageScheduleSettingsBox").removeClass(displayNoneClass);
                    $scheduleSettingsBox.find(".radioBox[data-value='" + storage.params.title + "']").click();
                    if (storage.isThirdPartyDocs) {
                        if (!checkedThirdParty) {
                            toastr.error(window.Resource.AutomaticDataBackup + ": " + window.Resource.ErrorStorageIsNull);
                            break;
                        }
                        fillSelectedStorages(selectorId, storageId, checkedThirdParty.dataFolderId, storage.params.filePath);
                        var teamlabStorageFolderSelectorTitle = storage.params.filePath;
                        $teamlabStorageFolderSelector = $scheduleSettingsBox.find('.teamlabStorageFolderSelector');
                        $teamlabStorageFolderSelector.val(teamlabStorageFolderSelectorTitle);
                    }
                    else {
                        var newVal = storage.params.module;
                        $scheduleSettingsBox.find(".textBox").removeClass(withErrorClass);
                        $scheduleSettingsBox.find("[data-id='" + newVal + "']").removeClass(displayNoneClass).addClass('flexTextBox');
                    }
                    break;

                case storageTypes.Local:
                    $view.find(".localFileSelectorInput").val(storage.params.filePath);
                    $view.find("#scheduleLocalFileSelector").removeClass(displayNoneClass);
                    break;
            }

            setScheduleCron(schedule.cronParams);

            $scheduleSwitch.addClass('on');
            $scheduleSwitch.find('.text').text(window.Resource.On);

            if (withMail) {
                $scheduleWithMail.addClass(checked);
            }

            Common.selectorListener.set($scheduleCopiesCount, maxStoredCopiesCount);

            $scheduleSettingsBox.show();
        } else {
            scheduleInitOff = true;
            $scheduleSwitch.addClass('off');
            $scheduleSwitch.find('.text').text(window.Resource.Off);
            $scheduleSettingsBox.hide();
        }
    }

    function initAllThirdStorages(storages, comparedStorages, thirdPartyJSON) {
        if (!storages || storages.length === 0) return;
        for (var i = 0; i < thirdPartyJSON.length; i++) {
            thirdPartyJSON[i].isThirdPartyDocs = false;
        }
        var length = storages.length;
        for (var i = 0; i < length; i++) {
            var item = {
                id: storages[i][0],
                title: storages[i][0],
                isSet: false,
                isThirdPartyDocs: true,
                current: false
            };

            var finded = comparedStorages.find(function (c) {
                return c.provider_key === item.id;
            });

            if (finded) {
                item.dataFolderId = finded.id;
                item.boxTitle = finded.title;
                item.isSet = true;
            }

            thirdPartyJSON.push(item);
        }
    }

    function handleStartedBackup(backupProgress) {
        if (!backupProgress) {
            return;
        }
        if (backupProgress.isCompleted === false) {
            setTimeout(function () {
                loaderService.showFormBlockLoader($backupForm);
                $backupProgressBox.show();
                renderBackupProgress(backupProgress);
            }, 200);
        } else {
            if (backupProgress.link) {
                showBackupResult(backupProgress.link)
            }
        }
    }

    function initConsumerStorages(storages) {
        if (storages.length === 0) {
            $view.find("#backupConsumerStorage, #scheduleConsumerStorage").hide();
            return;
        }

        $backupConsumerStorageSettingsBox = $view.find("#backupConsumerStorageSettingsBox");
        var selectedConsumer = storages.find(function (item) { return item.isSet }) || storages[0];
        initConsumerStorage($backupConsumerStorageSettingsBox, selectedConsumer, storages, "backup");

        $backupConsumerStorageScheduleSettingsBox = $view.find("#backupConsumerStorageScheduleSettingsBox");
        selectedConsumer = storages.find(function (item) { return item.current }) || selectedConsumer;
        initConsumerStorage($backupConsumerStorageScheduleSettingsBox, selectedConsumer, storages, "schedule");
        if (!selectedConsumer.isThirdPartyDocs) {
            window.ConsumerStorageSettings.setProps($backupConsumerStorageScheduleSettingsBox, selectedConsumer);
        }
    }

    function initConsumerStorage($box, selectedConsumer, storages, name) {
        var tmplData = window.ConsumerStorageSettings.getTmplData({ storages: storages }, name);

        $box.html($("#consumerSettingsTmpl").tmpl(tmplData));

        window.ConsumerStorageSettings.bindEvents($box);

        $box.find(".radioBox[data-value='" + selectedConsumer.id + "']").addClass(checked);
    }

    function bindEvents() {
        $backupTeamlabStorageFolderSelectorBtn.on(clickEvent, showStorageFolderPop);
        $scheduleTeamlabStorageSelectorBtn.on(clickEvent, showStorageFolderPop);

        $thirdStorageHelpers.on(clickEvent, window.ConsumerStorageSettings.showStorageHelpBox);

        $scheduleSwitch.on(clickEvent, toggleScheduleSettingsBox);

        $backupStorageBox.find('.selectButton').on(clickEvent, selectStorage);
        $scheduleStorageBox.find('.selectButton').on(clickEvent, selectStorage);

        $backupConsumerStorageSettingsBox.find('.thirdSelectStorageFlexbox .radioBox').on(clickEvent, selectThirdParty);
        $backupConsumerStorageScheduleSettingsBox.find('.thirdSelectStorageFlexbox .radioBox').on(clickEvent, selectThirdParty);

        $startBackupBtn.on(clickEvent, startBackup);
        $saveScheduleBtn.on(clickEvent, saveSchedule);
    }

    function selectThirdParty() {

        var $self = $(this);
        var $box = $self.closest('.backupBox');
        var $radio = $box.find('.thirdSelectStorageFlexbox .radioBox');

        if ($self.hasClass("disabled")) {
            return;
        }

        var checkedId = $self.attr("data-value");
        checkedThirdParty = thirdPartyJSON.find(function (item) {
            return item.id === checkedId;
        })

        $radio.removeClass(checked);
        $self.addClass(checked);

        $teamlabStorageFolderSelectorBox = $box.find('.teamlabStorageFolderSelectorBox');
        $teamlabStorageFolderSelector = $teamlabStorageFolderSelectorBox.find('.teamlabStorageFolderSelector');

        if (checkedThirdParty.isThirdPartyDocs) {
            var newSelectorId = $box.find('.buttonGroup .checked').attr('id');
            if (storageId != realStorageId + checkedThirdParty.id || selectorId != newSelectorId) {
                storageId = realStorageId + checkedThirdParty.id;
                selectorId = $box.find('.buttonGroup .checked').attr('id');
            }
            if (!selectedStorages.hasOwnProperty(selectorId + storageId)) {
                fillSelectedStorages(selectorId, storageId, checkedThirdParty.dataFolderId, $self.attr('title'));
            }
            var teamlabStorageFolderSelectorTitle = selectedStorages[selectorId + storageId].folder.title;

            $teamlabStorageFolderSelector = $box.find('.teamlabStorageFolderSelector');
            $teamlabStorageFolderSelectorBox = $box.find('.teamlabStorageFolderSelectorBox');
            $teamlabStorageFolderSelector.val(teamlabStorageFolderSelectorTitle);
            $teamlabStorageFolderSelectorBox.removeClass(displayNoneClass);
        }
        else {
            $teamlabStorageFolderSelectorBox.addClass(displayNoneClass);
        }

        var newVal = $self.attr("data-value");
        $box.find(".textBox").removeClass(withErrorClass);
        $box.find("div[data-id]").not('.flexContainer').addClass(displayNoneClass).removeClass('flexTextBox');
        $box.find("[data-id='" + newVal + "']").removeClass(displayNoneClass).addClass('flexTextBox');
    }

    function showStorageFolderPop() {
        var $this = $(this);
        if ($this.is('.disabled')) {
            return;
        }

        var $popup = $view.find('.teamlabStorageFolderSelectorPopup');
        var url;

        var $box = $this.closest('.backupBox');
        var $storageBox = $box.find('.buttonGroup');
        var $select = $storageBox.find('.selectButton.checked').attr('data-value');
        selectorId = $storageBox.find('.checked').attr('id');
        storageId = $select;
        if ($select == storageTypes.Consumers) {
            var providerKey = checkedThirdParty.id;
            storageId = realStorageId + checkedThirdParty.id;
            var folderId = selectedStorages[selectorId + storageId].folder.id;
        }


        if ($this.is($backupTeamlabStorageFolderSelectorBtn)) {
            backupTeamlabFolderSelected = true;
            url = $backupTeamlabStorage.is('.checked') ? getTeamlabFolderSelectorIframeUrl() : getThirdFolderSelectorIframeUrl(folderId);
        } else {
            url = $scheduleTeamlabStorage.is('.checked') ? getTeamlabFolderSelectorIframeUrl() : getThirdFolderSelectorIframeUrl(folderId);
            backupTeamlabFolderSelected = false;
        }

        var $iframe = $popup.find('#frameFolderSelector');
        Common.blockUI.show('backupTeamlabStorageFolderSelectorPopup', 425, 635);

        if ($iframe.length) {
            $iframe.attr('src', url)
                .attr("onload", "javascript:BackupView.frameLoad(\"" + providerKey + "\");return false;")
                .attr("scrolling", "no")
                .css("visibility", "hidden");
        } else {
            $('<iframe/>').addClass('teamlabFolderSelectorIframe')
                .attr("id", "frameFolderSelector")
                .attr('src', url)
                .attr("onload", "javascript:BackupView.frameLoad(\"" + providerKey + "\");return false;")
                .attr("scrolling", "no")
                .css("visibility", "hidden")
                .appendTo($popup.find('.popup-content'));
        }
        $thirdPartyPopupBody = $popup.find('.popup-body');
        loaderService.showFormBlockLoader($thirdPartyPopupBody);
    }

    function frameLoad(providerKey) {
        var contentWindow = $("#frameFolderSelector")[0].contentWindow;

        var eventAfter = function () {
            contentWindow.ASC.Files.FileSelector.showThirdPartyOnly(providerKey);
            loaderService.hideFormBlockLoader($thirdPartyPopupBody);
            $("#frameFolderSelector").css("visibility", "visible");
        };

        contentWindow.ASC.Files.FileChoice.eventAfter = eventAfter;

        if (contentWindow.ASC.Files.FileChoice.isEventAfterTriggered && contentWindow.ASC.Files.FileChoice.isEventAfterTriggered()){
            eventAfter();
        }
    }

    function toggleScheduleSettingsBox() {
        var off = $scheduleSwitch.is('.off');
        if (off) {
            $scheduleSwitch.removeClass('off').addClass('on');
            $scheduleSwitch.find('.text').text(window.Resource.On);
            $scheduleSettingsBox.show();

            if (scheduleInitOff) {
                scheduleInitOff = false;
                $scheduleTeamlabStorage.click();
            }
        } else {
            $scheduleSwitch.removeClass('on').addClass('off');
            $scheduleSwitch.find('.text').text(window.Resource.Off);
            $scheduleSettingsBox.hide();
        }
    }

    function selectStorage() {
        var $self = $(this);
        selectorId = this.id;
        var $box = $self.closest('.backupBox');

        var $storageBox = $box.find('.buttonGroup');
        var $select = $storageBox.find('.selectButton');
        $select.removeClass(checked);
        $self.addClass(checked);
        storageId = $storageBox.find('.checked').attr('data-value');

        $teamlabStorageFolderSelectorBox = $box.find('.teamlabStorageFolderSelectorBox');
        $teamlabStorageFolderSelector = $teamlabStorageFolderSelectorBox.find('.teamlabStorageFolderSelector');

        var $backupConsumerStorageSettingsBox = $box.find('.consumerStorageSettingsBox');
        var $backupThirdStorageInstruction = $box.find('.grayTextInstruction');
        var $localFileSelectorBox = $box.find('.localSettingsBox');

        function hideAll() {
            $teamlabStorageFolderSelectorBox.addClass(displayNoneClass);
            $backupConsumerStorageSettingsBox.addClass(displayNoneClass);
            $backupThirdStorageInstruction.addClass(displayNoneClass);
            $localFileSelectorBox.addClass(displayNoneClass);
        }

        switch (storageId) {
            case storageTypes.Docs:
                if (!selectedStorages.hasOwnProperty(selectorId + storageId)) {
                    fillSelectedStorages(selectorId, storageId, FOLDER_VALUE_COMMON_FILES, FOLDER_TITLE_COMMON_FILES);
                }
                hideAll();
                $teamlabStorageFolderSelector.val(selectedStorages[selectorId + storageId].folder.title);
                $teamlabStorageFolderSelectorBox.removeClass(displayNoneClass);
                break;
            case storageTypes.Temp:
                hideAll();
                break;
            case storageTypes.Consumers:
                realStorageId = storageId;
                hideAll();
                $box.find('.consumerStorageSettingsBox').removeClass(displayNoneClass);
                $box.find('.grayTextInstruction').removeClass(displayNoneClass);
                $box.find(".thirdSelectStorageFlexbox .radioBox.checked").click();
                break;
            case storageTypes.Local:
                hideAll();
                $localFileSelectorBox.removeClass(displayNoneClass);
                break;
        }
    }

    function startBackup() {
        if ($startBackupBtn.is('.disabled')) {
            return;
        }

        $backupBox.find('.withError').removeClass(withErrorClass);

        $backupProgressBox.hide();
        $backupResultLinkBox.hide();
        var storageType = $backupBox.find('.selectButton.checked').attr('data-value');
        if (storageType === 5) {
            $backupBox.find('.radioBox.checked').click();
        }
        var storage = getStorage($backupBox);
        if (!storage) {
            return;
        }

        var withMail = $backupWithMailCheck.is('.checked');
        var dump = !$backupForMigrationCheck.is('.checked');
        loaderService.showFormBlockLoader($backupForm);
        showBackupProgress(0);

        var data = {
            'storageType': storage.id,
            'storageParams': storage.params,
            'backupMail': withMail,
            'dump': dump
        };
        apiService.post('backup/start', data)
            .done(function (resp) {
                renderBackupProgress(resp);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                renderBackupErrors(jqXHR.responseText);
            });
    }

    function showBackupResult(link) {
        var pat = /^https?:\/\//i;

        if (pat.test(link)) {
            $backupResultLink.attr('href', link);
        }
        else {
            $backupResultLink.attr('href', currentPortal + link);
        }

        $backupResultLinkBox.show();
    }

    function renderBackupProgress(backupProgress) {
        if (backupProgress.error) {
            renderBackupErrors(backupProgress.error.Message);
            return;
        } else if (backupProgress.isCompleted) {
            $backupProgressBox.hide();
            loaderService.hideFormBlockLoader($backupForm);

            if (backupProgress.link) {
                showBackupResult(backupProgress.link)
            }

            toastr.success(window.Resource.BackupCompletedMsg);
            return;
        }

        showBackupProgress(backupProgress.progress);

        setTimeout(function () {
            apiService.get('backup/getProgress', false)
                .done(function (res) {
                    renderBackupProgress(res);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                    renderBackupErrors(jqXHR.responseText || window.Resource.BackupErrorMsg);
                });
        }, 1000);
    }

    function renderBackupErrors(error) {
        $backupProgressBox.hide();
        showBackupErrors($backupBox, error);
        loaderService.hideFormBlockLoader($backupForm);
    }

    function showBackupProgress(progress) {
        if (typeof progress != "undefined") {
            $backupProgressValue.animate({ 'width': progress + '%' }, function () {
                $backupProgressBox.show();
                $backupProgressText.text(' ' + progress + '% ');
            });
        }
    }

    function saveSchedule() {
        $scheduleBox.find('.withError').removeClass(withErrorClass);
        $scheduleBox.find('.selectButton.checked').click();
        var on = $scheduleSwitch.is('.on');
        if (on) {
            var storage = getStorage($scheduleBox);
            if (!storage) {
                return;
            }

            loaderService.showFormBlockLoader($scheduleForm);
            apiService.post('backup/createSchedule', {
                'storageType': storage.id,
                'storageParams': storage.params,
                'backupsStored': $scheduleCopiesCount.attr('data-value'),
                'cronParams': getScheduleCron(),
                'backupMail': $scheduleWithMail.is('.checked'),
            })
                .done(function () {
                    loaderService.hideFormBlockLoader($scheduleForm);
                    toastr.success(window.Resource.BackupScheduleSavedMsg);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    loaderService.hideFormBlockLoader($scheduleForm);
                    showBackupErrors($scheduleBox, errorThrown);
                });
        } else {
            loaderService.showFormBlockLoader($scheduleForm);
            apiService.delete('backup/deleteSchedule')
                .done(function () {
                    loaderService.hideFormBlockLoader($scheduleForm);
                    toastr.success(window.Resource.BackupScheduleDeletedMsg);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                    loaderService.hideFormBlockLoader($scheduleForm);
                    toastr.error(window.Resource.OperationFailedError);
                });
        }
    }

    function getStorage($box) {
        var $storage = $box.find('.buttonGroup .checked');
        selectorId = $storage.attr('id');
        var storage = {
            id: $storage.attr('data-value'),
            params: []
        };

        switch (storage.id) {
            case storageTypes.Consumers:
            case storageTypes.Docs:
                if (storage.id != storageTypes.Docs && !checkedThirdParty) {
                    toastr.error(window.Resource.ErrorStorageIsNull);
                    return false;
                }

                if (storage.id != storageTypes.Docs && !checkedThirdParty.isThirdPartyDocs) {
                    var $selectedConsumer = $box.find('.consumerStorageSettingsBox');
                    var selectedConsumer = $selectedConsumer.find('.radioBox.checked').attr("data-value");
                    storage.params = window.ConsumerStorageSettings.getProps(selectedConsumer, $selectedConsumer);
                    if (!storage.params) {
                        return false;
                    }
                    storage.params.unshift({ key: "module", value: selectedConsumer });
                } else {
                    if (storage.id != storageTypes.Docs) {
                        var val = selectedStorages[selectorId + storage.id + checkedThirdParty.id].folder.id;
                        storage.id = storageTypes.ThirdPartyDocs;
                        storage.params.push({ key: 'isThirdPartyDocs', value: checkedThirdParty.isThirdPartyDocs });
                        storage.params.push({ key: 'title', value: checkedThirdParty.title });
                    }
                    else {
                        var val = selectedStorages[selectorId + storage.id].folder.id;
                    }
                    storage.params.push({ key: "folderId", value: val });

                    var $path = $box.find('.teamlabStorageFolderSelector');
                    var value = $path.val();
                    storage.params.push({ key: "filePath", value: value });

                    if (!val) {
                        $path.addClass(withErrorClass);
                        return false;
                    }
                }

                break;
            case storageTypes.Local:
                var $path = $box.find(".localFileSelectorInput");
                var val = $path.val();
                storage.params.push({ key: "filePath", value: val });
                if (!val) {
                    $path.addClass(withErrorClass);
                    return false;
                }

                break;
        }

        return storage;
    }

    function getScheduleCron() {
        var obj = {
            Period: $scheduleDateTime.find('.typeSelector').attr('data-value'),
            Hour: $scheduleDateTime.find('.hoursSelector').attr('data-value')
        };

        if ($scheduleDateTime.find('.daysSelector').is(':visible')) {
            obj.Day = $scheduleDateTime.find('.daysSelector').attr('data-value');
        } else if ($scheduleDateTime.find('.daysweekSelector').is(':visible')) {
            obj.Day = $scheduleDateTime.find('.daysweekSelector').attr('data-value');
        }

        return obj;
    }

    function setScheduleCron(dateTime) {
        Common.selectorListener.set($scheduleDateTime.find('.typeSelector'), dateTime.period);
        Common.selectorListener.set($scheduleDateTime.find('.hoursSelector'), dateTime.hour);

        if (dateTime.period == '1') {
            $scheduleDateTime.find('.daysweekSelector').show();
            Common.selectorListener.set($scheduleDateTime.find('.daysweekSelector'), dateTime.day);
        } else if (dateTime.period == '2') {
            $scheduleDateTime.find('.daysSelector').show();
            Common.selectorListener.set($scheduleDateTime.find('.daysSelector'), dateTime.day);
        }
    }

    function showBackupErrors($box, error) {
        switch (error) {
            default:
                toastr.error(error.replace(/\n/g, "<br/>"));
                break;
        }
    }

    return {
        init: init,
        frameLoad: frameLoad
    };
}($, window.ApiService, window.LoaderService);