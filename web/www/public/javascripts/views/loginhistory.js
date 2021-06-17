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


window.LoginHistoryView = function($, apiService, loaderService) {

    var generateHash = '#generate';
    var loginEventTmpl = 'loginEventTmpl';

    var $view = $('#loginhistory-view');
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
    var $onlineUserTmpl = $('#online-user-tmpl');
    var $onlineUsersList = $('#online-users-list');
    var $onlineUsersBox = $('#online-users-box');
    var renderOnlineUsersBlock = true;
    var renderUserTimeout = 5000;

    var settings = null;
    var url = null;
    var socketIO = null;

    var users;

    function init() {
        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);
        if (window.location.hash == generateHash) {
            createLoginHistoryReport();
            return;
        }
        function getSocketConfig() {
        apiService.get('loginHistory/getSocketConfig', false)
                    .done(function(res) {
                        if (res.url.length > 1) {
                        url =  res.url;
                        }
                        else return;
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                       return;
                    });
                }
        getSocketConfig();
        if (url != null){
            var socket = new ASC.SocketIO.init(url);
        }
        if (socket != null){
        socketIO = ASC.SocketIO.Factory.counters
            .on('renderOnlineUsers', renderOnlineUsers)
            .on('renderOnlineUser', renderOnlineUser)
            .on('renderOfflineUser', renderOfflineUser);
        }
        getData();

    }

    function createLoginHistoryReport() {
        $generateText.removeClass("display-none");

        apiService.post('loginHistory/createReport')
            .done(function (result) {
                if (!result) {
                    showErrorMessage(window.Resource.OperationFailedError);
                    return;
                }

                location.href = result.data;
            })
            .error(function() {
                showErrorMessage(window.Resource.OperationFailedError);
            })
            .complete(function (jqXHR, textStatus) {
                $generateText.addClass("display-none");
            });

        return false;
    }

    function saveLoginHistorySettings() {
        if($(this).hasClass("disabled"))
            return;

        var val = parseInt($lifetimeInput.val());

        if (isNaN(val) || val <= 0 || val > settings.maxLifeTime) {
            $lifetimeInput.addClass("error");
            return;
        }

        $lifetimeInput.removeClass("error");

        settings.loginHistoryLifeTime = val;

        apiService.post('loginHistory/saveSettings', { settings: settings })
            .done(function (result) {
                if (!result) {
                    showErrorMessage(window.Resource.OperationFailedError);
                    return;
                }

                toastr.success(window.Resource.OperationSucceededMsg);
            })
            .error(function() {
                showErrorMessage(window.Resource.OperationFailedError);
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
            var $events = $('#' + loginEventTmpl).tmpl(events);
            $events.appendTo($eventsTable.find('tbody'));

            $lifetimePeriod.show();
            $downloadReportText.show();
            $eventsTable.show();

            $eventsTableCount.text(events.length);
            $eventsTableDscr.show();

            $downloadReportBtn.css('display', 'inline-block').click(createLoginHistoryReport);
        } else {
            $emptyScreen.show();

            renderOnlineUsersBlock = false;
            $onlineUsersBox.hide();
        }

        settings = stngs;

        $lifetimeInput.val(stngs.loginHistoryLifeTime).prop("disabled",false).on('propertychange input', function () {
            $(this).val($(this).val().replace(/[^\d]+/g, ''));
        });

        $saveSettingsBtn.removeClass("disabled").click(saveLoginHistorySettings);

        $view.removeClass("display-none");
    }

    function getData(callback) {
        async.parallel([
            function(cb) {
                apiService.get('loginHistory/getEvents', false)
                    .done(function(res) {
                        cb(null, res);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        cb(textStatus);
                    });
            },
            function(cb) {
                apiService.get('loginHistory/getSettings', false)
                    .done(function(res) {
                        cb(null, res);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        cb(textStatus);
                    });
            },
            function (cb) {
                if(socketIO != null) socketIO.emit('renderOnlineUsers');
                cb(null);
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

    function renderOnlineUsers(usersDictionary) {
        users = getAllUsers();
        var onlineUsers;
        if (typeof users === "object") {
            onlineUsers = getUsers(users, usersDictionary);
        }
        else if (typeof users === "string")
        {
            return showErrorMessage(users);
        }

        if (renderOnlineUsersBlock && onlineUsers.length) {
            var $onlineUsers = $onlineUserTmpl.tmpl(onlineUsers);
            $onlineUsersList.html($onlineUsers);

            $onlineUsersBox.show();
        } else {
            $onlineUsersBox.hide();
        }
    }

    var renderOfflineUserTimeouts = {};

    function renderOnlineUser(userId) {
        if (typeof renderOfflineUserTimeouts[userId] !== "undefined") {
            clearTimeout(renderOfflineUserTimeouts[userId]);
            delete renderOfflineUserTimeouts[userId];
        } else {
            var findedUser = findUser(users, userId);
            if (findedUser == null) return;
            var user = {
                id: userId,
                displayName: findedUser.displayName,
                link: findedUser.profileUrl,
                firstConnection: new Date()
            }
            user.presenceDuration = getPresenceDuration(user.firstConnection);
            var $user = $onlineUserTmpl.tmpl(user);
            $onlineUsersList.append($user);
            colorFade($user,'#83e281', renderUserTimeout); 
        }
    }

    function renderOfflineUser(userId) {
        renderOfflineUserTimeouts[userId] = setTimeout(function () {
            var $user = $onlineUsersList.find('.online-user[data-userid="' + userId + '"]');
            colorFade($user, '#fe4042', renderUserTimeout, function () {
                $user.remove();
            });
            delete renderOfflineUserTimeouts[userId];
        }, 2000);
    }


    function getUsers(users, usersDictionary) {
        var onlineUsers = [];
        var onlineUsersDictionary = usersDictionary;
        for (var userId in onlineUsersDictionary){
            var findedUser = findUser(users, userId);
            if (findedUser == null) continue;
            var user = {
                id: userId,
                firstConnection: onlineUsersDictionary[userId].FirstConnection,
                displayName: findedUser.displayName,
                link: findedUser.profileUrl
            }
            user.presenceDuration = getPresenceDuration(user.firstConnection);
            onlineUsers.push(user);
        }
        return onlineUsers;
    }

    function getPresenceDuration(firstConnectionTime) {
        var now = new Date();
        var firstConnection = new Date(firstConnectionTime);

        var diff = toUtcDate(new Date(now - firstConnection));

        var hours = diff.getHours();
        var minutes = diff.getMinutes();

        if (hours == 0 && minutes == 0) return '';

        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;

        return hours + ':' + minutes;
    }

    function toUtcDate(date) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    }

   function colorFade ($box, color, tiemout, cb) {
        return ($box.css({ backgroundColor: color, borderColor: color }).animate(
            { backgroundColor: "#ffffff" },
            tiemout,
            function() {
                $box.css({ backgroundColor: "", borderColor: "" });
                if (cb) {
                    cb();
                }
            }));
    };

    function getAllUsers (){
        var response;
        apiService.get('loginHistory/getUserInfo', false)
                    .done(function(res) {
                        response = res; 
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        response = textStatus;
                    });
        return response;
    }

    function findUser(users, id) {
        var findedUsers = users.filter(function (c) {
            return c.id === id;
        });
        return findedUsers[0];
    }

    function showErrorMessage(err) {
        toastr.error(err);
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);