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


window.ConsumerStorageSettings = new function() {

    var encryptionTypes = [
        { id: "none", title: Resource.ConsumersS3EncryprionNone },
        { id: "server", title: Resource.ConsumersS3EncryprionSSE },
        { id: "client", title: Resource.ConsumersS3EncryprionCSE }
    ];

    var encryptionMethods = [
        { id: "", title: Resource.ConsumersS3EncryprionNone, type: "none", visible: false, key: false, kms: false },
        { id: "aes256", title: Resource.ConsumersS3EncryprionSSES3, type: "server", visible: true, key: false, kms: false, description: Resource.ConsumersS3EncryprionSSES3Help },
        { id: "awskms", title: Resource.ConsumersS3EncryprionSSEKMS, type: "server", visible: true, key: false, kms: true, description: Resource.ConsumersS3EncryprionSSEKMSHelp },
        { id: "clientawskms", title: "Client Kms", type: "client", visible: false, key: true, kms: false },
        //{ id: "clientaes", title: "Client Aes", type: "client", visible: false, key: true, kms: false },
        //{ id: "clientrsa", title: "Client Rsa", type: "client", visible: false, key: true, kms: false }
    ];

    var regionsS3 = [],
        $view = null,
        thirdPartyDescriptions = {};

    var displayNoneClass = "display-none",
        withErrorClass = "withError",
        textBoxClass = ".textBox",
        radioBoxClass = ".radioBox",
        checkBoxClass = ".checkBox",
        selectBoxClass = ".selectBox",
        comboBoxEncryptionClass = ".comboBoxEncryption",
        encryptionMethodClass = ".encryption-method",
        encryptionKmsClass = ".encryption-kms",
        encryptionKeyClass = ".encryption-key";

    function initS3Regions(regions) {
        regionsS3 = regions;
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

    function bindEvents($box) {
        $box.off("input" + textBoxClass).on("input" + textBoxClass, textBoxClass, function () {
            $(this).removeClass(withErrorClass);
        });

        $box.off("click" + checkBoxClass).on("click" + checkBoxClass, checkBoxClass, function () {
            window.onCheckBoxClick.call(this);
        });

        $box.off("valueChanged" + comboBoxEncryptionClass).on("valueChanged" + comboBoxEncryptionClass, comboBoxEncryptionClass, function () {
            $box.find(encryptionMethodClass).addClass(displayNoneClass);
            $box.find(encryptionKmsClass).addClass(displayNoneClass);
            $box.find(encryptionKeyClass).addClass(displayNoneClass);

            var type = this.dataset.value;
            var $firstOfType = null;

            for (var i = 0; i < encryptionMethods.length; i++) {
                var method = encryptionMethods[i];
                var $element = $box.find(encryptionMethodClass + " " + radioBoxClass + "[data-value='" +  method.id + "']")

                if ($firstOfType == null && method.type == type) {
                    $firstOfType = $element;
                }

                if (!method.visible || method.type != type) {
                    $element.hide();
                } else {
                    $element.show();
                    $box.find(encryptionMethodClass).removeClass(displayNoneClass);
                }
            }

            $firstOfType.trigger("click");
        });

        $box.off("click" + encryptionMethodClass).on("click" + encryptionMethodClass, encryptionMethodClass + " " + radioBoxClass, function () {
            window.onRadioBoxClick.call(this);
            
            var val = this.dataset.value;
            var method = encryptionMethods.find(function (item) { return item.id == val; });
            $box.find(encryptionKeyClass).toggleClass(displayNoneClass, !method.key);

            if (method.kms) {
                $box.find(encryptionKmsClass).removeClass(displayNoneClass);
                Common.selectorListener.set($box.find(encryptionKmsClass + " " + selectBoxClass), 0);
            } else {
                $box.find(encryptionKmsClass).addClass(displayNoneClass);
            }
        });

        $box.off("valueChanged" + encryptionKmsClass).on("valueChanged" + encryptionKmsClass, encryptionKmsClass + " " + selectBoxClass, function () {
            $box.find(encryptionKeyClass).toggleClass(displayNoneClass, this.dataset.value == 0);
        });
    }

    function showStorageHelpBox(e) {
        e.stopPropagation();
        var $switcher = $(this);
        var $box = $switcher.closest('.helpCenterSwitcher');
        var existPopup = $box.find('.popup_helper');
        if (existPopup.length) {
            existPopup.remove();
            return;
        }
        $view.find(".popup_helper").remove();

        var description = "";
        var descriptionId = "";

        if ($switcher.attr('data-type') == 'encryptionMethod'){
            var encryptionMethodId = $switcher.parent().attr('data-value');
            var settingsName = $switcher.parent().attr('data-name');
            description = encryptionMethods.find(function (item) { return item.id == encryptionMethodId; }).description;
            descriptionId = settingsName + encryptionMethodId;
        } else {
            var storageName = $switcher.parents(".flexTextBox").attr('data-id');
            var textBoxName = $switcher.parents(".flexContainer").attr('data-id') || $(this).parents(".flexContainer").attr('prop-id');
            description = thirdPartyDescriptions[storageName][textBoxName];
            descriptionId = textBoxName + 'ThirdStorageHelper';
        }

        $box.html($("#consumerHelpBox").tmpl({ description: description, descriptionId: descriptionId }));

        $switcher.helper({
            BlockHelperID: descriptionId
        });
    }

    function init(view, storages) {
        $view = view;
        initThirdPartyResources(storages);
    }

    function getValue($item) {
        var value = "";
        if ($item.hasClass("textBox")) {
            value = $item.val();
        } else if ($item.hasClass("selectBox")) {
            value = $item.attr("data-value");
        } else if ($item.hasClass("radioBox")) {
            value = $item.attr("data-value");
        } else if ($item.hasClass("checkBox")) {
            value = $item.hasClass("checked");
        }
        return value;
    }

    function setValue(consumer, $box, $parent, value) {
        var $element = $parent.find(".textBox, .selectBox, .radioBox, .checkBox");

        if ($element.hasClass("textBox")) {
            $element.val(value);
        } else if ($element.hasClass("selectBox")) {
            Common.selectorListener.set($element, value);
        } else if ($element.hasClass("radioBox")) {
            var method = encryptionMethods.find(function (item) { return item.id == value; }) || encryptionMethods[0];
            Common.selectorListener.set($box.find(comboBoxEncryptionClass), method.type);
            $parent.find(".radioBox[data-value='" + value + "']").trigger("click");
            if (method.kms) {
                var key = consumer.properties.find(function (item) { return item.name == "ssekey"; });
                Common.selectorListener.set($box.find(encryptionKmsClass + " " + selectBoxClass), key && key.value ? 1 : 0);
            }
        } else if ($element.hasClass("checkBox")) {
            $element.toggleClass("checked", value == "true");
        }
    }

    function checkValid($item, value) {
        return $item.hasClass("requiredField") ? !!value : true;
    }

    function getProps(selectedConsumer, $box) {
        var storageProps = [];
        var hasError = false;

        $storage = $box.find('div.storage[data-id="' + selectedConsumer + '"]');
        var $settings = $storage.find("div[data-id] .textBox:visible, div[data-id] .selectBox, div[data-id] .checkBox, div[data-id] .radioBox.checked");

        for (var i = 0; i < $settings.length; i++) {
            var $item = $($settings[i]);
            var itemKey = $item.parents(".flexContainer").attr("data-id");
            var itemValue = getValue($item);
            if (checkValid($item, itemValue)) {
                $item.removeClass(withErrorClass);
                if (itemValue !== "") {
                    storageProps.push({ key: itemKey, value: itemValue });
                }
            } else {
                $item.addClass(withErrorClass);
                hasError = true;
            }
        }

        return hasError ? null : storageProps;
    }


    function setProps($box, consumer) {
        var $storage = $box.find('div[data-id="' + consumer.id + '"]'); 
        for (var i = 0; i < consumer.properties.length; i++) {
           var prop = consumer.properties[i];
           var $parent = $storage.find("[data-id='" + prop.name + "']");
           setValue(consumer, $storage, $parent, prop.value);
        }
    }

    function getTmplData(data, name) {
        return Object.assign({}, data, {
            regions: regionsS3,
            encryptionTypes: encryptionTypes,
            encryptionMethods: encryptionMethods,
            settingName: name || ""
        });
    }

    return {
        initS3Regions: initS3Regions,
        init: init,
        bindEvents: bindEvents,
        showStorageHelpBox: showStorageHelpBox,
        getProps: getProps,
        setProps: setProps,
        getTmplData: getTmplData
    }
};