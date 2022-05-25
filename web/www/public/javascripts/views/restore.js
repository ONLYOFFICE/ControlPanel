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


window.RestoreView = function($, apiService, loaderService) {
    var currentPortal;

    var $view = $('#restoreView');

    var $restoreForm = $('#restoreForm');

    var $restoreSources = $view.find('.selectButton[data-name=restoreSource]');
    var $selfSource = $restoreSources.filter('#selfSource');
    var $thirdPartySource = $restoreSources.filter('#thirdPartySource');
    var $consumerSource = $restoreSources.filter('#consumerSource');
    var $thirdPartySourceHelper;

    var $sourceFileSelector = $view.find('#sourceFileSelector');
    var $sourceFileSelectorBtn = $sourceFileSelector.find('#sourceFileSelectorBtn');

    var $localFileSelector = $view.find('#localFileSelector');
    var $localFileSelectorInput = $localFileSelector.find('#localFileSelectorInput');
    var $localFileSelectorBtn = $localFileSelector.find('#localFileSelectorBtn');

    var $showBackupHistoryBtn = $view.find('#showBackupHistoryBtn');
    var $sendNotificationCheck = $view.find('#sendNotificationCheck');

    var $startRestoreBtn = $view.find('#startRestoreBtn');
    var $restoreProgressBox = $view.find('#restoreProgressBox');
    var $restoreProgressValue = $view.find('#restoreProgressValue');
    var $restoreProgressText = $view.find('#restoreProgressText');
    var $restoreProgressTitle = $view.find('#restoreProgressTitle');

    var $consumerStorageSettingsBox = $view.find('#consumerStorageSettingsBox');

    var sourceFileSelectorPopupId = 'sourceFileSelectorPopup';


    var $backupHistoryTmpl = $view.find('#backupHistoryTmpl');

    var backupHistoryPopupId = 'backupHistoryPopup';
    var $backupHistoryPopup = $('#' + backupHistoryPopupId);
    var $backupHistoryMsg = $('#backupHistoryMsg');
    var $noBackupHistoryMsg = $('#noBackupHistoryMsg');
    
    var displayNoneClass = "display-none", withErrorClass = "withError", clickEvent = "click", checked = "checked";
    var thirdPartyJSON;
    var checkedThirdParty;
    var providerKey;
    var newProviderKey;
    var folderId;
    var $thirdPartyPopupBody;
    var thirdPartyDescriptions = {};
    function init(portal) {
        currentPortal = portal;

        bindFileSelector();
        bindUploader();

        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);
        
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
            makeRequest('restore/getBackupHistory'),
            makeRequest('Backup/getThirdParty'),
            makeRequest('restore/getProgress'),
            makeRequest('backup/getStorages'),
            makeRequest('backup/getAllThirdParty')],
            function (textStatus, res) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

                if (textStatus && textStatus != "\"The specified key does not exist.\"") {//if operation error but not last Amazon restore problem
                    $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
                } else {
                    initBackupHistory(res[0]);
                    initThirdPartySource(res[1]);
                    $view.removeClass("display-none");
                    
                    thirdPartyJSON = res[3];
                    initAllThirdStorages(res[4], res[1], thirdPartyJSON);
                    handleStartedRestore(res[2]);
                    initConsumerStorages(thirdPartyJSON);
                    $sourceFileSelector.show();
                    
                    $thirdPartySourceHelper = $view.find('.helpCenterSwitcher');
                    bindEvents();
                }
                $(window).trigger("rightSideReady", null);

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
                current: false,
                properties: []
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
    
    function initConsumerStorages(storages) {
        if(storages.length === 0) {
            $view.find("#consumerSource").hide();
            return;
        }
        storages.forEach(function(item){
            if (!item.isThirdPartyDocs){ 
            item.properties.push({name: "filePath", title: window.Resource.RestoreConsumerPath, description: window.Resource.RestoreConsumerPathDscr});
            }
        });
        initThirdPartyResources(storages);
        var $backupConsumerStorageSettingsBox = $view.find("#consumerStorageSettingsBox");
        var selectedConsumer = storages.find(function (item) { return item.isSet }) || storages[0];
        initConsumerStorage($backupConsumerStorageSettingsBox, selectedConsumer, storages);
    }
    
    function initConsumerStorage($box, selectedConsumer, storages) {
        $box.html($("#consumerSettingsTmpl").tmpl({ storages: storages, selectedConsumer: selectedConsumer }));

        var $radio = $restoreForm.find('.radioBox');
        $radio.on(clickEvent, function () {
            var $self = $(this);

            if ($self.hasClass("disabled")) {
                return;
            }

            var checkedId = $self.attr("data-value");
            checkedThirdParty = thirdPartyJSON.find(function(item){
                return item.id === checkedId;
            });

            $radio.removeClass(checked);
            $self.addClass(checked);
    
            if (checkedThirdParty.isThirdPartyDocs) {
                $sourceFileSelector.show();
            }
            else {
                $sourceFileSelector.hide();
            }
    
            var newVal = $self.attr("data-value");
            $box.find(".textBox").removeClass(withErrorClass);
            $box.find("div[data-id]").not('.flexContainer').addClass(displayNoneClass).removeClass('flexTextBox');
            $box.find("[data-id='" + newVal + "']").removeClass(displayNoneClass).addClass('flexTextBox');
        });

        $box.find(".radioBox[data-value='" + selectedConsumer.id + "']").trigger(clickEvent, selectedConsumer.id);
        $box.off("input.textbox").on("input.textbox", ".textBox", function () {
            $(this).removeClass(withErrorClass);
        });
    }

    function bindFileSelector() {
        if (window.addEventListener) {
            window.addEventListener('message', pullSourceFile, false);
        } else {
            window.attachEvent('onmessage', pullSourceFile);
        }
    }

    function bindUploader() {
        $localFileSelectorBtn.fileupload({
            url: Common.basePath + "Restore/Upload",
            dataType: "json",
            autoUpload: true,
            singleFileUploads: true,
            sequentialUploads: true,
            maxChunkSize: 5*1024*1024,
            progressInterval: 1000,
            progress: function (evt, data) {
                showRestoreProgress(parseInt((data._progress.loaded / data._progress.total) * 100));
            },
            add: function (evt, data) {
                var file = data.files[0];
                if (/.+\.tar\.gz/.test(file.name)) {
                    data.submit();
                } else {
                    toastr.error(window.Resource.IncorrectFileType);
                }
                $restoreProgressTitle.text('');
            },
            done: function (evt, resp) {
                apiService.post('restore/uploadComplete', resp.result).done(function(result) {
                    Common.loader.hide();
                    if (result) {
                        $localFileSelectorInput.val(result.name);
                        toastr.success(window.Resource.OperationSucceededMsg);
                        $localFileSelector.attr("data-backupid", result.path);
                    }
                    $restoreProgressBox.hide();
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    toastr.error(window.Resource.OperationFailedError);
                });
            },
            fail: function () {
                toastr.error(window.Resource.OperationFailedError);
            }
        });
    }

    function pullSourceFile(res) {
        var data = JSON.parse(res.data);
        if (!data) {
            Common.blockUI.hide();
            return;
        }

        if (data.file === null) {
            $sourceFileSelector.attr('data-backupid', null);
        }
        else {
            $sourceFileSelector.attr('data-backupid', data.fileId);
        }

        $sourceFileSelector.find('.textBox').val(data.fileTitle);
        Common.blockUI.hide();
    }

    function initBackupHistory(history) {
        var html = $backupHistoryTmpl.tmpl({ history: history });
        $view.find('#' + backupHistoryPopupId + ' .popup-content').append(html);

        if (!history.length) {
            $backupHistoryMsg.hide();
            $noBackupHistoryMsg.show();
        }
    }

    function initThirdPartySource(accounts) {
        if (accounts && accounts.length) {
            $thirdPartySource.parent().attr("title", null);
            $thirdPartySource.removeClass('disabled');
            $thirdPartySource.find('.helpCenterSwitcher').remove();
        }
    }

    function handleStartedRestore(restoreProgress) {
        var restoreStarted = restoreProgress && restoreProgress.isCompleted === false;
        if (restoreStarted) {
            setTimeout(function() {
                loaderService.showFormBlockLoader($restoreForm, 10);
                $restoreProgressBox.show();
                renderRestoreProgress(restoreProgress);
            }, 200);
        }
    }

    function bindEvents() {
        $restoreSources.on('click', changeCurrentRestoreSource);
        $thirdPartySourceHelper.on('click', showThirdPartySourceHelper);
        $sourceFileSelectorBtn.on('click', showSourceFileSelectorPopup);
        $showBackupHistoryBtn.on('click', showBackupHistory);

        $backupHistoryPopup.on('click', '#deleteBackupHistoryBtn', deleteBackupHistory);
        $backupHistoryPopup.on('click', '.restore', restoreBackup);
        $backupHistoryPopup.on('click', '.trash', deleteBackup);

        $startRestoreBtn.on('click', startRestore);
    }

    function changeCurrentRestoreSource() {
        var $el = $(this);
        if ($el.is('.disabled')) {
            return;
        }
        function hideAll() {
            $localFileSelector.hide();
            $sourceFileSelector.hide();
            $consumerStorageSettingsBox.hide();
        }

        var $select = $restoreForm.find('.selectButton');
        $select.removeClass('checked');
        $el.addClass('checked');

        if ($el.is('#selfSource') || $el.is('#thirdPartySource')) {
            hideAll();
            $sourceFileSelector.attr('data-filepath', '');
            $sourceFileSelector.find('.textBox').val('');
            $sourceFileSelector.show();
        } else if ($el.is('#localSource')) {
            hideAll();
            $localFileSelector.show();
            $localFileSelectorInput.val("");
        } else if($el.is("#consumerSource")){
            hideAll();
            $consumerStorageSettingsBox.show();
            if (checkedThirdParty && checkedThirdParty.isThirdPartyDocs) {
                $sourceFileSelector.attr('data-filepath', '');
                $sourceFileSelector.find('.textBox').val('');
                $sourceFileSelector.show();
            }
        }
    }

    function showThirdPartySourceHelper() {
        var $box =  $(this).closest('.helpCenterSwitcher');
        var existPopup = $box.find('.popup_helper');
        if (existPopup.length){
            existPopup.remove();
            return;
        }
        $view.find(".popup_helper").remove();
        var storageName = $(this).parents(".flexTextBox").attr('data-id');
        var textBoxName = $(this).parent().attr('data-id');
        var description = thirdPartyDescriptions[storageName][textBoxName];
        var descriptionId = textBoxName + 'ThirdStorageHelper';
        $box.html($("#consumerHelpBox").tmpl({ description: description, descriptionId: descriptionId }));
        
        $(this).helper({
            BlockHelperID: descriptionId
        });
    }

    function showSourceFileSelectorPopup() {
        var url;
        var $popup = $view.find('#sourceFileSelectorPopup');
        if ($selfSource.is('.checked')) {
            url = getFileSelectorIframeUrl();
        } else if ($consumerSource.is('.checked')) {
            if (!newProviderKey) {
                newProviderKey = checkedThirdParty.id;
            }
            providerKey = checkedThirdParty.id;
            var tempFolderId = $sourceFileSelector.attr('data-backupid');
            if (tempFolderId != undefined && providerKey === newProviderKey){
                var folderIdIndex = tempFolderId.indexOf("-|");
                folderId = tempFolderId.substring(0, folderIdIndex);
            }
            else {
                folderId = checkedThirdParty.dataFolderId;
                newProviderKey = checkedThirdParty.id;
            }
            url = getThirdPartyFilerSelectorIframeUrl(folderId);
            
        }
        
        if (url) {
            var $iframe = $('#' + sourceFileSelectorPopupId + ' iframe');
            Common.blockUI.show(sourceFileSelectorPopupId, 1000, 580);

            if ($iframe.length) {
                $iframe.attr('src', url)
                    .attr("onload", "javascript:RestoreView.frameLoad(\"" + providerKey + "\");return false;")
                    .css("visibility", "hidden")
                    .attr("scrolling", "no")
                    .css("height", "500px");
            } else {
                $('<iframe/>').addClass('teamlabFolderSelectorIframe')
                    .attr("id", "frameFolderSelector")
                    .attr('src', url)
                    .attr("onload", "javascript:RestoreView.frameLoad(\"" + providerKey + "\");return false;")
                    .css("visibility", "hidden")
                    .attr("scrolling", "no")
                    .css("height", "500px")
                    .appendTo($popup.find('.popup-content'));
            }
            $thirdPartyPopupBody = $popup.find('.popup-body');
            loaderService.showFormBlockLoader($thirdPartyPopupBody);   
        }
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


    function showBackupHistory() {
        Common.blockUI.show(backupHistoryPopupId, 550, 550);
    }

    function deleteBackupHistory() {
        var $popupBody = $backupHistoryPopup.find('.popup-body');
        var $backupHistoryTable = $('#backupHistoryTable');

        loaderService.showFormBlockLoader($popupBody);
        apiService.delete('restore/deleteBackupHistory')
            .done(function() {
                loaderService.hideFormBlockLoader($popupBody);
                $backupHistoryTable.fadeOut(300, function() {
                    $backupHistoryTable.remove();
                    $backupHistoryMsg.hide();
                    $noBackupHistoryMsg.show();
                    toastr.success(window.Resource.BackupHistoryDeletedMsg);
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                loaderService.hideFormBlockLoader($popupBody);
            });
    }

    function restoreBackup() {
        var backupId = $(this).closest('tr').attr('data-backupid');

        var $popupBody = $backupHistoryPopup.find('.popup-body');

        var data = {
            'backupId': backupId,
            'storageType': 0,
            'storageParams': null,
            'notify': $sendNotificationCheck.is('.checked')
        };

        loaderService.showFormBlockLoader($popupBody);
        apiService.post('restore/start', data)
            .done(function (resp) {
                loaderService.hideFormBlockLoader($popupBody);
                Common.blockUI.hide();
                loaderService.showFormBlockLoader($restoreForm, 10);

                renderRestoreProgress(resp);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                loaderService.hideFormBlockLoader($popupBody);
                renderRestoreErrors(jqXHR.responseText);
            });
    }

    function deleteBackup() {
        var backupId = $(this).closest('tr').attr('data-backupid');

        var $row = $(this).closest('tr');
        var $rows = $row.siblings('tr');

        loaderService.showFormBlockLoader($row);
        apiService.delete('restore/deleteBackup', { backupId: backupId })
            .done(function() {
                loaderService.hideFormBlockLoader($row);
                $row.fadeOut(300, function() {
                    $row.remove();
                    if (!$rows.length) {
                        $backupHistoryMsg.hide();
                        $noBackupHistoryMsg.show();
                    }
                    toastr.success(window.Resource.BackupDeletedMsg);
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                loaderService.hideFormBlockLoader($row);
            });
    }

    function startRestore() {
        clearSourceErrors();
        $restoreProgressBox.hide();
        $restoreProgressTitle.text(window.Resource.MakingRestore);

        var source = getSource();
        if (!validateSource(source)) {
            return;
        }

        var data = {
            'backupId': source.params.FilePath,
            'storageType': source.value,
            'storageParams': source.params,
            'notify': $sendNotificationCheck.is('.checked')
        };

        loaderService.showFormBlockLoader($restoreForm, 10);
        apiService.post('restore/start', data)
            .done(function (resp) {
                renderRestoreProgress(resp);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }
                renderRestoreErrors(jqXHR.responseText);
            });
    }

    function renderRestoreProgress(resp) {
        if (typeof resp == "string") { //auth.aspx html text
            try {
                resp = JSON.parse(resp);
            } catch (e) {
                console.log(e);
                location.href = "/";
                return;
            }
        }

        if (resp.error) {
            renderRestoreErrors(resp.error.Message);
            return;
        } else if (resp.isCompleted) {
            $restoreProgressBox.hide();

            loaderService.hideFormBlockLoader($restoreForm);
            toastr.success(window.Resource.DataRestoreCompletedMsg);
            location.href = "/";
            return;
        }

        showRestoreProgress(resp.progress);

        setTimeout(function() {
            apiService.get('restore/getProgress', false)
                .done(function (res) {
                    renderRestoreProgress(res);
                })
                .fail(function (res) {
                    if (res && res.status == 404)
                        renderRestoreProgress({});
                    else
                        location.href = "/";
                });
        }, 1000);
    }

    function showRestoreProgress(progress) {
        $restoreProgressBox.show();
        if (typeof progress != "undefined") {
            $restoreProgressValue.animate({ 'width': progress + '%' });
            $restoreProgressText.text(' ' + progress + '% ');
        }
    }

    function renderRestoreErrors(error) {
        $restoreProgressBox.hide();
        showRestoreError(error);
        loaderService.hideFormBlockLoader($restoreForm);
    }

    function showRestoreError(error) {
        switch (error) {
            default:
                toastr.error(error.replace(/\n/g, "<br/>"));
                break;
        }
    }

    function checkValid(consumer, key, value) {
        var needCheck = true;
        if  (consumer == "S3")  {
            needCheck = key == "bucket" || key == "region" || key == "filePath";
        }
        return needCheck ? !!value : true;
    }

    function getSource() {
        var $source = $restoreSources.filter('.checked');
        var storage = {
            value: $source.attr('data-value'),
            params: []
        };

        switch (storage.value) {
            case '0':
                storage.params.push({ key: "filePath", value: $sourceFileSelector.attr('data-backupid') });
                break;
            case '3':
                storage.params.push({ key: "filePath", value: $localFileSelector.attr('data-backupid') });
                break;
            case '5':
                if (checkedThirdParty && checkedThirdParty.isThirdPartyDocs) {
                    storage.params.push({ key: "filePath", value: $sourceFileSelector.attr('data-backupid') });
                    storage.value = '1';
                }
                else {
                var isError;
                var selectedConsumer = $consumerStorageSettingsBox.find('.radioBox.checked').attr("data-value");
                if (!selectedConsumer) {
                    toastr.error(window.Resource.ErrorStorageIsNull);
                    return false;
                }
                var $settings = $consumerStorageSettingsBox.find('div[data-id="' + selectedConsumer + '"] .textBox');
                storage.params.push({ key: "module", value: selectedConsumer });
                var settingsLength = $settings.length;
                for (var i = 0; i < settingsLength; i++) {
                    var $item = $($settings[i]);
                    var itemKey = $item.parent().attr("data-id");
                    var itemValue = $item.val();
                    if (!checkValid(selectedConsumer, itemKey, itemValue)) {
                        $item.addClass(withErrorClass);
                        isError = true;
                    } else {
                        $item.removeClass(withErrorClass);
                        storage.params.push({ key: itemKey, value: itemValue });
                    }
                }
                if (isError) {
                    return false;
                }
            }
                break;
        }

        return storage;
    }

    function validateSource(source) {
        var valid = true;
        
        if (!source) return false;

        switch (source.value) {
            case '0':
            case '1':
            case '5':
                if (checkedThirdParty && checkedThirdParty.isThirdPartyDocs && $consumerSource.is('.checked')) {
                    source.value = '1';
                }
                if (source.params.findIndex(function(item){return item.key === "filePath" && item.value}) === -1) {
                    $sourceFileSelector.find('.textBox').addClass(withErrorClass);
                    valid = false;
                }
                break;
            case '3':
                if (source.params.findIndex(function(item){return item.key === "filePath" && item.value}) === -1) {
                    $localFileSelector.find('.textBox').addClass(withErrorClass);
                    valid = false;
                }
                break;
        }

        return valid;
    }

    function clearSourceErrors() {
        $sourceFileSelector.find('.textBox').removeClass(withErrorClass);
        $localFileSelector.find('.textBox').removeClass(withErrorClass);
    }

    function getFileSelectorIframeUrl() {
        return currentPortal + '/Products/Files/FileChoice.aspx?root=1&documentType=10&compact=true';
    }

    function getThirdPartyFilerSelectorIframeUrl(url) {
        return currentPortal + '/Products/Files/FileChoice.aspx?root=1&documentType=10&compact=true&thirdParty=true&folderID=' + url;
    }

    return {
        init: init,
        frameLoad: frameLoad
    };
}($, window.ApiService, window.LoaderService);