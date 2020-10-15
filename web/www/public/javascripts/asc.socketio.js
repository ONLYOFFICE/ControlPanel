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


var link;
if (typeof ASC === "undefined")
    ASC = {};
    
ASC.SocketIO = function (hub) {
        var opts = {
            path: link,
            reconnectionAttempts: 5,
            perMessageDeflate: "false"
        }
        
        this.socket = io(hub, opts);
};

ASC.SocketIO.prototype.emit = function() {
    if (this.socket) {
        this.socket.emit.apply(this.socket, arguments);
    }
    return this;
}

ASC.SocketIO.prototype.on = function () {
    if (this.socket) {
        if (arguments[0] === "connect" && typeof arguments[1] === "function" && this.socket.connected) {
            arguments[1]();
        } else {
            this.socket.on.apply(this.socket, arguments);
        }
    }
    return this;
}

ASC.SocketIO.prototype.connect = function () {
    return this.on.call(this, "connect", arguments[0]);
}

ASC.SocketIO.prototype.reconnect_failed = function () {
    return this.on.call(this, "reconnect_failed", arguments[0]);
}

ASC.SocketIO.prototype.connected = function () {
    return this.socket && this.socket.connected;
}

ASC.SocketIO.init = function (configUrl) {

        link = configUrl;
        if (!link) return;
        var url = link;
        var lastIndexSlash = url.length - 1;
        if (url.lastIndexOf("/") === url.length - 1) {
            url = url.substring(0, lastIndexSlash);
        }
        $.ajax({
            type: "OPTIONS",
            url: url + "/?EIO=3&transport=polling",
            async: true
        });
}

ASC.SocketIO.Factory = (function () {
    var counters;

    return {
        get counters() {
            if (!counters) {
                counters = new ASC.SocketIO("/counters");
            }
            return counters;
        }
    };
})();

$(document).ready(function () {
    ASC.SocketIO.init();
});
