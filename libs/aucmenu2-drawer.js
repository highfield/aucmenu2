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


    const Sides = Object.freeze({
        LEFT: 'left',
        RIGHT: 'right'
    });
    NS.Sides = Sides;


    const States = Object.freeze({
        CLOSED: 'closed',
        OPENING: 'opening',
        OPENED: 'opened',
        CLOSING: 'closing'
    });
    NS.States = States;


    const defaults = Object.freeze({
        drawerSize: 300,            //px
        transitionDuration: 300     //ms
    });


    const yieldDuration = 10;   //ms


    NS.Overlay = (function () {

        const module = {};

        var created = false;
        Object.defineProperty(module, 'created', {
            get: function () { return created; }
        });

        var visible = false;
        Object.defineProperty(module, 'visible', {
            get: function () { return visible; }
        });

        Object.defineProperty(module, 'container', {
            get: function () { return bay; }
        });

        var bay, element;
        module.create = function () {
            if (created) return;
            //if (bay && element) return;
            bay = $('body > div.aujs-drawer-bay');
            if (bay.length === 0) {
                bay = $('<div>', { class: 'aujs-drawer-bay' }).appendTo($('body'));
            }

            element = bay.children('.aujs-drawer-overlay');
            if (element.length === 0) {
                element = $('<div>', { class: 'aujs-drawer-overlay' })
                    .css('display', 'none')
                    .appendTo(bay);
            }
            created = true;
        };

        const busyItems = [];
        module.notify = function (item, coerce) {
            const req = typeof coerce === 'boolean'
                ? coerce
                : item.isAutoClose && item.state !== States.CLOSED;

            const ix = busyItems.indexOf(item);
            if (req) {
                if (ix < 0) {
                    busyItems.push(item);
                }
            }
            else if (ix >= 0) {
                busyItems.splice(ix, 1);
            }
            const newvis = busyItems.length > 0;
            if (newvis !== visible) {
                visible = newvis;
                element.css('display', visible ? '' : 'none');
            }
        };

        module.destroy = function () {
            if (bay) {
                bay.remove();
            }
            bay = element = null;
            created = false;
        };

        return module;
    })();


    NS.Controller = function () {

        function DrawerItem(side, container, opts) {

            const options = Object.freeze(
                $.extend({}, opts)
            );

            var rendererInfo = {};
            var isContentDirty = true;
            var state = States.CLOSED;

            function setState(value) {
                if (state !== value) {
                    state = value;
                    NS.Overlay.notify(module);
                    if ($.isFunction(options.onStateChanged)) {
                        options.onStateChanged(state);
                    }
                }
            }

            function getActualDrawerOffset() {
                switch (side) {
                    case Sides.LEFT: return -module.getActualOption('drawerSize');
                    case Sides.RIGHT: return module.getActualOption('drawerSize');
                }
            }

            function indent(active) {
                if ($.isFunction(rendererInfo.indent)) {
                    var padding = '';
                    if (active && !rendererInfo.isAutoClose) {
                        padding = module.getActualOption('drawerSize');
                    }
                    rendererInfo.indent(active, padding);
                    //$('body').css('padding-' + side, padding);
                }
            }

            function preset(s) {
                if (rendererInfo.customDrawer) {
                    s = States.OPENED;
                }
                const elementStyle = element[0].style;
                elementStyle.width = module.getActualOption('drawerSize') + 'px';
                switch (s) {
                    case States.OPENING:
                    case States.OPENED:
                        elementStyle.visibility = rendererInfo.isAutoClose ? 'hidden' : '';
                        //elementStyle.visibility = '';
                        elementStyle.transitionDuration = '0ms';
                        elementStyle.transitionProperty = 'transform';
                        elementStyle.transform = 'translate3d(0,0,0)';
                        indent(true);
                        break;

                    case States.CLOSING:
                    case States.CLOSED:
                        elementStyle.visibility = 'hidden';
                        elementStyle.transitionDuration = '0ms';
                        elementStyle.transitionProperty = 'transform';
                        elementStyle.transform = 'translate3d(' + getActualDrawerOffset() + 'px,0,0)';
                        indent(false);
                        break;
                }
            }


            const module = {};

            module.getActualOption = function (pname) {
                return rendererInfo[pname] > 0
                    ? rendererInfo[pname]
                    : defaults[pname];
            };

            Object.defineProperty(module, 'side', {
                get: function () { return side; }
            });

            var rendered = false;
            Object.defineProperty(module, 'rendered', {
                get: function () { return rendered; }
            });

            Object.defineProperty(module, 'rendererName', {
                get: function () { return rendererInfo && rendererInfo.name; }
            });

            Object.defineProperty(module, 'isAutoClose', {
                get: function () { return !!rendererInfo.isAutoClose; }
            });

            Object.defineProperty(module, 'state', {
                get: function () { return state; }
            });

            var element;
            Object.defineProperty(module, 'element', {
                get: function () { return element; }
            });

            module.create = function () {
                if (rendered) return;
                element = $('<div>', { class: 'aujs-drawer ' + side })
                    .css({
                        'visibility': 'hidden'
                    })
                    .appendTo(container);
                rendered = true;
                module.invalidateContent();
            };

            module.open = function (coerce) {
                if (coerce === true && rendererInfo.customDrawer) {
                    //preset(States.OPENED);
                    setState(States.OPENED);
                }
                else {
                    if (state !== States.CLOSED) return;
                    if (rendererInfo.renderer) {
                        setState(States.OPENING);
                        if (rendererInfo.customDrawer) {
                            preset(state);
                            rendererInfo.renderer.open(function () {
                                setState(States.OPENED);
                            });
                        }
                        else {
                            const elementStyle = element[0].style;
                            elementStyle.visibility = '';
                            setTimeout(function () {
                                elementStyle.transitionDuration = module.getActualOption('transitionDuration') + 'ms';
                                elementStyle.transitionProperty = 'transform';
                                elementStyle.transform = 'translate3d(0,0,0)';
                                setTimeout(function () {
                                    if (!rendererInfo.isAutoClose) {
                                        indent(true);
                                    }
                                    setState(States.OPENED);
                                }, module.getActualOption('transitionDuration'));
                            }, yieldDuration);
                        }
                    }
                }
            };

            module.close = function (coerce) {
                if (coerce === true && rendererInfo.customDrawer) {
                    setState(States.CLOSED);
                }
                else {
                    if (state !== States.OPENED) return;
                    if (rendererInfo.renderer) {
                        setState(States.CLOSING);
                        if (rendererInfo.customDrawer) {
                            rendererInfo.renderer.close(function () {
                                setState(States.CLOSED);
                            });
                        }
                        else {
                            const elementStyle = element[0].style;
                            elementStyle.transitionDuration = module.getActualOption('transitionDuration') + 'ms';
                            elementStyle.transitionProperty = 'transform';
                            elementStyle.transform = 'translate3d(' + getActualDrawerOffset() + 'px,0,0)';
                            if (!rendererInfo.isAutoClose) {
                                indent(false);
                            }
                            setTimeout(function () {
                                elementStyle.visibility = 'hidden';
                                setState(States.CLOSED);
                            }, module.getActualOption('transitionDuration'));
                        }
                    }
                    else {
                        setState(States.CLOSED);
                    }
                }
            };

            module.toggle = function () {
                if (state === States.CLOSED) {
                    module.open();
                }
                else if (state === States.OPENED) {
                    module.close();
                }
            };

            module.invalidateContent = function () {
                isContentDirty = true;
                module.updateRenderer();
            };

            module.updateRenderer = function () {
                var shouldNotify = false, coerceValue;
                const w = $(window).width();
                const info = w <= 600 && options.render_sm || w <= 960 && options.render_md || options.render_lg;
                if (!info || !info.renderer) {
                    if (rendererInfo.renderer) {
                        rendererInfo.renderer.detach(module);
                        if (!rendererInfo.persistent) {
                            rendererInfo.renderer.destroy();
                        }

                        shouldNotify = true;
                        if (rendererInfo.isAutoClose) {
                            coerceValue = false;
                        }
                    }
                    rendererInfo = {};
                }
                else {
                    if (rendererInfo !== info || isContentDirty) {
                        const shouldRemoveOverlay = rendererInfo.isAutoClose;
                        if (rendererInfo.renderer) {
                            rendererInfo.renderer.detach(module);
                            if (!rendererInfo.persistent) {
                                rendererInfo.renderer.destroy();
                            }
                            rendererInfo = {};
                        }
                        rendererInfo = info;
                        if (!rendererInfo.persistent) {
                            rendererInfo.renderer.create();
                        }
                        rendererInfo.renderer.attach(module);
                        preset(state);
                        if (rendererInfo.customDrawer) {
                            //if (rendererInfo.isAutoClose) {
                            //    preset(States.OPENED);
                            //    element.css('visibility', 'hidden');
                            //}
                            //setTimeout(function () {
                            //    rendererInfo.renderer.preset(state);
                            //}, yieldDuration);
                            rendererInfo.renderer.preset(state);
                        }
                        //else {
                        //    preset(state);
                        //}

                        shouldNotify = true;
                        if (shouldRemoveOverlay && !rendererInfo.isAutoClose) {
                            coerceValue = false;
                        }
                    }
                }
                isContentDirty = false;

                if (shouldNotify) {
                    NS.Overlay.notify(module, coerceValue);
                }
            };

            module.destroy = function () {
                if (rendered) {
                    NS.Overlay.notify(module, false);
                    element.remove();
                }
                element = null;
                rendered = false;
            };

            return module;
        }


        const resize = function () {
            drawers.forEach(function (d) {
                d.updateRenderer();
            });
        };

        const overlayClick = function (e) {
            if ($(e.target).closest('.aujs-drawer-overlay').length) {
                drawers.forEach(function (d) {
                    if (d.isAutoClose) {
                        d.close();
                    }
                });
            }
        };

        const module = {};

        var rendered = false;
        Object.defineProperty(module, 'rendered', {
            get: function () { return rendered; }
        });


        const drawers = [];
        module.add = function (side, opts) {
            if (rendered) {
                throw new Error('Invalid operation.');
            }
            if (Object.values(Sides).indexOf(side) < 0) {
                throw new Error('Invalid argument "side".');
            }
            NS.Overlay.create();
            const item = DrawerItem(side, NS.Overlay.container, opts);
            drawers.push(item);
            return item;
        };

        module.remove = function (item) {
            if (rendered) {
                throw new Error('Invalid operation.');
            }
            if (!item) return;
            const ix = drawers.indexOf(item);
            if (ix >= 0) {
                drawers.splice(ix, 1);
            }
        };


        module.create = function () {
            if (rendered) return;

            drawers.forEach(function (d) {
                d.create();
            });

            $(NS.Overlay.container).on('click', overlayClick);
            $(window).on('resize', resize);
            rendered = true;
        };

        module.destroy = function () {
            $(window).off('resize', resize);
            $(NS.Overlay.container).off('click', overlayClick);

            drawers.forEach(function (d) {
                d.destroy();
            });
            rendered = false;
        };

        return module;
    };

})(window._AuJS_NS_('AuJS.Drawer'), jQuery);

