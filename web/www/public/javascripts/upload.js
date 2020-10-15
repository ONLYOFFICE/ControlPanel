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


UploadBinder = new function () {

    var init = function (fileInput, uploadFileActionUrl, params) {
        var _settings = jQuery.extend({
            onSuccess: function (data, params) {
                if (data.success) {
                    toastr.success(data.message);
                } else {
                    toastr.error(data.message);
                }
            },
            onError: function (error) {
                toastr.error(error.message);
            },
            onComplete: function () {
                Common.loader.hide();
            }
        }, params);


        $(fileInput).on("change", function () {
            var inputFile = this,
                inputFilObj = $(this);

            var formdata = new window.FormData();

            $.each(inputFile.files, function () {
                formdata.append(inputFile.name, this);
            });

            $.ajax({
                url: uploadFileActionUrl,
                type: "POST",
                data: formdata,
                dataType: 'json',
                contentType: false,
                processData: false,
                beforeSend: function () {
                    Common.loader.show();
                },
                error: _settings.onError,
                success: function (data) { _settings.onSuccess(data, params); },
                complete: _settings.onComplete
            });

            return false;
        });
    };


    return {
        init: init
    };

};