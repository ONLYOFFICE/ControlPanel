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


;(function() {
    var 
      dropdownToggleHash = {};
    jQuery.extend({
        dropdownToggle: function(options) {
            // default options
            options = jQuery.extend({
                //switcherSelector: "#id" or ".class",          - button
                //dropdownID: "id",                             - drop panel
                //anchorSelector: "#id" or ".class",            - near field
                //noActiveSwitcherSelector: "#id" or ".class",  - dont hide
                addTop: 0,
                addLeft: 0,
                position: "absolute",
                fixWinSize: true,
                enableAutoHide: true,
                showFunction: null,
                afterShowFunction: null,
                hideFunction: null,
                alwaysUp: false,
                simpleToggle: false,
                rightPos: false
            }, options);

            var _toggle = function(switcherObj, dropdownID, addTop, addLeft, fixWinSize, position, anchorSelector, showFunction, alwaysUp, simpleToggle, afterShowFunction) {
                var dropdownItem = $("#" + dropdownID);

                if (typeof (simpleToggle) == "undefined" || simpleToggle === false) {
                    fixWinSize = fixWinSize === true;
                    addTop = addTop || 0;
                    addLeft = addLeft || 0;
                    position = position || "absolute";

                    var targetPos = $(anchorSelector || switcherObj).offset();

                    if (!targetPos) return;

                    var elemPosLeft = targetPos.left;
                    var elemPosTop = targetPos.top + $(anchorSelector || switcherObj).outerHeight();
                    if (options.rightPos) {                    
                            elemPosLeft = Math.max(0,targetPos.left - dropdownItem.outerWidth() + $(anchorSelector || switcherObj).outerWidth());                      
                    }

                    var w = $(window);
                    var topPadding = w.scrollTop();
                    var leftPadding = w.scrollLeft();

                    if (position == "fixed") {
                        addTop -= topPadding;
                        addLeft -= leftPadding;
                    }

                    var scrWidth = w.width();
                    var scrHeight = w.height();

                    if (fixWinSize && (!options.rightPos)
                        && (targetPos.left + addLeft + dropdownItem.outerWidth()) > (leftPadding + scrWidth)) {
                        elemPosLeft = Math.max(0, leftPadding + scrWidth - dropdownItem.outerWidth()) - addLeft;
                    }

                    if (fixWinSize
                        && (elemPosTop + dropdownItem.outerHeight()) > (topPadding + scrHeight)
                            && (targetPos.top - dropdownItem.outerHeight()) > topPadding
                                || alwaysUp) {
                        elemPosTop = targetPos.top - dropdownItem.outerHeight();
                    }

                    dropdownItem.css(
                        {
                            "position": position,
                            "top": elemPosTop + addTop,
                            "left": elemPosLeft + addLeft
                        });
                }
                if (typeof showFunction === "function") {
                    showFunction(switcherObj, dropdownItem);
                }

                dropdownItem.toggle();

                if (typeof afterShowFunction === "function") {
                    afterShowFunction(switcherObj, dropdownItem);
                }
            };

            var _registerAutoHide = function(event, switcherSelector, dropdownSelector, hideFunction) {
                if ($(dropdownSelector).is(":visible")) {
                    var $targetElement = $((event.target) ? event.target : event.srcElement);
                    if (!$targetElement.parents().addBack().is(switcherSelector + ", " + dropdownSelector)) {
                        if (typeof hideFunction === "function")
                            hideFunction($targetElement);
                        $(dropdownSelector).hide();
                    }
                }
            };

            if (options.switcherSelector && options.dropdownID) {
                var toggleFunc = function(e) {
                _toggle($(this), options.dropdownID, options.addTop, options.addLeft, options.fixWinSize, options.position, options.anchorSelector, options.showFunction, options.alwaysUp, options.simpleToggle, options.afterShowFunction);
                };
                if (!dropdownToggleHash.hasOwnProperty(options.switcherSelector + options.dropdownID)) {
                    $(document).on("click", options.switcherSelector, toggleFunc);
                    dropdownToggleHash[options.switcherSelector + options.dropdownID] = true;
                }
            }

            if (options.enableAutoHide && options.dropdownID) {
                var hideFunc = function(e) {
                    var allSwitcherSelectors = options.noActiveSwitcherSelector ?
                        options.switcherSelector + ", " + options.noActiveSwitcherSelector : options.switcherSelector;
                    _registerAutoHide(e, allSwitcherSelectors, "#" + options.dropdownID, options.hideFunction);

                };
                $(document).unbind("click", hideFunc);
                $(document).bind("click", hideFunc);
            }

            return {
                toggle: _toggle,
                registerAutoHide: _registerAutoHide
            };
        }
    });
})();