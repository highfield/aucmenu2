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

    const uuid = (function () {
        var n = 0;
        return function () {
            return 'aujs_id_' + n++;
        };
    })();


    NS.MenuStruct = function (options) {

        /**
         * node schema:
         *  id: (string) ID which characterizes the node itself
         *  parentId: (string) ref-ID to the parent node, or <null> for a root node
         *  level: (number) non-negative integer indicating the depth level, where zero is a root
         *  expandable: (bool) indicates whether the node can be expanded or not
         *  label: (string)
         *  icon: (string)
         *  children: (array) list of ID-references to the children nodes
         */

        function Node(context, id, label) {
            const self = this;

            Object.defineProperty(this, 'id', {
                value: id,
                writable: false
            });

            Object.defineProperty(this, 'label', {
                value: label,
                writable: false
            });

            Object.defineProperty(this, 'isSeparator', {
                value: label === '-',
                writable: false
            });

            Object.defineProperty(this, 'expandable', {
                get: function () { return self.children.length !== 0; }
            });

            this.parentId = null;
            this.level = 0;
            this.icon = null;
            this.children = [];

            this.getFirstChild = function () {
                if (!self.children.length) return;
                const id1 = self.children[0];
                const id = Array.isArray(id1) ? id1[0] : id1;
                return context.nodeMap[id];
            };
        }


        function scan(source, parentId, level) {
            if ($.isPlainObject(source)) {
                const id = keySelector && keySelector(source) || uuid();
                var node = context.nodeMap[id];
                if (!node) {
                    node = context.nodeMap[id] = new Node(context, id, source.label);
                }
                node.parentId = parentId;
                node.level = level;
                if (!node.isSeparator) {
                    node.icon = source.icon;
                    node.children = Array.isArray(source.items) ? scan(source.items, id, level + 1) : [];
                }
                return [id];
            }
            else if (Array.isArray(source)) {
                var idlist = [];
                source.forEach(function (s) {
                    idlist.push(scan(s, parentId, level));
                });
                return idlist;
            }
            else {
                throw new Error('Source type not supported.');
            }
        }


        if (!$.isPlainObject(options)) {
            options = {};
        }
        const keySelector = $.isFunction(options.keySelector)
            ? options.keySelector
            : function (src) { return src.id; };

        const context = {
            roots: [],
            nodeMap: {}
        };
        const module = {};

        module._getContext = function () {
            return context;
        };

        module.getNode = function (arg) {
            if ($.isFunction(arg)) {
                for (var id in context.nodeMap) {
                    const node = context.nodeMap[id];
                    if (arg(node)) return node;
                }
            }
            else if (typeof arg === 'string') {
                return context.nodeMap[arg];
            }
        };

        module.getNodes = function () {
            return context.nodeMap.values();
        };

        var xdata = {};
        module.getData = function () { return xdata; };
        module.setData = function (data) {
            xdata = data || {};
            context.roots = scan(xdata, null, 0);
        };

        return module;
    };

})(window._AuJS_NS_('AuJS'), jQuery);

