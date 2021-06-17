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


window.SearchView = function($, apiService, loaderService) {
    var $searchView = $('#searchView'),
        $searchTableView = $('#searchTableView'),
        $searchTable = $('#searchTable'),
        data = [],
        clickEv = "click"
        timeoutID = null;

    function makeRequest(path){
        return function(cb) {
            apiService.get(path, false)
            .done(function(res) {
                cb(null, res);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                cb(textStatus, null);
            });
        }
    }

    function init() {
        loaderService.showFormBlockLoader($('.layoutRightSide:first'), 0, $(".layoutBody:first").height() / 2 + 100);

        async.parallel(
            [
                makeRequest('search/setting'),
                makeRequest('search/state')
            ],
            onGetData);
    }

    function onGetData(textStatus, res){
        if (apiService.unloaded || textStatus != null && textStatus === "abort") { return; }

        if (textStatus != null) {
            $("#errorBlockTmpl").tmpl({ content: window.Resource.FetchingDataError }).appendTo('.layoutRightSide:first');
            $(window).trigger("rightSideReady", null);
        } else {
            data = res[0];

            if (data && data.length) {
                drawSettings();
            }

            var state = res[1];

            if (state && state.indices) {
                drawIndices(state.indices);
            }

            $(window).trigger("rightSideReady", null);
            loaderService.hideFormBlockLoader($('.layoutRightSide:first'));
        }
    }

    function drawSettings(){
        $("#searchTmpl").tmpl(data).prependTo($searchView);
        $searchView.removeClass("display-none");

        $(".checkBox").on(clickEv, function () {
            var $this = $(this);
            var id = $this.attr("id");
            var item = data.find(function(item){
                return item.id == id;
            });
            item.enabled = !item.enabled;
            $this.toggleClass("checked");
        });

        $("#searchView .helpCenterSwitcher").on(clickEv, function (event) {
            $(".popup_helper").hide();
            var $this = $(this);
            $this.helper({ BlockHelperID: $this.next().attr("id") });
            event.stopPropagation();
        });

        $searchView.on(clickEv, ".middle-button-container button", function() {
            loaderService.showFormBlockLoader($searchView);
            apiService.post('search/setting', { items: data },false).done(onPostData);
        });
    }

    function drawIndices(indices){
        if (!indices) return;

        $searchTableView.removeClass("display-none");

        $searchTableView.on(clickEv, ".middle-button-container button", reindex.bind(null, ""));

        if (!indices.length) return;

        $searchTable.removeClass("display-none");

        $searchTable.find("tbody").html($("#searchDataTmpl").tmpl(indices));

        $searchTable.on(clickEv, "button", function () {
            var $self = $(this);
            var id = $($self.parents("tr")[0]).attr("data-id");
            reindex(id);
        });

        timeoutID = setTimeout(checkState, 5000);
    }

    function checkState() {
        apiService.get('search/state', false)
            .done(function(res) {
                if (res && res.indices && res.indices.length) {
                    $searchTable.find("tbody").html($("#searchDataTmpl").tmpl(res.indices));
                    timeoutID = setTimeout(checkState, 5000);
                }
            });
    }

    function reindex(name) {
        clearTimeout(timeoutID);
        loaderService.showFormBlockLoader($searchTableView);
        apiService.post('search/reindex', { name: name },false).done(onReindex);
    }

    function onPostData() {
        loaderService.hideFormBlockLoader($searchView);
        toastr.success(window.Resource.ReindexSuccessMsg || window.Resource.OperationSucceededMsg);
    }

    function onReindex(res) {
        $searchTable.find("tbody").html($("#searchDataTmpl").tmpl(res.indices));
        $searchTable.toggleClass("display-none", !res.indices.length);
        loaderService.hideFormBlockLoader($searchTableView);
        toastr.success(window.Resource.ReindexSuccessMsg || window.Resource.OperationSucceededMsg);
        timeoutID = setTimeout(checkState, 5000);
    }

    return {
        init: init
    };
}($, window.ApiService, window.LoaderService);