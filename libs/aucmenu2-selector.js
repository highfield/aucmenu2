/*
The MIT License (MIT)

Copyright (c) 2018+, Mario Vernari - Cet Electronics.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 **/

(function (NS, $) {
    'use strict';

    NS.MenuSelectorSingle = function () {

        const listeners = [];
        const module = {};

        module.addListener = function (ls) {
            if (!ls || listeners.indexOf(ls) >= 0) return;
            listeners.push(ls);
        };

        module.removeListener = function (ls) {
            if (!ls) return;
            const ix = listeners.indexOf(ls);
            if (ix >= 0) {
                listeners.splice(ix, 1);
            }
        };

        var selection;
        Object.defineProperty(module, 'selection', {
            get: function () { return selection; },
            set: function (v) {
                if (selection !== v) {
                    selection = v;
                    listeners.forEach(function (ls) {
                        if ($.isFunction(ls)) {
                            ls(selection);
                        }
                        else if ($.isFunction(ls.onselect)) {
                            ls.onselect(selection);
                        }
                    });
                }
            }
        });

        return module;
    };


})(window._AuJS_NS_('AuJS'), jQuery);

