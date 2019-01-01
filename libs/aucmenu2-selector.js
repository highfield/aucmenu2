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

//template: https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], function (jquery) {
            if (!jquery.fn) jquery.fn = {}; // webpack server rendering
            return factory(jquery);
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var jQuery = typeof window !== 'undefined' ? window.jQuery : undefined;
        if (!jQuery) {
            jQuery = require('jquery');
            if (!jQuery.fn) jQuery.fn = {};
        }
        module.exports = factory(jQuery);
    } else {
        // Browser globals
        root.AuJS = root.AuJS || {};
        root.AuJS.MenuSelectorSingle = factory(root.jQuery);
    }
}(typeof self !== 'undefined' ? self : this, function ($) {
    'use strict';

    const MenuSelectorSingle = function () {

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


    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return MenuSelectorSingle;
}));

