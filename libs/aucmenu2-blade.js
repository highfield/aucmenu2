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
        define(['jquery', 'AuDrawer'], function (jquery, audrawer) {
            if (!jquery.fn) jquery.fn = {}; // webpack server rendering
            var o = factory(jquery, audrawer);
            for (var k in o) root[k] = o[k];
            return o;
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports, like Node.
        var jQuery = typeof window !== 'undefined' ? window.jQuery : undefined;
        if (!jQuery) {
            jQuery = require('jquery');
            if (!jQuery.fn) jQuery.fn = {};
        }
        var audrawer = typeof window !== 'undefined' && typeof window.AuDrawer !== 'undefined' ? window.AuDrawer : require('AuDrawer');
        module.exports = factory(jQuery, audrawer);
    } else {
        // Browser globals
        var o = factory(root.jQuery, root.AuDrawer);
        for (var k in o) root[k] = o[k];
    }
}(typeof self !== 'undefined' ? self : this, function ($, AuDrawer) {
    'use strict';

    const defaults = Object.freeze({
        drawerSize: 300,            //px
        itemHeight: 48,             //px
        expanderWidth: 48,          //px
        iconWidth: 24,              //px
        backSymbol: 'fas fa-arrow-circle-left fa-lg',
        expSymbol: 'fas fa-chevron-right',
        hiliteSymbol: 'fas fa-chevron-circle-right fa-lg',
        transitionDuration: 300,    //ms
        closeOnSelect: true,
        expandWhenSelect: true,
        backWhenSelect: true,
        rootBackLabel: 'Close menu'
    });


    const AuBladeMenuRenderer = function (struct, opts) {

        const yieldDuration = 10;   //ms

        const context = struct._getContext();
        const options = $.extend({}, defaults, $.isPlainObject(opts) ? opts : {});

        var temp = 0;
        function BladeRenderer(owner, node) {
            const self = this;
            const baseClass = 'aujs-blademenu-node blade';

            this.rendered = false;
            this.element = null;
            this.itemCtr = null;
            this.bid = temp++;

            this.render = function (bladeContainer) {
                self.element = $('<div>', { class: baseClass + ' close' })
                    .appendTo(bladeContainer);

                const header = $('<div>', { class: 'aujs-header' }).css({
                    'min-height': owner.getActualOption('itemHeight')
                }).appendTo(self.element);


                //block to host the back button
                const bhost = $('<div>', { class: 'back' }).css({
                    'min-width': owner.getActualOption('expanderWidth')
                }).appendTo(header);

                //back button and related handler
                const bbtn = $('<a>', { href: '#' }).appendTo(bhost).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    module.back();
                    return false;
                });

                const bbtnContent = $('<i>', {
                    class: owner.getActualOption('backSymbol')
                }).appendTo(bbtn);

                //main button, as the node selection button, and related handler
                const mbtn = $('<a>').appendTo(header);
                mbtn.attr('href', '#').on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!node.id || options.backWhenSelect) {
                        module.back();
                    }
                    else {
                        if (module.selector) {
                            module.selector.selection = node.id;
                        }
                        if (owner.getActualOption('closeOnSelect')) {
                            module.close();
                        }
                    }
                    return false;
                });

                //node main face: text and optional icon
                const inner = $('<div>', { class: 'aujs-caption' }).appendTo(mbtn);
                const hostLabel = $('<span>', { class: 'aujs-label' }).appendTo(inner).text(node.label);
                //const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    const hostIcon = $('<div>', { class: 'aujs-icon' }).css({
                        'min-width': owner.getActualOption('iconWidth')
                    }).appendTo(inner);
                    $('<i>', { class: node.icon }).appendTo(hostIcon);
                }

                //children nodes host
                self.itemsCtr = $('<div>', { class: 'aujs-items' }).appendTo(self.element);

                node.children.forEach(function (id) {
                    const child = context.nodeMap[id];
                    const nrend = nrendMap[id] = new NodeRenderer(owner, self, child);
                    nrend.render(self.itemsCtr, bladeContainer);
                });

                self.rendered = true;
            };

            var indentLevel = -1;
            this.indent = function (ilev) {
                if (indentLevel !== ilev) {
                    indentLevel = ilev;
                    const el = self.element[0];
                    if (indentLevel >= 0) {
                        el.className = baseClass + ' open indent' + indentLevel;
                    }
                    else {
                        el.className = baseClass + ' close';
                    }
                }
            };
        }


        function NodeRenderer(owner, blade, node) {
            const self = this;

            const renderSelection = function () {
                if (self.rendered) {
                    if (selected) {
                        self.element.removeClass('hilited').addClass('selected');
                    }
                    else if (hilited) {
                        self.element.removeClass('selected').addClass('hilited');
                    }
                    else {
                        self.element.removeClass('selected hilited');
                    }
                    if (self.xbtnContent0) {
                        const f = hilited && !selected;
                        self.xbtnContent0.css('display', f ? 'none' : '');
                        self.xbtnContent1.css('display', f ? '' : 'none');
                    }
                }
            };

            Object.defineProperty(this, 'blade', {
                value: blade,
                writable: false
            });

            Object.defineProperty(this, 'node', {
                value: node,
                writable: false
            });

            var selected = false;
            Object.defineProperty(this, 'selected', {
                get: function () { return selected; }
            });

            var hilited = false;
            Object.defineProperty(this, 'hilited', {
                get: function () { return hilited; }
            });

            this.rendered = false;
            this.element = null;

            this.render = function (parentElement, bladeContainer) {
                self.element = $('<div>', { class: 'aujs-blademenu-node item', 'data-id': node.id })
                    .appendTo(parentElement);

                if (node.isSeparator) {
                    self.element.addClass('aujs-blademenu-separator');
                }
                else {
                    selected && self.element.addClass('selected');

                    const header = $('<div>', { class: 'aujs-header' }).css({
                        'height': owner.getActualOption('itemHeight')
                    }).appendTo(self.element);


                    //block to host the expander button, whereas useful
                    const xhost = $('<div>', { class: 'aujs-exp' }).css({
                        'min-width': owner.getActualOption('expanderWidth')
                    }).appendTo(header);

                    //main button, as the node selection button, and related handler
                    const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (expandHandler && options.expandWhenSelect) {
                            expandHandler();
                        }
                        else {
                            if (module.selector) {
                                module.selector.selection = node.id;
                            }
                            if (owner.getActualOption('closeOnSelect')) {
                                module.close();
                            }
                        }
                        return false;
                    });

                    //node main face: text and optional icon
                    const inner = $('<div>', { class: 'aujs-caption' }).appendTo(mbtn);
                    const hostLabel = $('<span>', { class: 'aujs-label' }).appendTo(inner).text(node.label);
                    //const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                    if (node.icon) {
                        const hostIcon = $('<div>', { class: 'aujs-icon' }).css({
                            'min-width': owner.getActualOption('iconWidth')
                        }).appendTo(inner);
                        $('<i>', { class: node.icon }).appendTo(hostIcon);
                    }

                    var expandHandler = null;
                    if (node.children.length) {
                        const childBlade = new BladeRenderer(owner, node);
                        bladeList.push(childBlade);
                        childBlade.render(bladeContainer);

                        //expander button and related handler
                        expandHandler = function () {
                            involvedBlades.unshift(childBlade);
                            updateBlades();
                        };

                        const xbtn = $('<a>', { href: '#' }).appendTo(xhost).on('click', function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            expandHandler();
                            return false;
                        });

                        self.xbtnContent0 = $('<i>', {
                            class: owner.getActualOption('expSymbol')
                        }).css('display', 'none').appendTo(xbtn);
                        self.xbtnContent1 = $('<i>', {
                            class: owner.getActualOption('hiliteSymbol')
                        }).css('display', 'none').appendTo(xbtn);
                    }
                }

                self.rendered = true;
                renderSelection();
            };

            this.select = function (value) {
                value = !!value;
                if (selected !== value) {
                    selected = value;
                    renderSelection();
                }
            };

            this.hilite = function (value) {
                value = !!value;
                if (hilited !== value) {
                    hilited = value;
                    renderSelection();
                }
            };

            this.bringIntoView = function () {
                if (!self.rendered) return;
                const excess = 1.2;
                setTimeout(function () {
                    //quick and dirty 'bringIntoView'
                    var outerElement = self.element.parent()[0];
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
        }


        const updateBlades = function () {
            //console.log('ublades')
            //involvedBlades.forEach(function (blade) {
            //    console.log('inv='+blade.bid)
            //});
            bladeList.forEach(function (blade) {
                //console.log(blade.bid)
                blade.indent(involvedBlades.indexOf(blade));
            });
            for (var id in nrendMap) {
                const nr = nrendMap[id];
                nr.hilite(involvedNodes.indexOf(nr) >= 0);
            }
        };


        const restoreSelectedBlades = function () {
            involvedBlades.length = 0;
            involvedNodes.length = 0;
            if (module.isOpen) {
                var selectedRenderer;
                const selection = module.selector && module.selector.selection;
                if (selection) {
                    selectedRenderer = nrendMap[selection];
                }

                if (selectedRenderer) {
                    var nr = selectedRenderer;
                    while (nr) {
                        involvedNodes.push(nr);
                        involvedBlades.push(nr.blade);
                        nr = nrendMap[nr.node.parentId];
                    }
                }
                else if (bladeList.length) {
                    involvedBlades.push(bladeList[0]);
                }
            }
            updateBlades();
            involvedNodes.forEach(function (nr) {
                nr.bringIntoView();
            });
        };


        const selector_onselect = function (selection) {
            for (var id in nrendMap) {
                nrendMap[id].select(id === selection);
            }
            restoreSelectedBlades();
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

        Object.defineProperty(module, 'isOpen', {
            get: function () { return state === AuDrawer.States.OPENED || state === AuDrawer.States.OPENING; }
        });

        module.create = function () {
            //
        };

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
            state = AuDrawer.States.CLOSED;
            rendered = false;
        };

        const bladeList = [], involvedBlades = [], involvedNodes = [];
        var nrendMap = {};
        module.render = function () {
            if (rendered) return;   //TEMP
            var outer = hook.element.children('.aujs-blademenu');
            if (outer.length === 0) {
                outer = $('<div>', { class: 'aujs-blademenu' }).appendTo(hook.element);
            }
            var inner = outer.children('div');
            if (inner.length === 0) {
                inner = $('<div>').appendTo(outer);
            }

            const dw = hook.getActualOption
                ? hook.getActualOption('drawerSize')
                : module.getActualOption('drawerSize');

            inner.css({
                'width': dw,
                'transform': 'translate3d(-' + dw * 1.1 + 'px, 0, 0)'
            });

            //console.log('render')
            const vroot = {
                id: '',
                level: 0,
                label: options.rootBackLabel,
                icon: '',
                children: context.roots
            };
            const blade = new BladeRenderer(module, vroot);
            bladeList.length = 0;
            bladeList.push(blade);
            blade.render(inner);

            const selection = module.selector && module.selector.selection;
            if (selection) {
                const selectedRenderer = nrendMap[selection];
                selectedRenderer && selectedRenderer.select(true);
            }

            rendered = true;
            setTimeout(restoreSelectedBlades, yieldDuration);
        };


        var state = AuDrawer.States.CLOSED;
        module.open = function (cb) {
            if (state === AuDrawer.States.CLOSED) {
                state = AuDrawer.States.OPENING;
                if (this.rendered) {
                    restoreSelectedBlades();
                }
                else {
                    module.render();
                }
                setTimeout(function () {
                    state = AuDrawer.States.OPENED;
                    if ($.isFunction(cb)) cb();
                }, module.getActualOption('transitionDuration'));
            }
        };


        module.close = function (cb) {
            if (state === AuDrawer.States.OPENED) {
                state = AuDrawer.States.CLOSING;
                hook.close && hook.close(true);
                involvedBlades.length = 0;
                involvedNodes.length = 0;
                updateBlades();
                setTimeout(function () {
                    state = AuDrawer.States.CLOSED;
                    if ($.isFunction(cb)) cb();
                }, module.getActualOption('transitionDuration'));
            }
        };


        module.preset = function (s) {
            if (state === s) return;
            state = s;
            switch (state) {
                case AuDrawer.States.OPENING:
                case AuDrawer.States.OPENED:
                    //console.log('preset')
                    if (this.rendered) {
                        restoreSelectedBlades();
                    }
                    else {
                        module.render();
                    }
                    state = AuDrawer.States.OPENED;
                    break;

                case AuDrawer.States.CLOSING:
                case AuDrawer.States.CLOSED:
                    involvedBlades.length = 0;
                    involvedNodes.length = 0;
                    updateBlades();
                    state = AuDrawer.States.CLOSED;
                    break;
            }
        };


        module.back = function () {
            if (state === AuDrawer.States.OPENED) {
                if (involvedBlades.length > 1) {
                    involvedBlades.splice(0, 1);
                    updateBlades();
                }
                else {
                    module.close();
                }
            }
        };


        module.destroy = function () {
            state = AuDrawer.States.CLOSED;
            rendered = false;
            involvedBlades.length = 0;
            involvedNodes.length = 0;
            bladeList.length = 0;
            nrendMap = {};
        };

        return module;
    };



    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return { AuBladeMenuRenderer };
}));
