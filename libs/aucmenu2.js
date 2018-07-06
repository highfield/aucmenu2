
function _NS_(path) {
    var segms = path.split('.');
    var o = window;
    segms.forEach(function (s) {
        o = o[s] = o[s] || {};
    })
    return o;
}


(function (NS, $) {
    'use strict';


    const Sides = Object.freeze({
        LEFT: 'left',
        RIGHT: 'right'
    });


    const States = Object.freeze({
        CLOSED: 'closed',
        OPENING: 'opening',
        OPENED: 'opened',
        CLOSING: 'closing'
    });


    const defaults = {
    }


    function DockerController(context) {
        var rendererInfo = {}, rendererInstance;
        var isContentDirty = true;
        var state = States.CLOSED;

        function setState(value) {
            if (state !== value) {
                state = value;
                overlay.notify(context.side);
            }
        }

        const module = {};
        context.dockerCtl = module;

        module.getOption = function (name) {
            return context.options[name];
        }
        module.setOption = function (name, value) {
            if (state !== States.CLOSED) return;
            context.options[name] = value;
            module.updateRenderer();
        }
        module.setOptions = function (opts) {
            if (state !== States.CLOSED) return;
            $.extend(context.options, opts);
            module.updateRenderer();
        }

        module.isAutoClose = function () {
            return !!rendererInfo.isAutoClose;
        }

        module.getState = function () {
            return state;
        }

        module.open = function () {
            if (state !== States.CLOSED) return;
            if (rendererInstance) {
                setState(States.OPENING);
                rendererInstance.open(function () {
                    setState(States.OPENED);
                });
            }
        }

        module.close = function () {
            if (state !== States.OPENED) return;
            if (rendererInstance) {
                setState(States.CLOSING);
                rendererInstance.close(function () {
                    setState(States.CLOSED);
                });
            }
            else {
                setState(States.CLOSED);
            }
        }

        module.toggle = function () {
            if (state === States.CLOSED) {
                module.open();
            }
            else if (state === States.OPENED) {
                module.close();
            }
        }

        module.invalidateContent = function () {
            isContentDirty = true;
            module.updateRenderer();
        }

        module.updateRenderer = function () {
            var shouldNotify = false, coerceValue;
            const w = $(window).width();
            const info = (w <= 600 && context.options.render_sm) || (w <= 960 && context.options.render_md) || context.options.render_lg;
            if (!info) {
                if (rendererInstance) {
                    rendererInstance.destroyContent(state);
                    rendererInstance.destroy(state);
                    rendererInstance = null;

                    shouldNotify = true;
                    if (rendererInfo.isAutoClose) {
                        coerceValue = false;
                    }
                }
                rendererInfo = {};
            }
            else {
                const contentChanged = (info.contentType !== rendererInfo.contentType) || isContentDirty;
                if (contentChanged) {
                    if (rendererInstance) {
                        rendererInstance.destroyContent(state);
                    }
                }
                //const isAutoCloseChanged = (info.isAutoClose !== rendererInfo.isAutoClose);
                const rendererChanged = (info.rendererType !== rendererInfo.rendererType);
                if (rendererChanged) {
                    const shouldRemoveOverlay = rendererInfo.isAutoClose;
                    if (rendererInstance) {
                        rendererInstance.destroy(state);
                        rendererInstance = null;
                    }
                    rendererInfo = info;
                    rendererInstance = rendererInfo.generator(context);
                    rendererInstance.create(state);

                    shouldNotify = true;
                    if (shouldRemoveOverlay && !rendererInfo.isAutoClose) {
                        coerceValue = false;
                    }
                }
                if (contentChanged) {
                    if (rendererInstance) {
                        rendererInstance.createContent(state);
                    }
                }
            }
            isContentDirty = false;

            if (shouldNotify) {
                overlay.notify(context.side, coerceValue);
            }
        }

        return module;
    }


    const overlay = (function () {
        var element, menuMap = {}, visible = false;

        const module = {};
        module.onClick = $.noop;

        module.init = function (container) {
            element = $('<div>', { class: 'aucmenu-overlay' })
                .css('display', 'none')
                .appendTo(container)
                .on('click', function () {
                    module.onClick && module.onClick();
                });
        }

        module.notify = function (side, coerce) {
            const req = (typeof coerce === 'boolean')
                ? coerce
                : (dockers[side].isAutoClose() && dockers[side].getState() !== States.CLOSED);

            if (req) {
                menuMap[side] = 1;
            }
            else {
                delete menuMap[side];
            }
            const newvis = Object.keys(menuMap).length > 0;
            if (newvis !== visible) {
                visible = newvis;
                element.css('display', visible ? '' : 'none');
            }
        }

        return module;
    })();


    const module = {
        Sides: Sides,
        States: States
    };
    NS.AuDocker = module;

    module.isReady = function () {
        return isReady;
    }

    module.docker = function (side) {
        if (!isReady) return;
        return dockers[side];
    }

    module.each = function (handler) {
        if (!isReady) return;
        for (var kside in Sides) {
            const side = Sides[kside];
            handler(dockers[side], side);
        }
    }


    var dockers = {}, isReady = false;

    $(function () {
        const bay = $('<div>', { class: 'aucmenu-bay' }).appendTo($('body'));
        overlay.init(bay);

        for (var kside in Sides) {
            const side = Sides[kside];
            const elem = $('<div>', { class: 'aucmenu-docker ' + side })
                .css('display', 'none')
                .appendTo(bay);

            dockers[side] = DockerController({
                side: side,
                element: elem,
                options: $.extend({}, defaults)
            });
        }

        $(window).on('resize', function () {
            module.each(function (mc, side) {
                mc.updateRenderer();
            });
        });

        overlay.onClick = function () {
            module.each(function (mc, side) {
                if (mc.isAutoClose()) {
                    mc.close();
                }
            });
        }

        isReady = true;

        module.each(function (mc, side) {
            mc.updateRenderer();
        });

        setTimeout(function () {
            bay.trigger('AuDocker:ready');
        }, 10);
    });


})(_NS_('AuJS'), jQuery);


(function (NS, $) {
    'use strict';

    const offCanvasSize = 300;  //px
    const transitionDuration = 600;     //ms
    const yieldDuration = 10;   //ms


    function generator(options) {
        return function (context) {

            function indent(active) {
                $('body').css('padding-' + context.side, active ? offCanvasSize : '');
            }

            function preset(state, offset) {
                const elementStyle = context.element[0].style;
                switch (state) {
                    case AuJS.AuDocker.States.OPENING:
                    case AuJS.AuDocker.States.OPENED:
                        elementStyle.display = '';
                        elementStyle.transitionDuration = '0ms';
                        elementStyle.transitionProperty = 'transform';
                        elementStyle.transform = 'translate3d(0,0,0)';
                        indent(!options.autoClose);
                        break;

                    case AuJS.AuDocker.States.CLOSING:
                    case AuJS.AuDocker.States.CLOSED:
                        elementStyle.display = 'none';
                        elementStyle.transitionDuration = '0ms';
                        elementStyle.transitionProperty = 'transform';
                        elementStyle.transform = 'translate3d(' + offset + 'px,0,0)';
                        indent(false);
                        break;
                }
            }

            var offset;
            switch (context.side) {
                case AuJS.AuDocker.Sides.LEFT: offset = -offCanvasSize; break;
                case AuJS.AuDocker.Sides.RIGHT: offset = offCanvasSize; break;
            }

            const module = {};

            module.create = function (state) {
                preset(state, offset);
            }

            module.createContent = function (state) {
                if ($.isFunction(options.createContent)) {
                    options.createContent(context);
                }
                //if (state === AuJS.AuDocker.States.OPENED) {
                //    if ($.isFunction(options.createContent)) {
                //        options.createContent(context);
                //    }
                //}
                //else {
                //}
            }

            module.open = function (cb) {
                const elementStyle = context.element[0].style;
                elementStyle.display = '';
                setTimeout(function () {
                    elementStyle.transitionDuration = transitionDuration + 'ms';
                    elementStyle.transitionProperty = 'transform';
                    elementStyle.transform = 'translate3d(0,0,0)';
                    setTimeout(function () {
                        if (!options.autoClose) {
                            indent(true);
                        }
                        cb();
                    }, transitionDuration);
                }, yieldDuration);
            }

            module.close = function (cb) {
                elementStyle.transitionDuration = transitionDuration + 'ms';
                elementStyle.transitionProperty = 'transform';
                elementStyle.transform = 'translate3d(' + offset + 'px,0,0)';
                if (!options.autoClose) {
                    indent(false);
                }
                setTimeout(function () {
                    elementStyle.display = 'none';
                    cb();
                }, transitionDuration);
            }

            module.destroyContent = function (state) {
                if ($.isFunction(options.destroyContent)) {
                    options.destroyContent(context);
                }
                else {
                    context.element.empty();
                }
            }

            module.destroy = function (state) {
                preset(state, offset);
            }

            return module;
        }
    }


    NS.GenericContainer = function (options) {
        if (!$.isPlainObject(options)) options = {};

        return {
            rendererType: options.autoClose ? 'genctr-overlap' : 'genctr-dockable',
            contentType: 'genctr+any',
            isAutoClose: !!options.autoClose,
            generator: generator(options)
        }
    }


})(_NS_('AuJS.AuDockerRenderers'), jQuery);


(function (NS, $) {
    'use strict';

    const uuid = (function () {
        var n = 0;
        return function () {
            return 'autreemenu_node_' + (n++);
        }
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
        function Node(context, id) {
            const self = this;

            Object.defineProperty(this, 'id', {
                value: id,
                writable: false
            });

            Object.defineProperty(this, 'expandable', {
                get: function () { return self.children.length !== 0; }
            });

            this.parentId = null;
            this.level = 0;
            this.label = null;
            this.icon = null;
            this.children = [];
        }


        function scan(source, parentId, level) {
            if ($.isPlainObject(source)) {
                const id = source.id || uuid();
                var node = context.nodeMap[id];
                if (!node) {
                    node = context.nodeMap[id] = new Node(context, id);
                }
                node.parentId = parentId;
                node.level = level;
                node.label = source.label;
                node.icon = source.icon;
                node.children = Array.isArray(source.items) ? scan(source.items, id, level + 1) : [];
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

        const context = {
            roots: [],
            nodeMap: {}
        }
        const module = {};

        module._getContext = function () {
            return context;
        }

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
        }

        module.getNodes = function () {
            return context.nodeMap.values();
        }

        var xdata = {};
        module.getData = function () { return xdata; }
        module.setData = function (data) {
            xdata = data || {};
            context.roots = scan(xdata, null, 0);
        }

        return module;
    }


    NS.MenuSelectorSingle = function () {

        const listeners = [];
        const module = {};

        module.addListener = function (ls) {
            if (!ls || listeners.indexOf(ls) >= 0) return;
            listeners.push(ls);
        }

        module.removeListener = function (ls) {
            if (!ls) return;
            const ix = listeners.indexOf(ls);
            if (ix >= 0) {
                listeners.splice(ix, 1);
            }
        }

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
    }


    NS.TreeMenuRenderer = function (struct, container, options) {

        const itemHeight = 40;
        const expSymbol = 'fas fa-angle-right';
        const transitionDuration = 200;     //ms
        const yieldDuration = 10;   //ms

        const context = struct._getContext();


        function NodeRenderer(node) {
            const self = this;
            var state = 'C';

            Object.defineProperty(this, 'node', {
                value: node,
                writable: false
            });

            var selected = false;
            Object.defineProperty(this, 'selected', {
                get: function () { return selected; }
            });

            this.expanded = false;
            this.rendered = false;

            this.element = null;
            this.itemCtr = null;
            this.outlineBay = null;
            this.outline = null;

            this.render = function (parentElement, parentOutlineBay) {
                self.element = $('<div>', { class: 'au-treemenu-node level' + node.level, 'data-id': node.id })
                    .appendTo(parentElement);

                selected && self.element.addClass('selected');

                const header = $('<div>', { class: 'au-treemenu-node-header' }).css({
                    'height': itemHeight
                }).appendTo(self.element);


                //block to host the expander button, whereas useful
                const xhost = $('<div>', { class: 'exp' }).appendTo(header);

                //main button, as the node selection button, and related handler
                const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (module.selector) {
                        module.selector.selection = node.id;
                    }
                    return false;
                });

                //node main face: text and optional icon
                const inner = $('<div>', { class: 'au-treemenu-node-caption' }).appendTo(mbtn);
                const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(node.label);
                const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    $('<i>', { class: node.icon }).appendTo(hostIcon);
                }

                //outline-bay to host the children's outlines
                self.outlineBay = $('<div>', {
                    class: 'au-treemenu-node-outline-bay'
                }).appendTo(self.element);

                if (parentOutlineBay) {
                    self.outline = $('<div>', { class: 'au-treemenu-node-outline' }).appendTo(parentOutlineBay);
                }

                //children nodes host
                self.itemsCtr = $('<div>', { class: 'au-treemenu-node-items' }).appendTo(self.element);

                if (node.expandable) {
                    //expander button and related handler
                    const xbtn = $('<a>', { href: '#' }).appendTo(xhost).on('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        self.cmdexp();
                        return false;
                    });

                    const xbtnContent = $('<i>', { class: expSymbol }).appendTo(xbtn);
                    const xbtnContentStyle = xbtnContent[0].style;

                    const itemsCtrStyle = self.itemsCtr[0].style;

                    if (self.expanded) {
                        state = 'O';
                        xbtnContentStyle.transition = '';
                        xbtnContentStyle.transform = 'rotate(90deg)';
                    }
                    else {
                        state = 'C';
                        itemsCtrStyle.transition = '';
                        itemsCtrStyle.opacity = 0;
                        itemsCtrStyle.height = 0;
                    }
                }

                node.children.forEach(function (cid) {
                    const child = context.nodeMap[cid];
                    const nrend = nrendMap[cid] = new NodeRenderer(child);
                    nrend.render(self.itemsCtr, self.outlineBay);
                });

                self.rendered = true;
                self.updateChildrenOutlines();
            }

            this.updateSiblingOutlines = function () {
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.updateSiblingOutlines();
                    parent.updateChildrenOutlines();
                }
            }

            this.updateChildrenOutlines = function () {
                if (!self.rendered) return;
                var h = itemHeight;
                node.children.forEach(function (cid) {
                    const child = nrendMap[cid];
                    child.outline.css('height', h - 4);
                    h += child.element.height();
                });
                self.showOutlineBay(self.expanded);
            }

            this.showOutlineBay = function (value) {
                if (!self.rendered) return;
                self.outlineBay.css('opacity', value ? 1 : 0);
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.showOutlineBay(value);
                }
            }

            this.expand = function () {
                if (!self.rendered) {
                    state = 'O';
                }
                else if (state === 'C' && node.expandable) {
                    state = 'o';
                    self.showOutlineBay(false);

                    const button = self.element
                        .children('.au-treemenu-node-header')
                        .find('.exp > a')
                        .children();
                    const buttonStyle = button[0].style;
                    buttonStyle.transitionDuration = transitionDuration + 'ms';
                    buttonStyle.transitionProperty = 'transform';
                    buttonStyle.transform = 'rotate(90deg)';

                    const itemsCtrStyle = self.itemsCtr[0].style;
                    itemsCtrStyle.transition = '';
                    itemsCtrStyle.opacity = 0;
                    itemsCtrStyle.height = 0;

                    setTimeout(function () {
                        itemsCtrStyle.transitionDuration = transitionDuration + 'ms';
                        itemsCtrStyle.transitionProperty = 'opacity, height';
                        itemsCtrStyle.opacity = 1;
                        itemsCtrStyle.height = self.getChildrenHeight() + 'px';

                        setTimeout(function () {
                            state = 'O';
                            itemsCtrStyle.height = 'auto';
                            self.updateSiblingOutlines();
                            self.showOutlineBay(true);
                        }, transitionDuration);
                    }, yieldDuration);
                }
            }

            this.collapse = function () {
                if (!self.rendered) {
                    state = 'C';
                }
                else if (state === 'O' && node.expandable) {
                    state = 'c';
                    self.showOutlineBay(false);

                    const button = self.element
                        .children('.au-treemenu-node-header')
                        .find('.exp > a')
                        .children();
                    const buttonStyle = button[0].style;
                    buttonStyle.transitionDuration = transitionDuration + 'ms';
                    buttonStyle.transitionProperty = 'transform';
                    buttonStyle.transform = 'rotate(0deg)';

                    const itemsCtrStyle = self.itemsCtr[0].style;
                    itemsCtrStyle.transition = '';
                    itemsCtrStyle.opacity = 1;
                    itemsCtrStyle.height = self.getChildrenHeight() + 'px';

                    setTimeout(function () {
                        itemsCtrStyle.transitionDuration = transitionDuration + 'ms';
                        itemsCtrStyle.transitionProperty = 'opacity, height';
                        itemsCtrStyle.opacity = 0;
                        itemsCtrStyle.height = 0;

                        setTimeout(function () {
                            state = 'C';
                            self.updateSiblingOutlines();
                        }, transitionDuration);
                    }, yieldDuration);
                }
            }

            this.cmdexp = function () {
                if (state === 'C') {
                    self.expand();
                }
                else if (state === 'O') {
                    self.collapse();
                }
            }

            this.expandParents = function () {
                self.expand();
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.expandParents();
                }
            }

            this.select = function (value) {
                value = !!value;
                if (selected !== value) {
                    selected = value;
                    if (self.rendered) {
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
            }

            this.bringIntoView = function () {
                if (!self.rendered) return;
                const excess = 1.2;
                setTimeout(function () {
                    //quick and dirty 'bringIntoView'
                    var outerElement = container[0];
                    var outerRect = outerElement.getBoundingClientRect();
                    var selfRect = self.element[0].getBoundingClientRect();
                    if (selfRect.top < outerRect.top) {
                        outerElement.scrollTop = outerElement.scrollTop - (outerRect.top - selfRect.top) * excess;
                    }
                    else if (selfRect.top + selfRect.height > outerRect.top + outerRect.height) {
                        outerElement.scrollTop = outerElement.scrollTop + (selfRect.top + selfRect.height - outerRect.top - outerRect.height) * excess;
                    }
                }, transitionDuration * excess);
            }

            this.getChildrenHeight = function () {
                var h = 0;
                self.itemsCtr.children()
                    .each(function () {
                        h += $(this).height();
                    });
                return h;
            }
        }


        const selector_onselect = function (selection) {
            for (var id in nrendMap) {
                nrendMap[id].select(id === selection);
            }
        }


        if (!$.isPlainObject(options)) {
            options = {};
        }

        const module = {};

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


        var nrendMap = {};
        module.render = function () {
            container.addClass('au-treemenu');

            context.roots.forEach(function (id) {
                const node = context.nodeMap[id];
                const nrend = nrendMap[id] = new NodeRenderer(node);
                nrend.render(container, null);
            });

            const selection = module.selector && module.selector.selection;
            if (selection) {
                const selectedRenderer = nrendMap[selection];
                selectedRenderer && selectedRenderer.select(true);
            }
        }


        module.destroy = function () {
            nrendMap = {};
            container.removeClass('au-treemenu');
            container.empty();
        }

        return module;
    }


    NS.BladeMenuRenderer = function (struct, container, options) {

        const itemHeight = 40;
        const backSymbol = 'fas fa-angle-right';
        const expSymbol = 'fas fa-angle-right';
        const transitionDuration = 800;     //ms
        const yieldDuration = 10;   //ms

        const context = struct._getContext();


        function BladeRenderer(node) {
            const self = this;
            var state = 'C';

            this.rendered = false;
            this.element = null;
            this.itemCtr = null;

            this.render = function (bladeContainer) {
                self.element = $('<div>', { class: 'au-blademenu blade level' + node.level})
                    .appendTo(bladeContainer);

                const header = $('<div>', { class: 'header' }).css({
                    'height': itemHeight
                }).appendTo(self.element);


                //block to host the back button
                const bhost = $('<div>', { class: 'back' }).appendTo(header);

                //back button and related handler
                const bbtn = $('<a>', { href: '#' }).appendTo(bhost).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    //
                    return false;
                });

                const bbtnContent = $('<i>', { class: backSymbol }).appendTo(bbtn);

                //main button, as the node selection button, and related handler
                const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (module.selector) {
                        module.selector.selection = node.id;
                    }
                    return false;
                });

                //node main face: text and optional icon
                const inner = $('<div>', { class: 'caption' }).appendTo(mbtn);
                const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(node.label);
                const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    $('<i>', { class: node.icon }).appendTo(hostIcon);
                }

                //children nodes host
                self.itemsCtr = $('<div>', { class: 'items' }).appendTo(self.element);

                node.children.forEach(function (id) {
                    const child = context.nodeMap[id];
                    const nrend = nrendMap[id] = new NodeRenderer(self, child);
                    nrend.render(self.itemsCtr, bladeContainer);
                });

                self.rendered = true;
            }

            this.expand = function () {
            }

            this.collapse = function () {
            }

            this.expandParents = function () {
            }
        }


        function NodeRenderer(blade, node) {
            const self = this;

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

            this.rendered = false;
            this.element = null;

            this.render = function (parentElement, bladeContainer) {
                self.element = $('<div>', { class: 'au-blademenu node', 'data-id': node.id })
                    .appendTo(parentElement);

                selected && self.element.addClass('selected');

                const header = $('<div>', { class: 'header' }).css({
                    'height': itemHeight
                }).appendTo(self.element);


                //block to host the expander button, whereas useful
                const xhost = $('<div>', { class: 'exp' }).appendTo(header);

                //main button, as the node selection button, and related handler
                const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (module.selector) {
                        module.selector.selection = node.id;
                    }
                    return false;
                });

                //node main face: text and optional icon
                const inner = $('<div>', { class: 'caption' }).appendTo(mbtn);
                const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(node.label);
                const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    $('<i>', { class: node.icon }).appendTo(hostIcon);
                }

                if (node.children.length) {
                    const childBlade = new BladeRenderer(node);
                    bladeList.push(childBlade);
                    childBlade.render(bladeContainer);
                }

                self.rendered = true;
            }

            this.select = function (value) {
            }
        }


        const selector_onselect = function (selection) {
            //for (var id in nrendMap) {
            //    nrendMap[id].select(id === selection);
            //}
        }


        if (!$.isPlainObject(options)) {
            options = {};
        }

        const module = {};

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


        var bladeList = [];
        var nrendMap = {};
        module.render = function () {
            const host = $('<div>', { class: 'au-blademenu' }).appendTo(container);

            const vroot = {
                id: '',
                level: 0,
                label: 'Menu title',
                icon: '',
                children: context.roots
            };
            const blade = new BladeRenderer(vroot);
            bladeList.push(blade);
            blade.render(host);

            const selection = module.selector && module.selector.selection;
            if (selection) {
                const selectedRenderer = nrendMap[selection];
                selectedRenderer && selectedRenderer.select(true);
            }
        }


        module.destroy = function () {
            bladeList = [];
            nrendMap = {};
            container.empty();
        }

        return module;
    }

})(_NS_('AuJS'), jQuery);
