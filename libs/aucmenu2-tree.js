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
        define(['jquery', 'AuJS'], function (jquery, aujs) {
            if (!jquery.fn) jquery.fn = {}; // webpack server rendering
            return factory(jquery, aujs);
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
        var aujs = typeof window !== 'undefined' && typeof window.AuJS !== 'undefined' ? window.AuJS : require('AuJS');
        module.exports = factory(jQuery, aujs);
    } else {
        // Browser globals
        root.AuJS = root.AuJS || {};
        root.AuJS.TreeMenuRenderer = factory(root.jQuery, root.AuJS);
    }
}(typeof self !== 'undefined' ? self : this, function ($, AuJS) {
    'use strict';

    const defaults = Object.freeze({
        itemHeight: 48,             //px
        indentWidth: 32,            //px
        expanderWidth: 32,          //px
        iconWidth: 24,              //px
        expSymbol: 'fas fa-chevron-right',
        transitionDuration: 300,    //ms
        onSelection: null
    });


    const TreeMenuRenderer = function (struct, opts) {

        const yieldDuration = 10;   //ms

        const context = struct._getContext();
        const options = $.extend({}, defaults, $.isPlainObject(opts) ? opts : {});


        function NodeRenderer(owner, node) {
            const self = this;
            var state = AuJS.Drawer.States.CLOSED;

            Object.defineProperty(this, 'node', {
                value: node,
                writable: false
            });

            var selected = false;
            Object.defineProperty(this, 'selected', {
                get: function () { return selected; }
            });

            Object.defineProperty(this, 'expanded', {
                get: function () { return state === AuJS.Drawer.States.OPENED || state === AuJS.Drawer.States.OPENING; }
            });

            var rendered = false;
            Object.defineProperty(this, 'rendered', {
                get: function () { return rendered; }
            });

            this.element = null;
            this.itemCtr = null;
            this.outlineBay = null;
            this.outline = null;

            this.render = function (parentElement, parentOutlineBay, extras) {
                //create the element to hold the menu folder and their children
                self.element = $('<div>', { class: 'aujs-treemenu-node level' + node.level, 'data-id': node.id })
                    .appendTo(parentElement);

                if (node.isSeparator) {
                    self.element.addClass('aujs-treemenu-separator');
                }
                else {
                    selected && self.element.addClass('selected');

                    const header = $('<div>', { class: 'aujs-treemenu-node-header' }).css({
                        'height': owner.getActualOption('itemHeight')
                    }).appendTo(self.element);


                    //block to host the expander button, whereas useful
                    const xhost = $('<div>', { class: 'aujs-exp' }).css({
                        //'display': extras.allocateExpanders ? '' : 'none',
                        'min-width': owner.getActualOption('expanderWidth')
                    }).appendTo(header);

                    //main button, as the node selection button, and related handler
                    const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        const args = {
                            renderer: self,
                            node: node,
                            idToSelect: node.id
                        };
                        const handled = options.onSelection && options.onSelection(args);
                        if (!handled) {
                            if (module.selector) {
                                module.selector.selection = args.idToSelect;
                            }
                        }
                        return false;
                    });

                    if (!extras.allocateExpanders) {
                        mbtn.css('margin-left', 4);
                    }

                    //node main face: text and optional icon
                    const inner = $('<div>', { class: 'aujs-treemenu-node-caption' }).appendTo(mbtn);
                    const hostLabel = $('<span>', { class: 'aujs-label' }).appendTo(inner).text(node.label);
                    //const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                    if (node.icon) {
                        const hostIcon = $('<div>', { class: 'aujs-icon' }).css({
                            'min-width': owner.getActualOption('iconWidth')
                        }).appendTo(inner);
                        $('<i>', { class: node.icon }).appendTo(hostIcon);
                    }

                    //outline-bay to host the children's outlines
                    self.outlineBay = $('<div>', {
                        class: 'aujs-treemenu-node-outline-bay'
                    }).appendTo(self.element);

                    if (parentOutlineBay) {
                        const exp2 = owner.getActualOption('expanderWidth') / 2;
                        self.outline = $('<div>', { class: 'aujs-treemenu-node-outline' }).css({
                            'left': exp2,
                            'width': owner.getActualOption('indentWidth') - exp2,
                            'top': 8 - owner.getActualOption('itemHeight') / 2
                        }).appendTo(parentOutlineBay);
                    }

                    //children nodes host
                    self.itemsCtr = $('<div>', { class: 'aujs-treemenu-node-items' }).css({
                        'margin-left': owner.getActualOption('indentWidth')
                    }).appendTo(self.element);

                    var expandHandler = null;
                    if (node.expandable) {
                        //expander button and related handler
                        expandHandler = function () {
                            self.cmdexp();
                        };

                        const xbtn = $('<a>', { href: '#' }).appendTo(xhost).on('click', function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            expandHandler();
                            return false;
                        });

                        const xbtnContent = $('<i>', {
                            class: owner.getActualOption('expSymbol')
                        }).appendTo(xbtn);
                        const xbtnContentStyle = xbtnContent[0].style;

                        const itemsCtrStyle = self.itemsCtr[0].style;

                        if (self.expanded) {
                            state = AuJS.Drawer.States.OPENED;
                            xbtnContentStyle.transition = '';
                            xbtnContentStyle.transform = 'rotate(90deg)';
                        }
                        else {
                            state = AuJS.Drawer.States.CLOSED;
                            itemsCtrStyle.transition = '';
                            itemsCtrStyle.opacity = 0;
                            itemsCtrStyle.height = 0;
                        }

                        const childrenExtras = {
                            allocateExpanders: isAnyChildExpandable(node.children)
                        };

                        node.children.forEach(function (cid) {
                            const child = context.nodeMap[cid];
                            const nrend = nrendMap[cid] = new NodeRenderer(owner, child);
                            nrend.render(self.itemsCtr, self.outlineBay, childrenExtras);
                        });
                    }
                }

                rendered = true;
                setTimeout(self.updateChildrenOutlines, yieldDuration);
            };

            this.updateSiblingOutlines = function () {
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.updateSiblingOutlines();
                    parent.updateChildrenOutlines();
                }
            };

            this.updateChildrenOutlines = function () {
                if (!rendered) return;
                var h = owner.getActualOption('itemHeight');
                node.children.forEach(function (cid) {
                    const child = nrendMap[cid];
                    child.outline && child.outline.css('height', h - 4);
                    h += child.element[0].getBoundingClientRect().height;
                });
                //self.showOutlineBay(self.expanded, false);
                self.outlineBay && self.outlineBay.css('opacity', self.expanded ? 1 : 0);
            };

            this.showOutlineBay = function (coerce) {
                if (!rendered) return;
                const f = typeof coerce === 'boolean' ? coerce : self.expanded;
                self.outlineBay && self.outlineBay.css('opacity', f ? 1 : 0);
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.showOutlineBay(coerce);
                }
            };

            this.expand = function () {
                if (!rendered) {
                    state = AuJS.Drawer.States.OPENED;
                }
                else if (state === AuJS.Drawer.States.CLOSED && node.expandable) {
                    state = AuJS.Drawer.States.OPENING;
                    self.showOutlineBay(false);

                    const button = self.element
                        .children('.aujs-treemenu-node-header')
                        .find('.aujs-exp > a')
                        .children();
                    const buttonStyle = button[0].style;
                    buttonStyle.transitionDuration = owner.getActualOption('transitionDuration') + 'ms';
                    buttonStyle.transitionProperty = 'transform';
                    buttonStyle.transform = 'rotate(90deg)';

                    const itemsCtrStyle = self.itemsCtr[0].style;
                    itemsCtrStyle.transition = '';
                    itemsCtrStyle.opacity = 0;
                    itemsCtrStyle.height = 0;

                    setTimeout(function () {
                        itemsCtrStyle.transitionDuration = owner.getActualOption('transitionDuration') + 'ms';
                        itemsCtrStyle.transitionProperty = 'opacity, height';
                        itemsCtrStyle.opacity = 1;
                        itemsCtrStyle.height = self.getChildrenHeight() + 'px';

                        setTimeout(function () {
                            state = AuJS.Drawer.States.OPENED;
                            itemsCtrStyle.height = 'auto';
                            self.updateSiblingOutlines();
                            self.showOutlineBay();
                        }, owner.getActualOption('transitionDuration'));
                    }, yieldDuration);
                }
            };

            this.collapse = function () {
                if (!rendered) {
                    state = AuJS.Drawer.States.CLOSED;
                }
                else if (state === AuJS.Drawer.States.OPENED && node.expandable) {
                    state = AuJS.Drawer.States.CLOSING;
                    self.showOutlineBay(false);

                    const button = self.element
                        .children('.aujs-treemenu-node-header')
                        .find('.aujs-exp > a')
                        .children();
                    const buttonStyle = button[0].style;
                    buttonStyle.transitionDuration = owner.getActualOption('transitionDuration') + 'ms';
                    buttonStyle.transitionProperty = 'transform';
                    buttonStyle.transform = 'rotate(0deg)';

                    const itemsCtrStyle = self.itemsCtr[0].style;
                    itemsCtrStyle.transition = '';
                    itemsCtrStyle.opacity = 1;
                    itemsCtrStyle.height = self.getChildrenHeight() + 'px';

                    setTimeout(function () {
                        itemsCtrStyle.transitionDuration = owner.getActualOption('transitionDuration') + 'ms';
                        itemsCtrStyle.transitionProperty = 'opacity, height';
                        itemsCtrStyle.opacity = 0;
                        itemsCtrStyle.height = 0;

                        setTimeout(function () {
                            state = AuJS.Drawer.States.CLOSED;
                            self.updateSiblingOutlines();
                            self.showOutlineBay();
                        }, owner.getActualOption('transitionDuration'));
                    }, yieldDuration);
                }
            };

            this.cmdexp = function () {
                if (state === AuJS.Drawer.States.CLOSED) {
                    self.expand();
                }
                else if (state === AuJS.Drawer.States.OPENED) {
                    self.collapse();
                }
            };

            this.expandParents = function () {
                self.expand();
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.expandParents();
                }
            };

            this.select = function (value) {
                value = !!value;
                if (selected !== value) {
                    selected = value;
                    if (rendered) {
                        if (selected) {
                            self.element.addClass('selected');
                        }
                        else {
                            self.element.removeClass('selected');
                        }
                    }
                }
                if (selected) {
                    self.expandParents();
                    self.bringIntoView();
                }
            };

            this.bringIntoView = function () {
                if (!rendered) return;
                const excess = 1.2;
                setTimeout(function () {
                    //quick and dirty 'bringIntoView'
                    var outerElement = self.element.closest('.aujs-treemenu')[0];
                    var outerRect = outerElement.getBoundingClientRect();
                    var selfRect = self.element[0].getBoundingClientRect();
                    if (selfRect.top < outerRect.top) {
                        outerElement.scrollTop = outerElement.scrollTop - (outerRect.top - selfRect.top) * excess;
                    }
                    else if (selfRect.top + selfRect.height > outerRect.top + outerRect.height) {
                        outerElement.scrollTop = outerElement.scrollTop + (selfRect.top + selfRect.height - outerRect.top - outerRect.height) * excess;
                    }
                }, owner.getActualOption('transitionDuration') * excess);
            };

            this.getChildrenHeight = function () {
                var h = 0;
                self.itemsCtr.children()
                    .each(function () {
                        h += $(this)[0].getBoundingClientRect().height;
                    });
                return h;
            };
        }


        const isAnyChildExpandable = function (idList) {
            for (var i = 0; i < idList.length; i++) {
                const child = context.nodeMap[idList[i]];
                if (child.expandable) return true;
            }
            return false;
        };

        const selector_onselect = function (selection) {
            for (var id in nrendMap) {
                nrendMap[id].select(id === selection);
            }
        };


        const module = {};

        module.getActualOption = function (pname) {
            return options[pname];
        };

        var selector;
        Object.defineProperty(module, 'selector', {
            get: function () { return selector; },
            set: function (v) {
                if (selector !== v) {
                    if (selector) selector.removeListener(selector_onselect);
                    selector = v;
                    if (selector) selector.addListener(selector_onselect);
                }
            }
        });


        var rendered = false;
        Object.defineProperty(module, 'rendered', {
            get: function () { return rendered; }
        });

        module.create = $.noop;

        var hook;
        module.attach = function (h) {
            if (!hook) {
                hook = h;
                module.render();
            }
        };

        module.detach = function (h) {
            if (hook) {
                hook.element.children().detach();
                hook = null;
            }
            rendered = false;
        };

        var nrendMap = {};
        module.render = function () {
            if (rendered) return;   //TEMP
            var outer = hook.element.children('.aujs-treemenu');
            if (outer.length === 0) {
                outer = $('<div>', { class: 'aujs-treemenu' }).appendTo(hook.element);
            }

            const extras = {
                allocateExpanders: isAnyChildExpandable(context.roots)
            };

            context.roots.forEach(function (id) {
                const node = context.nodeMap[id];
                const nrend = nrendMap[id] = new NodeRenderer(module, node);
                nrend.render(outer, null, extras);
            });

            const selection = module.selector && module.selector.selection;
            if (selection) {
                const selectedRenderer = nrendMap[selection];
                selectedRenderer && selectedRenderer.select(true);
            }

            rendered = true;
        };


        module.destroy = function () {
            rendered = false;
            nrendMap = {};
        };

        return module;
    };


    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return TreeMenuRenderer;
}));
