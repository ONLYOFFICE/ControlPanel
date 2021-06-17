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


window.AuditTrailView = function($, apiService, loaderService) {

    var generateHash = '#generate';
    var auditEventTmpl = 'auditEventTmpl';

    var $view = $('#audittrail-view');
    var $lifetimePeriod = $view.find('#lifetime-period');
    var $lifetimeInput = $view.find('#lifetime-input');
    var $saveSettingsBtn = $view.find('#save-settings-btn');
    var $downloadReportText = $view.find('#download-report-text');
    var $eventsTable = $view.find('#events-table');
    var $eventsTableDscr = $view.find('#events-table-dscr');
    var $eventsTableCount = $eventsTableDscr.find('span');
    var $downloadReportBtn = $view.find('#download-report-btn');
    var $generateText = $view.find('#generate-text');
    var $emptyScreen = $view.find('#empty-screen');

    var settings = null;

    function init() {
        if (window.location.hash == generateHash) {
            createAuditReport();
            return;
        }

        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);

        async.parallel([
            function(cb) {
                apiService.get('auditTrail/getEvents', false)
                    .done(function(res) {
                        cb(null, res);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        cb(textStatus);
                    });
            }, function(cb) {
                apiService.get('loginHistory/getSettings', false)
                    .done(function(res) {
                        cb(null, res);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        cb(textStatus);
                    });
            }
        ], function (textStatus, res) {
            if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

            if (textStatus != null) {
                $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
            } else {
                renderView(getPresentationEvets(res[0]), res[1]);
            }

            $(window).trigger("rightSideReady", null);
            loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
        });
    }

    function createAuditReport() {
        $generateText.removeClass("display-none");

        apiService.post('auditTrail/createReport')
            .done(function (result) {
                if (!result) {
                    toastr.error(window.Resource.OperationFailedError);
                    return;
                }

                location.href = result.data;
            })
            .error(function() {
                toastr.error(window.Resource.OperationFailedError);
            })
            .complete(function (jqXHR, textStatus) {
                $generateText.addClass("display-none");
            });

        return false;
    }

    function saveAuditSettings() {
        if($(this).hasClass("disabled"))
            return;
        
        var val = parseInt($lifetimeInput.val());

        if (isNaN(val) || val <= 0 || val > settings.maxLifeTime) {
            $lifetimeInput.addClass("error");
            return;
        }
        
        $lifetimeInput.removeClass("error");

        settings.auditTrailLifeTime = val;
        
        apiService.post('loginHistory/saveSettings', { settings: settings })
            .done(function (result) {
                if (!result) {
                    toastr.error(window.Resource.OperationFailedError);
                    return;
                }

                toastr.success(window.Resource.OperationSucceededMsg);
            })
            .error(function() {
                toastr.error(window.Resource.OperationFailedError);
            });

        return false;
    }

    function getPresentationEvets(events) {
        for (var i = 0; i < events.length; i++) {
            events[i].displayDate = Common.datetimeFormat(events[i].date);
        }

        return events;
    }

    function renderView(events, stngs) {
        if (events.length) {
            var $events = $('#' + auditEventTmpl).tmpl(events);
            $events.appendTo($eventsTable.find('tbody'));

            $lifetimePeriod.show();
            $downloadReportText.show();
            $eventsTable.show();

            $eventsTableCount.text(events.length);
            $eventsTableDscr.show();

            $downloadReportBtn.css('display', 'inline-block').click(createAuditReport);
        } else {
            $emptyScreen.show();
        }

        settings = stngs;

        $lifetimeInput.val(stngs.auditTrailLifeTime).prop("disabled",false).on('propertychange input', function () {
            $(this).val($(this).val().replace(/[^\d]+/g, ''));
        });

        $saveSettingsBtn.removeClass("disabled").click(saveAuditSettings);

        $view.removeClass("display-none");
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);