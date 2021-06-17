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


window.HealthCheckManager = function ($, apiService, loaderService) {

    var waitStatusTimeout = 1000,
        loadedSuccessfull = true,
        isServicesOK = null,
        isDiskStorageOK = null,
        serverServicesList = [],
        portsList = [];

    function init() {
        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);
        bindIsHealthCheckOkTriggerCallback();

        // Common
        $(document).one("ajaxStop", function () {
            loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
            if (loadedSuccessfull) {
                $("#formContentHealth").removeClass("display-none");
                getServerPortStatusesList();
            } else {
                $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
            }
            $(window).trigger("rightSideReady", null);
        });

        getServerPortsList();
        getServerServicesList(getServerServicesListCallback);
        getNotifySettings();
        getContactsNotifyList();
        getStorageSpace(getStorageSpaceCallback);
        bindEvents();
    }

    function isHealthCheckOK() {
        if ($("#formContentHealth").length > 0) return;
        bindIsHealthCheckOkTriggerCallback();
        getServerServicesList(function (res) {
            try {
                isServicesOK = true;
                var items = [],
                    response = JSON.parse(res);
                response.services.forEach(function (el) {
                    if (el.code == 0)// || el.code == 1)//0 - error, 1 - off
                    {
                        isServicesOK = false;
                    }
                });
                $(window).trigger("isHealthCheckOKCallback", null);
            }
            catch (ex) {
                console.log(ex, res);
            }
        });

        getStorageSpace(function (res) {
            isDiskStorageOK = true;
            var response = JSON.parse(res);
            switch (response.code) {
                case 0:
                    isDiskStorageOK = false;
                    break;
                case 1:
                    if (response.freeSpaceInBytes < 1024 || response.freeSpaceInBytes < response.driveSpaceThreashold) // < 1MB
                    {
                        isDiskStorageOK = false;
                    }
                    break;
            }
            $(window).trigger("isHealthCheckOKCallback", null);
        });
    }

    function bindEvents() {
        // Services
        $('#serverServicesTable').on('click', '.btn-action-service', function() {
            var $this = $(this),
                service = $this.parents('tr').attr('data-title');

            //if ($this.hasClass('error')) { return; }

            $this.addClass('disable');
            $this.prop('disabled', true);

            if ($this.hasClass('off')) {
                startService(service);
            } else if ($this.hasClass('on')) {
                restartService(service);
            } else if ($this.hasClass('error')) {

                restartService(service);
            }
        });

        // Logs
        var startDate = new Date(),
            endDate = new Date();
        startDate.setDate(startDate.getDate() - 1);

        $('#startPeriodLog').datepicker({
            beforeShow: function (input, inst) {
                var widget = $(inst).datepicker('widget');
                widget.css('margin-left', $('#startPeriodLog').outerWidth() - widget.outerWidth());
            }
        });
        $('#startPeriodLog').datepicker('setDate', startDate);

        $('#endPeriodLog').datepicker({
            beforeShow: function (input, inst) {
                var widget = $(inst).datepicker('widget');
                widget.css('margin-left', $('#endPeriodLog').outerWidth() - widget.outerWidth());
            }
        });

        $('#endPeriodLog').datepicker('setDate', endDate);

        $('#savePeriodLog').on('click', getLogsServer);

        // Clear Cache
        $('#clearCache').on('click', clearCacheServer);

        // Notify Settings
        $("#switchNotifySettings").on("click", function() {
            var $btn = $("#switchNotifySettings"),
                isNotify = $btn.attr("data-value"),
                typeNotify = $("#typeNotification").val();

            setNotifySettings(isNotify == 'false', typeNotify);
        });

        $("#typeNotification").on("change", function() {
            var typeNotify = $("#typeNotification").val();
            setNotifySettings(true, typeNotify);
        });

        $("#emailNotifyList, #phoneNotifyList").on("click", ".remove-btn-icon", removeContactNotify);

        PhoneController.Init($("#newPhoneNotify"), window.Countries, ['US']);

        $("#addEmailNotify").on("click", addEmailNotify);
        $("#addPhoneNotify").on("click", addPhoneNotify);
    }

    function bindIsHealthCheckOkTriggerCallback() {
        $(window).on("isHealthCheckOKCallback", function () {
            if (isServicesOK != null && isDiskStorageOK != null) {
                $(".side-nav .nav-link.nav-healthcheck").addClass(isServicesOK == true && isDiskStorageOK == true ? "with-green-mark" : "with-red-mark");
            }
        });
    }

    function getServerPortsList() {
        apiService.get('HealthCheck/GetPortList')
            .done(getServerPortsCallback)
            .fail(function (err) {
                loadedSuccessfull = false;
                console.log(err);
            });
    }

    function getServerPortStatusesList() {
        loaderService.showFormBlockLoader($('#serverAlertsTable'));
        apiService.get('HealthCheck/GetPortStatus')
            .done(getServerPortsCallback)
            .fail(function (err) {
                toastr.error(Resource.OperationFailedError);
            })
            .always(function () {
                loaderService.hideFormBlockLoader($('#serverAlertsTable'));
            });
    }
    function getPortByNumber(number) {
        for (var i = 0, n = portsList.length; i < n; i++) {
            if (portsList[i].number == number) return portsList[i];
        }
        return null;
    }

    function getServerPortsCallback(res) {
        try {
            var isFirstTime = portsList.length == 0;
                response = JSON.parse(res);

            response.forEach(function (el) {
                if (isFirstTime) {
                    portsList.push({
                        number: el.Number,
                        name: el.Name + ' ' + el.Number,
                        text: el.Description,
                        status: el.PortStatus || null,
                        statusText: el.Status || null
                    });
                } else {
                    var curPort = getPortByNumber(el.Number);
                    if (curPort != null) {
                        curPort.status = el.PortStatus;
                        curPort.statusText = el.Status; //StatusDescription ?
                    }
                }
            });
            $("#serverAlertsTable tbody").replaceWith($("#serverAlertsTmpl").tmpl({ items: portsList }));
        }
        catch (ex) {
            console.log(ex, res);
        }
    }

    function getServerServicesList(successCallback) {
        apiService.get('HealthCheck/GetStates')
            .done(successCallback)
            .fail(function (err) {
                loadedSuccessfull = false;
                console.log(err);
            });
    }

    function getServerServicesListCallback(res) {
        try {
            serverServicesList = [];
            isServicesOK = true;

            var response = JSON.parse(res);
            response.services.forEach(function (el) {
                if (el.code == 0)// || el.code == 1)//0 - error, 1 - off
                {
                    isServicesOK = false;
                }

                serverServicesList.push({
                    name: el.title,
                    code: el.code,
                    title: el.serviceName,
                    status: el.status,
                    message: el.message
                });
            });
            $('#serverServicesTable tbody').replaceWith($('#serverServicesTmpl').tmpl({ items: serverServicesList }));
            $(window).trigger("isHealthCheckOKCallback", null);
            setTimeout(function() { getServerServicesList(getServerServicesListCallback) }, 10000);
        }
        catch (ex) {
            console.log(ex, res);
            loadedSuccessfull = false;
        }
    }

    function startService(service) {
        apiService.post('HealthCheck/StartService?service=' + service, { service: service })
            .done(function (res) {
                waitServiceStatus(service);
            })
            .fail(function (err) {
                toastr.error(Resource.OperationFailedError);
            });
    }

    function restartService(service) {
        var opts = { service: service };

        $('#serverServicesTable').find('tr[data-title=' + service + ']').find("button.btn-action-service")
            .addClass("disable")
            .removeClass("on").addClass("off");

        apiService.post('HealthCheck/StopService?service=' + opts.service, opts)
            .done(function(res) {
                var $server = $('#serverServicesTable').find('tr[data-title=' + service + ']'),
                    response = JSON.parse(res);

                $server.find('.status').html(response.status).removeClass('run error').addClass('stopped');
                $server.find('.helpCenterSwitcher').hide();
            })
            .fail(function (err) { toastr.error(Resource.OperationFailedError); });
    }

    function findServiceByTitle(service) {
        for (var i = 0, n = serverServicesList.length; i < n; i++) {
            if (serverServicesList[i].title == service)
                return serverServicesList[i];
        }
        return null;
    }

    function waitServiceStatus(service) {

        apiService.get('HealthCheck/GetStatus?service=' + service)
            .done(function (res) {
                var $server = $("#serverServicesTable").find("tr[data-title=" + service + "]"),
                    response = JSON.parse(res);

                switch (response.code) {
                    case 0:
                    case 2:
                    case 3:
                        var serviceObj = findServiceByTitle(service);
                        if (serviceObj == null) return;

                        serviceObj.code = response.code;
                        serviceObj.status = response.status;
                        serviceObj.message = response.message;

                        $server.replaceWith($("#serverServiceItemTmpl").tmpl(serviceObj));
                        break;
                    case 1:
                        $server.find("button.btn-action-service").addClass("disable").prop("disabled", true);
                        $server.find(".status").html(response.status).removeClass("stopped error");

                        setTimeout(function () { waitServiceStatus(service); }, waitStatusTimeout);
                        break;
                }
            })
            .fail(function (err) {
                toastr.error(Resource.OperationFailedError);
            });
    }

    function getLogsServer() {
        var startDate = $.datepicker.formatDate('yy-mm-dd', $('#startPeriodLog').datepicker('getDate')),
            endDate = $.datepicker.formatDate('yy-mm-dd', $('#endPeriodLog').datepicker('getDate'));

        location.href = Common.basePath + 'HealthCheck/DownloadLogs?startDate=' + startDate + '&endDate=' + endDate;
    }

    function clearCacheServer() {

        apiService.get('HealthCheck/ClearCache')
            .done(function (res) {
                var response = JSON.parse(res);
                switch (response.code) {
                    case 0:
                        toastr.error(Resource.OperationFailedError);
                        break;
                    case 1:
                        toastr.success(Resource.OperationSucceededMsg);
                        break;
                }
            })
            .fail(function (err) { toastr.error(Resource.OperationFailedError); });
    }

    function getNotifySettings() {
        apiService.get('HealthCheck/GetNotifySettings')
            .done(function (res) {
                try {
                    var response = JSON.parse(res);
                    if (response.sendEmailSms == "0") {
                        $('.notify-block.email').show();
                        $('.notify-block.phone').hide();
                    } else if (response.sendEmailSms == "1") {
                        $('.notify-block.email').hide();
                        $('.notify-block.phone').show();
                    } else if (response.sendEmailSms == "2") {
                        $('.notify-block.email').show();
                        $('.notify-block.phone').show();
                    }

                    switch (response.code) {
                        case 0:
                            console.log(response);
                            break;
                        case 1:
                            var type = response.sendNotify ? 'on' : 'off';
                            $('#typeNotification').val(response.sendEmailSms);
                            $('#typeNotification').tlcombobox();
                            $('#switchNotifySettings').addClass(type).attr('data-value', response.sendNotify);
                            break;
                    }
                }
                catch (ex) {
                    console.log(ex, res);
                    loadedSuccessfull = false;
                }
            })
            .fail(function (err) {
                loadedSuccessfull = false;
                console.log(err);
            });
    }

    function setNotifySettings(sendNotify, sendEmailSms) {
        var opts = {
            sendNotify: sendNotify,
            sendEmailSms: sendEmailSms
        };

        apiService.post('HealthCheck/SetNotifySettings?sendNotify=' + opts.sendNotify + '&sendEmailSms=' + opts.sendEmailSms, opts)
            .done(function (res) {
                try {
                    var response = JSON.parse(res);
                    if (sendEmailSms == "0") {
                        $('.notify-block.email').show();
                        $('.notify-block.phone').hide();
                    } else if (sendEmailSms == "1") {
                        $('.notify-block.email').hide();
                        $('.notify-block.phone').show();
                    } else if (sendEmailSms == "2") {
                        $('.notify-block.email').show();
                        $('.notify-block.phone').show();
                    }

                    switch (response.code) {
                        case 0:
                            toastr.error(Resource.OperationFailedError);
                            break;
                        case 1:
                            $('#typeNotification').val(sendEmailSms);

                            if (sendNotify) {
                                $('#switchNotifySettings').removeClass('off').addClass('on').attr('data-value', sendNotify);
                            } else {
                                $('#switchNotifySettings').removeClass('on').addClass('off').attr('data-value', sendNotify);
                            }
                            toastr.success(Resource.OperationSucceededMsg);
                            break;
                    }
                }
                catch (ex) {
                    console.log(ex, res);
                    loadedSuccessfull = false;
                }
            })
            .fail(function (err) { toastr.error(Resource.OperationFailedError); });
    }

    function getContactsNotifyList() {

        apiService.get('HealthCheck/GetNotifiers')
            .done(function (res) {
                var response = JSON.parse(res);
                $("#contactsNotifyListTmpl").tmpl({ items: response.emails }).appendTo("#emailNotifyList tbody");
                $("#contactsNotifyListTmpl").tmpl({ items: response.numbers }).appendTo("#phoneNotifyList tbody");
            })
            .fail(function (err) {
                loadedSuccessfull = false;
                console.log(err);
            });
    }

    function addEmailNotify() {
        $(".notify-block .email-regex-error").hide();
        $(".notify-block .email-dublicate-error").hide();

        var email = $("#newEmailNotify").val().trim(),
            emails = [];

        $("#emailNotifyList .contact span").each(function(i, el) {
            emails.push($(el).attr("title"));
        });
        if (emails.indexOf(email) > -1) {
            $(".notify-block .email-dublicate-error").show();
            return;
        }

        if (Common.isValidEmail(email)) {
            apiService.post('HealthCheck/AddEmail?email=' + email, { email: email })
                .done(function (res) {
                    var response = JSON.parse(res);
                    switch (response.code) {
                        case 0:
                            toastr.error(Resource.OperationFailedError);
                            break;
                        case 1:
                            $("#newEmailNotify").val('');
                            $("#emailNotifyList").append($("#contactsNotifyListTmpl").tmpl({ items: [email] }));
                            toastr.success(Resource.OperationSucceededMsg);
                            break;
                    }
                })
                .fail(function (err) { toastr.error(Resource.OperationFailedError); });
        } else {
            $('.notify-block .email-regex-error').show();
        }
    }

    function addPhoneNotify() {
        $('.notify-block .phone-regex-error').hide();
        $('.notify-block .phone-dublicate-error').hide();

        var phone = $('#newPhoneNotify').val().trim(),
            phones = [];

        $('#phoneNotifyList .contact span').each(function(i, el) {
            phones.push($(el).attr('title'));
        });
        if (phones.indexOf(phone) > -1) {
            $('.notify-block .phone-dublicate-error').show();
            return;
        }

        if (Common.isValidPhone(phone) && phone) {
            apiService.post('HealthCheck/AddPhone?phone=' + phone, { phone: phone })
                .done(function (res) {
                    var response = JSON.parse(res);
                    switch (response.code) {
                        case 0:
                            toastr.error(response.status);
                            break;
                        case 1:
                            $('#phoneNotifyList').append($('#contactsNotifyListTmpl').tmpl({ items: [phone] }));
                            PhoneController.Init($('#newPhoneNotify'), window.Countries, ['US']);
                            toastr.success(Resource.OperationSucceededMsg);
                            break;
                    }
                })
                .fail(function (err) { toastr.error(Resource.OperationFailedError); });
        } else {
            $('.notify-block .phone-regex-error').show();
        }
    }

    function removeContactNotify() {
        var $str = $(this).parents('tr'),
            contact = $str.attr('data-contact');

        if (Common.isValidEmail(contact)) {
            apiService.post('HealthCheck/RemoveEmail?email=' + contact, { email: contact })
                .done(function (res) {
                    $str.remove();
                    toastr.success(Resource.OperationSucceededMsg);
                })
                .fail(function (err) { toastr.error(Resource.OperationFailedError); });
        }

        if (Common.isValidPhone(contact)) {
            apiService.post('HealthCheck/RemovePhone?phone=' + contact, { phone: contact })
                .done(function (res) {
                    $str.remove();
                    toastr.success(Resource.OperationSucceededMsg);
                })
                .fail(function (err) { toastr.error(Resource.OperationFailedError); });
        }
    }

    function getStorageSpace(successCallback) {
        apiService.get('HealthCheck/GetDriveSpace')
            .done(successCallback)
            .fail(function (err) { loadedSuccessfull = false; });
    }

    function getStorageSpaceCallback(res) {
        isDiskStorageOK = true;
        var response = JSON.parse(res);
        switch (response.code) {
            case 0:
                $("#freeStorageSpace, #totalStorageSpace").text("...").addClass("warning");

                $("#warningStorageSpace>span:first").text(Resource.HealthCheckFreeSpaceUnexpectedError);
                $("#storageSpaceErrorHelper>p:first").text(Resource.HealthCheckFreeSpaceUnexpectedErrorHelpText);
                $("#warningStorageSpace").show();

                isDiskStorageOK = false;
                break;
            case 1:
                $("#freeStorageSpace").text(response.freeSpace);
                $("#totalStorageSpace").text(response.totalSpace);

                if (response.driveName) { }

                if (response.freeSpaceInBytes < 1024) { // < 1MB
                    $("#freeStorageSpace").addClass("warning");

                    $("#warningStorageSpace>span:first").text(Resource.HealthCheckFreeSpaceExceededError);
                    $("#storageSpaceErrorHelper>p:first").text(Resource.HealthCheckFreeSpaceExceededErrorHelpText);
                    $("#warningStorageSpace").show();

                    isDiskStorageOK = false;
                }
                else if (response.freeSpaceInBytes < response.driveSpaceThreashold) {
                    $("#freeStorageSpace").addClass("warning");

                    $("#warningStorageSpace>span:first").text(Resource.HealthCheckFreeSpaceTooFewError);
                    $("#storageSpaceErrorHelper>p:first").text(Resource.HealthCheckFreeSpaceTooFewErrorHelpText);
                    $("#warningStorageSpace").show();

                    isDiskStorageOK = false;
                            
                }
                break;
        }
        $(window).trigger("isHealthCheckOKCallback", null);
    }

    return {
        init: init,
        isHealthCheckOK: isHealthCheckOK
    };
}($, window.ApiService, window.LoaderService);
