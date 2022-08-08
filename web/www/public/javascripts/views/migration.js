window.MigrationView = function ($, apiService, loaderService) {


    var $view = $('#migration-view');

    var $initialImportGoogleBtn = $view.find('#initial-import-google-Btn');
    var $initialImportNextcloudBtn = $view.find('#initial-import-nextcloud-Btn');
    var $initialImportOwncloudBtn = $view.find('#initial-import-owncloud-Btn');
    var $initialImportNext = $view.find('#initial-import-next');
    var $checkUsersForImportNext = $view.find('#check-users-for-import-next');
    var $checkUsersWithoutEmailForImportNext = $view.find('#check-users-without-email-for-import-next');
    var $selectModulesToImportNext = $view.find('#select-modules-to-import-next');

    var $choiceOfMigration = $view.find('#choice-of-migration');
    var $initialImport = $view.find('#initial-import');
    var $checkUsersForImport = $view.find('#check-users-for-import');
    var $checkUsersNotEmails = $view.find('#check-users-not-email');
    var $selectModulesToImport = $view.find('#select-modules-to-import');
    var $migration = $view.find('#migration');
    var $resultsDataImport = $view.find('#results-data-import');

    var $backUploadToServer = $view.find('#back-upload-to-server');
    var $cancelUploadToServer = $view.find('#cancel-upload-to-server');
    var $backCheckUsersForImport = $view.find('#back-check-users-for-import');
    var $backCheckUsersWithoutEmailForImport = $view.find('#back-check-users-without-email-for-import');
    var $downloadUnimportedUsers = $view.find('#download-unimported-users');
    var $backSelectModulesToImport = $view.find('#back-select-modules-to-import');
    var $migrationCancel = $view.find('#migration-cancel');
    var $resultClose = $view.find('#result-close');
    var $resultDownloadLog = $view.find('#result-download-log');

    var $archivesUploader = $view.find('#archivesUploader');
    var $migrationProgressBox = $view.find('#migrationProgressBox');
    var $migrationProgressValue = $view.find('#migrationProgressValue');
    var $migrationProgressText = $view.find('#migrationProgressText');
    var $archivesInput = $view.find('#archivesInput');
    var $migrationProgressTitle = $view.find('#migrationProgressTitle');

    var $migrationProgressBoxMigrate = $view.find('#migrationProgressBoxMigrate');
    var $migrationProgressValueMigrate = $view.find('#migrationProgressValueMigrate');
    var $migrationProgressTextMigrate = $view.find('#migrationProgressTextMigrate');
    var $migrationProgressTitleMigrate = $view.find('#migrationProgressTitleMigrate');

    var $userWithoutEmailListTable = $view.find('#user-without-email-list-table');

    var $selectedLimitNotEmail = $checkUsersNotEmails.find('#selected-limit');
    var $selectedLimitEmails = $checkUsersForImport.find('#selected-limit');

    var $modulesChooseTable = $view.find('#modules-choose-table');

    var $allUsersCheckbox = $view.find('#allUsersCheckbox');
    var $notFilledEmails = $checkUsersForImport.find('#not-filled-emails');
    var $notFilledEmailsNotEmails = $checkUsersNotEmails.find('#not-filled-emails');
    var $allUsersWithoutEmailCheckbox = $view.find('#allUsersWithoutEmailCheckbox');
    var $modulesName = $view.find('#modulesName');
    var $messageShortResult = $resultsDataImport.find('#message-short-result');
    var $sendWelcomeEmail = $view.find('#migrationSendWelcomeEmail');

    var canceled = false;

    var apiMigration = "";

    function init() {
        bindUploader();
        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);
        loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
        renderView();
        return;
    }

    function initialImportGoogle() {
        $archivesUploader.attr('multiple', 'true');
        $initialImport.show();
        $choiceOfMigration.hide();
        $archivesInput.val("");
        apiMigration = "GoogleWorkspace";
        $('#select-file-prompt').text(window.Resource.MigrationSelectFilePrompt.format(window.Resource.MigrationGoogleWorkspace));
    }

    function initialImportNextcloud() {
        $archivesUploader.removeAttr('multiple');
        $initialImport.show();
        $choiceOfMigration.hide();
        $archivesInput.val("");
        apiMigration = "NextcloudMigrate";
        $('#select-file-prompt').text(window.Resource.MigrationSelectFilePrompt.format(window.Resource.MigrationNextcloud));
    }

    function initialImportOwncloud() {
        $archivesUploader.removeAttr('multiple');
        $initialImport.show();
        $choiceOfMigration.hide();
        $archivesInput.val("");
        apiMigration = "OwncloudMigrate";
        $('#select-file-prompt').text(window.Resource.MigrationSelectFilePrompt.format(window.Resource.MigrationOwncloud));
    }

    function checkUsersForImportNext() {
        if (!usersCheck)
            generateBodyCheckUsersWithoutEmailsForImport();
        $checkUsersNotEmails.show();
        $checkUsersForImport.hide();
    }

    function checkUsersWithoutEmailForImport() {
        generateBodySelectModulesToImport();
        switch (apiMigration) {
            case "NextcloudMigrate":
                $modulesName.text(window.Resource.MigrationNextcloud);
                break;
            case "GoogleWorkspace":
                $modulesName.text(window.Resource.MigrationGoogleWorkspace);
                break;
            case "OwncloudMigrate":
                $modulesName.text(window.Resource.MigrationOwncloud);
                break;
        }
        $selectModulesToImport.show();
        $checkUsersNotEmails.hide();
    }

    function renderView() {
        apiService.get("migration/status")
            .done(function (data) {
                if (typeof data == "string") {
                    apiMigration = data;
                    canceled = true;
                    $resultsDataImport.show();
                    switch (apiMigration) {
                        case "NextcloudMigrate":
                            $messageShortResult.text(window.Resource.MigrationCanceled.format(window.Resource.MigrationNextcloud));
                            break;
                        case "GoogleWorkspace":
                            $messageShortResult.text(window.Resource.MigrationCanceled.format(window.Resource.MigrationGoogleWorkspace));
                            break;
                        case "OwncloudMigrate":
                            $messageShortResult.text(window.Resource.MigrationCanceled.format(window.Resource.MigrationOwncloud));
                            break;
                    }
                    $messageShortResult.addClass('error');
                } else if (!data || !data.progress) {
                    $choiceOfMigration.show();
                    $('#download-incorrect-archives').hide();
                    enableGoogleInit(true);
                    enableNextcloudInit(true);
                    enableOwncloudInit(true);
                } else if (data.migrationEnded) {
                    $choiceOfMigration.hide();
                    $resultsDataImport.show();
                    showResultMigration();
                } else if (!data.migrationEnded) {
                    if (data.parseResult != null) {
                        migrationInfo = data.parseResult;
                        apiMigration = migrationInfo.migratorName;
                        if (data.progress == 100) {
                            if (migrationInfo.failedArchives.length > 0) {
                                $choiceOfMigration.hide();
                                $initialImport.show();
                                $backUploadToServer.off("click");
                                $backUploadToServer.on("click", function () {
                                    apiService.post('migration/cancel')
                                        .done(function (result) {
                                            apiService.post('migration/finish', {
                                                    isSendWelcomeEmail: false
                                                })
                                                .done(function (result) {
                                                    window.location.reload();
                                                });
                                        });
                                });
                                checkingAarchivesForCorrectness();
                            } else {
                                showCheckUSersForImport();
                            }
                        } else {
                            $migration.show();
                            interimStatus();
                        }
                    }
                    if (data.parseResult == null) {
                        $initialImport.show();
                        interimStatusMigration();
                    }
                }
            })
            .fail(function (err) {
                console.log("migration/status error ");
                console.log(err);
            });
        $checkUsersForImportNext.on("click", checkUsersForImportNext);

        $selectModulesToImportNext.click(function () {
            migrationInfo.users = [];
            usersIsChecked(usersWithEmail);
            usersIsChecked(usersWithoutEmail);
            modulesIsChecked();
            $migration.show();
            $selectModulesToImport.hide();
            apiService.post('migration/migrate', {
                    info: migrationInfo
                })
                .fail(function (err) {
                    console.log('migrate error');
                    console.log(err);
                });
            showMigrateProgress(0);
            interimStatus();
        });

        $resultClose.click(function () {
            apiService.post('migration/finish', {
                    isSendWelcomeEmail: $sendWelcomeEmail['0'].checked
                })
                .done(function (result) {
                    window.location.reload();
                });
        });
        $resultDownloadLog.click(function () {
            downloadLogs();
        });
        initBack();
        initCancel();
    }

    function generateCsv() {
        var text = "";
        usersWithoutEmail.forEach(function (element) {
            text += element.displayName + '%0D%0A';
        });
        var link = document.createElement('a');
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + text);
        link.setAttribute('download', 'Unimported Users.csv');
        link.click();
    }

    function initBack() {
        $backUploadToServer.click(function () {
            window.location.reload();
        });
        $backCheckUsersWithoutEmailForImport.click(function () {
            $checkUsersForImport.show();
            $checkUsersNotEmails.hide();
        });
        $backSelectModulesToImport.click(function () {
            $checkUsersNotEmails.show();
            $selectModulesToImport.hide();
        });
    }

    function cancel() {
        apiService.post('migration/cancel')
            .fail(function (err) {
                console.log('cancel error');
                console.log(err);
            });
    }

    function initCancel() {
        $backCheckUsersForImport.click(function () {
            apiService.post('migration/cancel')
                .done(function (result) {
                    apiService.post('migration/finish', {
                            isSendWelcomeEmail: false
                        })
                        .done(function (result) {
                            window.location.reload();
                        });
                });
        });
        $cancelUploadToServer.click(function () {
            cancel();
            canceled = true;
            $resultsDataImport.show();
            $messageShortResult.text(window.Resource.MigrationCanceled.format(apiMigration));
            $messageShortResult.addClass('error');
            $initialImport.hide();
        });
        $migrationCancel.click(function () {
            cancel();
            canceled = true;
            $resultsDataImport.show();
            $messageShortResult.text(window.Resource.MigrationCanceled.format(apiMigration));
            $messageShortResult.addClass('error');
            $migration.hide();
        });
    }

    function usersIsChecked(userList) {
        userList.forEach(function (element) {
            delete element.checkboxId;
            migrationInfo.users.push(element);
        });
    }

    function modulesIsChecked() {
        var modulesArr = [];
        modulesName.forEach(function (element) {
            modulesArr.push(element.moduleName.toLowerCase());
        });
        modulesName.forEach(function (element) {
            var $checkbox = $view.find('#' + element.checkboxId);
            if (element.checkboxId != "checkboxGroups") {
                migrationInfo.users.forEach(function (user) {
                    for (var item in user) {
                        if (typeof (user[item]) == "object" && user[item] != null) {
                            if (modulesArr.includes(user[item].moduleName.toLowerCase())) {
                                if ($checkbox['0'].checked) {
                                    user[item].shouldImport = true;
                                } else {
                                    user[item].shouldImport = false;
                                }
                            } else {
                                user[item].shouldImport = false;
                            }
                        }
                    }
                });
            } else {
                migrationInfo.groups.forEach(function (group) {
                    if (modulesArr.includes(group.moduleName.toLowerCase())) {
                        if ($checkbox['0'].checked) {
                            group.shouldImport = true;
                        } else {
                            group.shouldImport = false;
                        }
                    } else {
                        group.shouldImport = false;
                    }
                });
            }
        });
    }

    var usersWithEmail = [];
    var usersWithoutEmail = [];
    var usersWithoutEmailAndDisplayName = [];
    var userImportInfo = {
        selected: ""
    };

    function userImportInfoUpdate(currentLicense, usersLength, without) {
        userImportInfo.selected = window.Resource.MigrationSelected.format(currentLicense, usersLength);
        var $checkUsers;
        if (!without) {
            $checkUsers = $checkUsersForImport;
        } else {
            $checkUsers = $checkUsersNotEmails;
        }
        $checkUsers.find('#selected-limit').empty();
        var $eventsInfo = $('#select-limit-tmpl').tmpl(userImportInfo);
        $eventsInfo.appendTo($checkUsers.find('#selected-limit'));
    }
    var usedLicenses = 0;
    var currentLicenseWithoutEmail = 0;
    var currentLicenseWithEmail = 0;

    function aliveCheckboxes($allUsersCheckbox, users, without) {
        var currentLicense = without ? 0 : users.length;
        userImportInfoUpdate(currentLicense, users.length, without);
        if (without) {
            currentLicenseWithoutEmail = currentLicense;
        } else {
            currentLicenseWithEmail = currentLicense;
            $allUsersCheckbox.prop("checked", true);
        }
        $allUsersCheckbox.change(function (event) {
            var checkbox = event.target;
            currentLicense = without ? currentLicenseWithoutEmail : currentLicenseWithEmail;
            if (checkbox.checked) {
                if (!without)
                    currentLicense = users.length;
                users.forEach(function (element) {
                    var $checkbox = $view.find('#' + element.checkboxId);
                    if (!without) {
                        if (!element.shouldImport)
                            usedLicenses++;
                        $checkbox.prop("checked", true);
                        element.shouldImport = true;
                    }
                    if (without)
                        if (!$checkbox.prop("disabled")) {
                            if (!element.shouldImport) {
                                usedLicenses++;
                                currentLicense++;
                            }
                            $checkbox.prop("checked", true);
                            element.shouldImport = true;
                        }
                    checkingTheNumberOfSelectedUsers();
                });
            } else {
                currentLicense = 0;
                users.forEach(function (element) {
                    var $checkbox = $view.find('#' + element.checkboxId);
                    $checkbox.prop("checked", false);
                    if (element.shouldImport)
                        usedLicenses--;
                    element.shouldImport = false;
                    checkingTheNumberOfSelectedUsers();
                });
            }
            if (without) {
                currentLicenseWithoutEmail = currentLicense;
            } else {
                currentLicenseWithEmail = currentLicense;
            }
            userImportInfoUpdate(currentLicense, users.length, without);
        });
    }

    function checkingTheNumberOfSelectedUsers() {
        if (usedLicenses <= 0) {
            if ((migrationInfo.users.length - usersWithEmail.length) <= 0) {
                $checkUsersForImportNext.addClass('disabled');
                $checkUsersForImportNext.off("click");
            } else {
                $checkUsersForImportNext.removeClass('disabled');
                $checkUsersForImportNext.on("click", checkUsersForImportNext);
                $checkUsersWithoutEmailForImportNext.addClass('disabled');
                $checkUsersWithoutEmailForImportNext.off("click");
            }
        } else {
            $checkUsersForImportNext.removeClass('disabled');
            $checkUsersForImportNext.on("click", checkUsersForImportNext);
            $checkUsersWithoutEmailForImportNext.removeClass('disabled');
            $checkUsersWithoutEmailForImportNext.on("click", checkUsersWithoutEmailForImport);
        }
    }

    function addCheckboxEvent($allUsersCheckbox, element, usersLength, without) {
        var $checkbox = $view.find('#' + element.checkboxId);
        $checkbox.change(function (event) {
            var checkbox = event.target;
            var currentLicense = without ? currentLicenseWithoutEmail : currentLicenseWithEmail;
            if (checkbox.checked) {
                element.shouldImport = true;
                currentLicense++;
                usedLicenses++;
            } else {
                element.shouldImport = false;
                currentLicense--;
                usedLicenses--;
            }
            if (currentLicense == usersLength) {
                $allUsersCheckbox.prop("checked", true);
                $allUsersCheckbox.prop("indeterminate", false);
                if (without) {
                    $allUsersCheckbox.prop("disabled", false);
                }
            } else if (currentLicense == 0) {
                $allUsersCheckbox.prop("checked", false);
                $allUsersCheckbox.prop("indeterminate", false);
            } else {
                $allUsersCheckbox.prop("checked", false);
                $allUsersCheckbox.prop("indeterminate", true);
                if (without) {
                    $allUsersCheckbox.prop("disabled", false);
                }
            }
            if (without) {
                currentLicenseWithoutEmail = currentLicense;
            } else {
                currentLicenseWithEmail = currentLicense;
            }
            checkingTheNumberOfSelectedUsers();
            userImportInfoUpdate(currentLicense, usersLength, without);
        });
    }
    var usersCheck = false;

    function generateBodyCheckUsersWithoutEmailsForImport() {
        if (usersWithoutEmail.length <= 0 && usersCheck == false) {
            for (var i = 0; i < migrationInfo.users.length; i++) {
                if (!migrationInfo.users[i].email) {
                    if (migrationInfo.users[i].displayName == "") {
                        usersWithoutEmailAndDisplayName.push(migrationInfo.users[i]);
                    } else {
                        migrationInfo.users[i]['checkboxId'] = 'userWithoutListCheckbox' + usersWithoutEmail.length;
                        migrationInfo.users[i].shouldImport = false;
                        usersWithoutEmail.push(migrationInfo.users[i]);
                    }
                }
            }
            usersCheck = true;
        }
        checkingTheNumberOfSelectedUsers();
        if (usersWithoutEmail.length > 0 && usersCheck == true) {
            $pagination = $checkUsersNotEmails.find('#pagination');
            startPagination(usersWithoutEmail, $('#user-list-without-emails-tmpl'), true);
            $allUsersWithoutEmailCheckbox.prop('disabled', true);
            $allUsersWithoutEmailCheckbox.prop("checked", false);
            aliveCheckboxes($allUsersWithoutEmailCheckbox, usersWithoutEmail, true);
        }
        if (usersWithoutEmail.length <= 0 && usersCheck) {
            $pagination = $checkUsersNotEmails.find('#pagination');
            $pagination.hide();
            $userWithoutEmailListTable.hide();
            $selectedLimitNotEmail.hide();
            $notFilledEmailsNotEmails.addClass('display-none');
            $('#dont-not-filled-emails').removeClass('display-none');
        }
        $notFilledEmailsNotEmails['0'].childNodes[2].innerText = $notFilledEmailsNotEmails['0'].childNodes[2].innerText.format(usersWithoutEmail.length);
    }

    function addButtonEventWithoutEmails(user) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        var $pencil = $checkUsersNotEmails.find('#pencil' + user.checkboxId);
        var $textbox = $checkUsersNotEmails.find('#text' + user.checkboxId);
        var $ok = $checkUsersNotEmails.find('#ok' + user.checkboxId);
        var $cancel = $checkUsersNotEmails.find('#cancel' + user.checkboxId);
        var $checkbox = $checkUsersNotEmails.find('#' + user.checkboxId);
        var tempTextbox = window.Resource.MigrationNotFilled;
        if (user.email) {
            $textbox.val(user.email);
            $checkbox.prop('disabled', false);
        } else {
            $checkbox.prop('disabled', true);
        }
        $pencil.click(function () {
            if ($('#email-not-filled').text() == window.Resource.MigrationNotFilled) {
                $textbox.val("");
            }
            if ($('#email-not-filled').text().slice(-3) == "...") {
                $textbox.val(tempTextbox);
            }
            $('#email-not-filled').hide();
            $textbox.show();
            $textbox.prop('readonly', false);
            $pencil.addClass('display-none');
            $ok.removeClass('display-none');
            $cancel.removeClass('display-none');
            $textbox.focus();
        });
        $textbox.keydown(function (e) {
            if (e.keyCode === 13) {
                $ok.click();
            }
            if (e.keyCode === 27) {
                $cancel.click();
            }
        });
        $ok.click(function () {
            if ($textbox.val().trim() != "" && re.test($textbox.val().trim().toLowerCase())) {
                $pencil.removeClass('display-none');
                $ok.addClass('display-none');
                $cancel.addClass('display-none');
                $textbox.hide();
                $('#email-not-filled').show();
                $textbox.removeClass('borderError');
                tempTextbox = $textbox.val();
                $('#email-not-filled').text(tempTextbox);
                user.email = tempTextbox;
                $textbox.prop('readonly', true);
                $checkbox.prop('disabled', false);
                $allUsersWithoutEmailCheckbox.prop('disabled', false);
                if (tempTextbox.length > 25) {
                    $textbox.val(tempTextbox.slice(0, 25) + "...");
                    $('#email-not-filled').text(tempTextbox.slice(0, 25) + "...");
                }
            } else {
                toastr.error(window.Resource.MigrationIncorrectEmail);
                $textbox.addClass('borderError');
                $checkbox.prop('disabled', true);
                $checkbox.prop("checked", false);
            }
        });
        $cancel.click(function () {
            $pencil.removeClass('display-none');
            $ok.addClass('display-none');
            $cancel.addClass('display-none');
            $('#email-not-filled').show();
            if (tempTextbox.length > 25) {
                $textbox.val(tempTextbox.slice(0, 25) + "...");
                $('#email-not-filled').text(tempTextbox.slice(0, 25) + "...");
            } else {
                $textbox.val(tempTextbox);
                $('#email-not-filled').text(tempTextbox);
            }

            $textbox.hide();
            $textbox.prop('readonly', true);
        });


    }

    function generateBodyCheckUsersForImport() {
        if (usersWithEmail.length <= 0) {
            for (var i = 0; i < migrationInfo.users.length; i++) {
                if (migrationInfo.users[i].email) {
                    migrationInfo.users[i]['checkboxId'] = 'userListCheckbox' + usersWithEmail.length;
                    if (migrationInfo.users[i].displayName == "") {
                        migrationInfo.users[i].displayName = migrationInfo.users[i].email;
                    }
                    usersWithEmail.push(migrationInfo.users[i]);
                }
            }
        }
        if (usersWithEmail.length > 0) {
            $pagination = $checkUsersForImport.find('#pagination');
            usedLicenses = usersWithEmail.length;
            startPagination(usersWithEmail, $('#user-list-tmpl'), false);
            aliveCheckboxes($allUsersCheckbox, usersWithEmail, false);
        }
        if (usersWithEmail.length <= 0) {
            $pagination = $checkUsersForImport.find('#pagination');
            $pagination.hide();
            $selectedLimitEmails.hide();
        }
        var numberOfUsersWithoutEmail = migrationInfo.users.length - usersWithEmail.length;
        if (numberOfUsersWithoutEmail > 0) {
            $downloadUnimportedUsers.click(function () {
                generateCsv();
            });
            $notFilledEmails['0'].childNodes[1].innerText = $notFilledEmails['0'].childNodes[1].innerText.format(numberOfUsersWithoutEmail);
        } else {
            $('#all-users-have-emails').removeClass('display-none');
            $notFilledEmails.addClass('display-none');
            $downloadUnimportedUsers.addClass("disabled");
        }
    }

    var modulesName = [];

    var checkModules = false;

    function generateBodySelectModulesToImport() {
        apiService.get('migration/GetLogos?isDefault=false')
            .done(function (response) {
                if (response.success) {
                    $('#brand-modules').text(response.logoText);
                } else {
                    toastr.error(response.message);
                }
            });
        if (checkModules == false) {
            migrationInfo.modules.forEach(function (element) {
                modulesName.push({
                    moduleName: element.migrationModule,
                    ooModuleName: element.module,
                    ooModuleNameClass: element.module.toLowerCase(),
                    checkboxId: "checkbox" + element.migrationModule.replace("`", "").replaceAll(" ", "")
                });
            });
            var $events = $('#modules-choose-tmpl').tmpl(modulesName);
            $events.appendTo($modulesChooseTable.find('tbody'));
            var $checkboxUsers = $selectModulesToImport.find('#checkboxUsers');
            $checkboxUsers.prop("disabled", true);
            var $userscheckboxUsers = $selectModulesToImport.find('#userscheckboxUsers');
            $userscheckboxUsers.removeClass('display-none');
            checkModules = true;
        }
    }

    function enableGoogleInit(enabled) {
        $initialImportGoogleBtn.toggleClass("disabled", !enabled);

        if (enabled) {
            $initialImportGoogleBtn.on("click", initialImportGoogle);
        } else {
            $initialImportGoogleBtn.off("click");
        }
    }

    function enableNextcloudInit(enabled) {
        $initialImportNextcloudBtn.toggleClass("disabled", !enabled);

        if (enabled) {
            $initialImportNextcloudBtn.on("click", initialImportNextcloud);
        } else {
            $initialImportNextcloudBtn.off("click");
        }
    }

    function enableOwncloudInit(enabled) {
        $initialImportOwncloudBtn.toggleClass("disabled", !enabled);

        if (enabled) {
            $initialImportOwncloudBtn.on("click", initialImportOwncloud);
        } else {
            $initialImportOwncloudBtn.off("click");
        }
    }

    var numberOfSentArchives = 0;
    var totalSizeArchives = 0;
    var sizeOfSentArchives = 0;

    function bindUploader() {
        var pathToArchives = "";
        $archivesUploader.fileupload({
            url: Common.basePath + "migration/Upload",
            dataType: "json",
            autoUpload: true,
            singleFileUploads: true,
            sequentialUploads: true,
            maxChunkSize: 5 * 1024 * 1024,
            chunkdone: function (e, data) {
                showParseProgress(parseInt(Math.round(((data._progress.loaded + sizeOfSentArchives) / totalSizeArchives) * 100)));
            },
            add: function (evt, data) {
                switch (apiMigration) {
                    case "NextcloudMigrate":
                        enableGoogleInit(false);
                        enableOwncloudInit(false);
                        break;
                    case "GoogleWorkspace":
                        enableNextcloudInit(false);
                        enableOwncloudInit(false);
                        break;
                    case "OwncloudMigrate":
                        enableNextcloudInit(false);
                        enableGoogleInit(false);
                        break;
                }

                var filesNames = '';
                data.originalFiles.forEach(function (element) {
                    filesNames += "'" + element.name + "' ";
                });
                $archivesInput.val(filesNames);
                var file = data.files[0];
                if (/.+\.zip/.test(file.name)) {
                    $migrationProgressBox.show();
                    numberOfSentArchives++;
                    showParseProgress(0);
                    if (numberOfSentArchives == data.originalFiles.length) {
                        $migrationProgressTitle.text(window.Resource.MigrationLoadingArchive.format("1/" + data.originalFiles.length));
                        numberOfSentArchives = 0;
                        data.originalFiles.forEach(function (element) {
                            totalSizeArchives += element.size;
                        });
                    }
                    data.submit();
                } else {
                    toastr.error(window.Resource.MigrationIncorrectFileType);
                }
            },
            done: function (evt, resp) {
                apiService.post('migration/uploadComplete', resp.result).done(function (result) {
                        numberOfSentArchives++;
                        $migrationProgressTitle.text(window.Resource.MigrationLoadingArchive.format(numberOfSentArchives + "/" + resp.originalFiles.length));
                        sizeOfSentArchives += resp.files[0].size;
                        showParseProgress(Math.round((sizeOfSentArchives / totalSizeArchives) * 100));
                        pathToArchives = result.path;
                        if (numberOfSentArchives == resp.originalFiles.length) {
                            document.getElementById("archivesUploader").setAttribute('disabled', 'true');
                            $migrationProgressTitle.text(window.Resource.MigrationLoadingIsComplete);
                            showParseProgress(parseInt(100));
                            lastProgress = 0;
                            numberOfSentArchives = 0;
                            totalSizeArchives = 0;
                            sizeOfSentArchives = 0;
                            $initialImportNext.removeClass("disabled");
                            $initialImportNext.click(function () {
                                showParseProgress(parseInt(0));
                                apiService.post('migration/' + apiMigration, {
                                        path: pathToArchives,
                                    })
                                    .fail(function (err) {
                                        console.log('init/' + apiMigration + ' error');
                                        console.log(err);
                                    });
                                interimStatusMigration();
                            });
                        }
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

    function showCheckUSersForImport() {
        generateBodyCheckUsersForImport();
        $migrationProgressBox.hide();
        $checkUsersForImport.show();
        $choiceOfMigration.hide();
    }

    function uploadToServerNext() {
        generateBodyCheckUsersForImport();
        $migrationProgressBox.hide();
        $checkUsersForImport.show();
        $initialImport.hide();
    }

    function checkingAarchivesForCorrectness() {
        if (migrationInfo.failedArchives.length <= 0) {
            uploadToServerNext();
        } else {
            $initialImport.show();
            $migrationProgressBox.find('.margin-0').hide();
            $('#warning-incorrect-archives').show();
            $cancelUploadToServer.hide();
            $initialImportNext.show();
            $initialImportNext.removeClass('disabled');
            $initialImportNext.removeClass('nextStep');
            $backUploadToServer.show();
            $backUploadToServer.removeClass('previous-step');
            $('#download-incorrect-archives').show();
            $('#download-incorrect-archives').removeClass('p-padding-top');
            $('#download-incorrect-archives').click(function () {
                var text = "";
                migrationInfo.failedArchives.forEach(function (element) {
                    text += element + '%0D%0A';
                });
                var link = document.createElement('a');
                link.setAttribute('href', 'data:text/plain;charset=utf-8,' + text);
                link.setAttribute('download', 'Incorrect archives.csv');
                link.click();
            });
            $initialImportNext.off("click");
            $initialImportNext.on("click", uploadToServerNext);
        }
    }

    function interimStatusMigration() {
        $initialImportNext.addClass("display-none");
        $backUploadToServer.addClass("display-none");
        $cancelUploadToServer.removeClass("display-none");

        apiService.get("migration/status")
            .done(function (data) {
                var progress = data.progress ? data.progress : 0;
                showParseProgress(parseInt(progress));
                var status = data.progressStatus ? data.progressStatus : "";
                $migrationProgressTitle.text(status);
                if (data.parseResult || data.parseResult != null) {
                    migrationInfo = data.parseResult;
                    console.log(migrationInfo);
                    lastProgress = 0;
                    $backUploadToServer.off("click");
                    $backUploadToServer.on("click", function () {
                        apiService.post('migration/cancel')
                            .done(function (result) {
                                apiService.post('migration/finish', {
                                        isSendWelcomeEmail: false
                                    })
                                    .done(function (result) {
                                        window.location.reload();
                                    });
                            });
                    });
                    checkingAarchivesForCorrectness();
                } else if (canceled == false) {
                    setTimeout(interimStatusMigration, 1000);
                }
            })
            .fail(function (err) {
                console.log("migration/status error ");
                console.log(err);
            });
    }

    var lastProgress = 0;

    function interimStatus() {

        apiService.get("migration/status")
            .done(function (data) {
                var progress = lastProgress == 0 && data.progress == 100 ? 0 : data.progress;
                showMigrateProgress(parseInt(progress));
                var status = data.progressStatus ? data.progressStatus : "";
                $migrationProgressTitleMigrate.text(status);
                if (data.progress == 100 && data.migrationEnded == true) {
                    $migration.hide();
                    $resultsDataImport.show();
                    $('#sendWelcomeEmail').removeClass('display-none');
                    showResultMigration();
                } else if (canceled == false) {
                    setTimeout(interimStatus, 1000);
                }
            })
            .fail(function (err) {
                console.log("migration/status error ");
                console.log(err);
            });
    }

    function downloadLogs() {
        apiService.get("migration/getBaseUrlDownload")
            .done(function (data) {
                var link = document.createElement('a');
                const href = data.baseUri + "/api/2.0/migration/logs";
                link.setAttribute('href', href);
                link.setAttribute('download', 'migration.log.txt');
                link.click();
            });
    }

    function showResultMigration() {
        $('#success-message').removeClass('display-none');
        switch (apiMigration) {
            case "NextcloudMigrate":
                $('#success-message').text(window.Resource.MigrationCompleted.format(window.Resource.MigrationNextcloud));
                break;
            case "GoogleWorkspace":
                $('#success-message').text(window.Resource.MigrationCompleted.format(window.Resource.MigrationGoogleWorkspace));
                break;
            case "OwncloudMigrate":
                $('#success-message').text(window.Resource.MigrationCompleted.format(window.Resource.MigrationOwncloud));
                break;
        }
    }

    function showMigrateProgress(progress) {
        $migrationProgressBoxMigrate.show();
        if (typeof progress != "undefined") {
            if (progress >= lastProgress) {
                $migrationProgressValueMigrate.css({
                    "width": progress + '%'
                });
            }
            lastProgress = progress;
            $migrationProgressTextMigrate.text(' ' + progress + '% ');
        }
    }

    function showParseProgress(progress) {
        $migrationProgressBox.show();
        if (typeof progress != "undefined") {
            if (progress >= lastProgress) {
                $migrationProgressValue.css({
                    "width": progress + '%'
                });
            }
            lastProgress = progress;
            $migrationProgressText.text(' ' + progress + '% ');
        }
    }

    var $pagination;


    var $pageListTop;

    var $pageListBottom;


    var $userTablePagination;

    var activeTablePage = 1;

    function generateMassShowOnPage(usersLength) {
        var showOnPageList = [];
        if (usersLength > 10) {
            showOnPageList.push({
                item: 10,
                itemId: 'option0'
            });
        }
        if (usersLength > 25) {
            showOnPageList.push({
                item: 25,
                itemId: 'option1'
            });
        }
        if (usersLength > 50) {
            showOnPageList.push({
                item: 50,
                itemId: 'option2'
            });
        }
        if (usersLength > 100) {
            showOnPageList.push({
                item: 100,
                itemId: 'option3'
            });
        }
        showOnPageList.push({
            item: "All",
            itemId: 'option4'
        });
        return showOnPageList;
    }

    var notesOnPage = null;

    function startPagination(users, $tableTmpl, without) {
        $pageListTop = $pagination.find('#pageListTop');
        $pageListBottom = $pagination.find('#pageListBottom');
        $userTablePagination = $pagination.find('#user-table-pagination');
        var showOnPageList = generateMassShowOnPage(users.length);

        notesOnPage = notesOnPage == null ? showOnPageList[0].item : notesOnPage;

        $pageListTop.find('select').empty();
        var $events = $('#page-selector-tmpl').tmpl(showOnPageList);
        $events.appendTo($pageListTop.find('select'));

        $pageListBottom.find('select').empty();
        var $events2 = $('#page-selector-tmpl').tmpl(showOnPageList);
        $events2.appendTo($pageListBottom.find('select'));

        var $showOnPageBottom = $pageListBottom.find('select');
        $showOnPageBottom.change(function () {
            var preElement = showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) != undefined ? showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) : showOnPageList[showOnPageList.length - 1];
            $(this).find('#' + preElement.itemId).prop("selected", false);
            $showOnPageTop.find('#' + preElement.itemId).prop("selected", false);
            notesOnPage = $(this).val() == "All" ? users.length : $(this).val();
            var currentElement = showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) != undefined ? showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) : showOnPageList[showOnPageList.length - 1];
            $(this).find('#' + currentElement.itemId).prop("selected", true);
            $showOnPageTop.find('#' + currentElement.itemId).prop("selected", true);
            pagination(users, $tableTmpl);
        });
        var $showOnPageTop = $pageListTop.find('select');
        $showOnPageTop.change(function () {
            var preElement = showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) != undefined ? showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) : showOnPageList[showOnPageList.length - 1];
            $(this).find('#' + preElement.itemId).prop("selected", false);
            $showOnPageBottom.find('#' + preElement.itemId).prop("selected", true);
            notesOnPage = $(this).val() == "All" ? users.length : $(this).val();
            var currentElement = showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) != undefined ? showOnPageList.find(function (item) {
                return item.item == notesOnPage;
            }) : showOnPageList[showOnPageList.length - 1];
            $(this).find('#' + currentElement.itemId).prop("selected", true);
            $showOnPageBottom.find('#' + currentElement.itemId).prop("selected", true);
            pagination(users, $tableTmpl);
        });
        pagination(users, $tableTmpl, without);
    }

    function pagination(users, $tableTmpl, without) {
        var tempUsersLists = [];
        var listOfPages = [];
        notesOnPage = notesOnPage == "All" ? users.length : notesOnPage;
        for (var i = 0; i < users.length / notesOnPage; i++) {
            tempUsersLists.push(users.slice(i * notesOnPage, i * notesOnPage + notesOnPage));
            listOfPages.push({
                item: i + 1,
                itemId: 'page' + i
            });
        }

        $pageListTop.find('ul').empty();
        var $events3 = $('#pageListTmpl').tmpl(listOfPages);
        $events3.appendTo($pageListTop.find('ul'));

        $pageListBottom.find('ul').empty();
        var $events4 = $('#pageListTmpl').tmpl(listOfPages);
        $events4.appendTo($pageListBottom.find('ul'));

        if (listOfPages.length < 2) {
            $pageListTop.find('ul').hide();
            $pageListBottom.find('ul').hide();
            $pageListTop.find('#next-top').hide();
            $pageListBottom.find('#next-bottom').hide();
        }

        for (var i = 0; i < users.length / notesOnPage; i++) {
            var $clickTop = $pageListTop.find('#' + listOfPages[i].itemId);
            var $clickBottom = $pageListBottom.find('#' + listOfPages[i].itemId);
            $clickTop.click(function (x) {
                return function () {
                    var $preActiveTablePageTop = $pageListTop.find('#page' + (activeTablePage - 1));
                    $preActiveTablePageTop.removeClass('active-button-page');
                    $preActiveTablePageTop.addClass('button-page-list');
                    var $preActiveTablePageBottom = $pageListBottom.find('#page' + (activeTablePage - 1));
                    $preActiveTablePageBottom.removeClass('active-button-page');
                    $preActiveTablePageBottom.addClass('button-page-list');
                    activeTablePage = x + 1;
                    var $tableContent = $userTablePagination.find('tbody');
                    $tableContent.empty();
                    var $eventsTable = $tableTmpl.tmpl(tempUsersLists[x]);
                    $eventsTable.appendTo($tableContent);
                    tempUsersLists[x].forEach(function (element) {
                        if (element.shouldImport && element.email) {
                            $view.find('#' + element.checkboxId).prop('checked', true);
                        } else {
                            $view.find('#' + element.checkboxId).prop('checked', false);
                        }
                        if (without) {
                            addCheckboxEvent($('#allUsersWithoutEmailCheckbox'), element, users.length, without);
                            addButtonEventWithoutEmails(element);
                        } else {
                            addCheckboxEvent($('#allUsersCheckbox'), element, users.length, without);
                        }
                    });
                    $(this).removeClass('button-page-list');
                    $(this).addClass('active-button-page');
                    $pageListBottom.find('#' + listOfPages[x].itemId).removeClass('button-page-list');
                    $pageListBottom.find('#' + listOfPages[x].itemId).addClass('active-button-page');
                };
            }(i));
            $clickBottom.click(function (x) {
                return function () {
                    var $preActiveTablePageTop = $pageListTop.find('#page' + (activeTablePage - 1));
                    $preActiveTablePageTop.removeClass('active-button-page');
                    $preActiveTablePageTop.addClass('button-page-list');
                    var $preActiveTablePageBottom = $pageListBottom.find('#page' + (activeTablePage - 1));
                    $preActiveTablePageBottom.removeClass('active-button-page');
                    $preActiveTablePageBottom.addClass('button-page-list');
                    activeTablePage = x + 1;
                    var $tableContent = $userTablePagination.find('tbody');
                    $tableContent.empty();
                    var $eventsTable = $tableTmpl.tmpl(tempUsersLists[x]);
                    $eventsTable.appendTo($tableContent);
                    tempUsersLists[x].forEach(function (element) {
                        if (element.shouldImport && element.email) {
                            $view.find('#' + element.checkboxId).prop('checked', true);
                        } else {
                            $view.find('#' + element.checkboxId).prop('checked', false);
                        }
                        if (without) {
                            addCheckboxEvent($('#allUsersWithoutEmailCheckbox'), element, users.length, without);
                            addButtonEventWithoutEmails(element);
                        } else {
                            addCheckboxEvent($('#allUsersCheckbox'), element, users.length, without);
                        }
                    });
                    $(this).removeClass('button-page-list');
                    $(this).addClass('active-button-page');
                    $pageListTop.find('#' + listOfPages[x].itemId).removeClass('button-page-list');
                    $pageListTop.find('#' + listOfPages[x].itemId).addClass('active-button-page');
                };
            }(i));
        }
        $pageListTop.find(`#page0`).click();
        $pageListTop.find('#next-top').click(function () {
            $pageListTop.find('#page' + activeTablePage).click();
        });
        $pageListBottom.find('#next-bottom').click(function () {
            $pageListBottom.find('#page' + activeTablePage).click();
        });
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);