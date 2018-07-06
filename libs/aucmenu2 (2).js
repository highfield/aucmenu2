
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
                        //context.element.css({
                        //    'display': '',
                        //    'transform': 'translate3d(0,0,0)',
                        //    'transition-duration': '0ms',
                        //    'transition-property': 'transform'
                        //});
                        indent(!options.autoClose);
                        break;

                    case AuJS.AuDocker.States.CLOSING:
                    case AuJS.AuDocker.States.CLOSED:
                        elementStyle.display = 'none';
                        elementStyle.transitionDuration = '0ms';
                        elementStyle.transitionProperty = 'transform';
                        elementStyle.transform = 'translate3d(' + offset + 'px,0,0)';
                        //context.element.css({
                        //    'display': 'none',
                        //    'transform': 'translate3d(' + offset + 'px,0,0)',
                        //    'transition-duration': '0ms',
                        //    'transition-property': 'transform'
                        //});
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
                //context.element.css({
                //    'display': '',
                //});
                setTimeout(function () {
                    elementStyle.transitionDuration = transitionDuration + 'ms';
                    elementStyle.transitionProperty = 'transform';
                    elementStyle.transform = 'translate3d(0,0,0)';
                    //context.element.css({
                    //    'transform': 'translate3d(0,0,0)',
                    //    'transition-duration': transitionDuration + 'ms',
                    //    'transition-property': 'transform'
                    //});
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
                //context.element.css({
                //    'transform': 'translate3d(' + offset + 'px,0,0)',
                //    'transition-duration': transitionDuration + 'ms',
                //    'transition-property': 'transform'
                //});
                if (!options.autoClose) {
                    indent(false);
                }
                setTimeout(function () {
                    elementStyle.display = 'none';
                    //context.element.css({
                    //    'display': 'none'
                    //});
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

    const itemHeight = 40;
    const expSymbol = 'fas fa-angle-right';
    const transitionDuration = 200;     //ms
    const yieldDuration = 10;   //ms

    const uuid = (function () {
        var n = 0;
        return function () {
            return 'autreemenu_node_' + (n++);
        }
    })();

    /**
     * node schema:
     *  id: (string) ID which characterizes the node itself
     *  parentId: (string) ref-ID to the parent node, or <null> for a root node
     *  level: (number) non-negative integer indicating the depth level, where zero is a root
     *  expandable: (bool) indicates whether the node can be expanded or not
     *  expanded: (bool) indicates whether the node is expanded or not
     *  label: (string)
     *  icon: (string)
     *  children: (array) list of ID-references to the children nodes
     *  
     *  _ui.element: (jQuery) reference to the main container of the node
     *  _ui.outlineBay: (jQuery) reference to the container for the tree-outlines of the children nodes
     *  _ui.outline: (jQuery) reference to the tree-outline of the node
     */
    function Node(context, id) {
        const self = this;
        var state = 'C';
        var selected = false;
        var ui = null;

        Object.defineProperty(this, 'id', {
            value: id,
            writable: false
        });

        Object.defineProperty(this, 'expandable', {
            get: function () { return self.children.length !== 0; }
        });

        Object.defineProperty(this, 'expanded', {
            get: function () { return state === 'O' || state === 'o'; }
        });

        Object.defineProperty(this, 'selected', {
            get: function () { return selected; }
        });

        Object.defineProperty(this, 'rendered', {
            get: function () { return !!ui; }
        });

        Object.defineProperty(this, '_ui', {
            get: function () { return ui; }
        });

        this.parentId = null;
        this.level = 0;
        this.label = null;
        this.icon = null;
        this.children = [];

        this.render = function (parentElement, parentOutlineBay) {
            ui = {
                element: null,
                itemsCtr: null,
                outlineBay: null,
                outline: null
            }

            ui.element = $('<div>', { class: 'autreemenu-node level' + self.level, 'data-id': id })
                .appendTo(parentElement);

            selected && ui.element.addClass('selected');

            const header = $('<div>', { class: 'autreemenu-node-header' }).css({
                'height': itemHeight
            }).appendTo(ui.element);

            //block to host the expander button, whereas useful
            const xhost = $('<div>', { class: 'exp' }).appendTo(header);

            //main button, as the node selection button, and related handler
            const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                self.select();
                return false;
            });

            //node main face: text and optional icon
            const inner = $('<div>', { class: 'autreemenu-node-caption' }).appendTo(mbtn);
            const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(self.label);
            const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

            if (self.icon) {
                $('<i>', { class: self.icon }).appendTo(hostIcon);
            }

            //outline-bay to host the children's outlines
            ui.outlineBay = $('<div>', {
                class: 'autreemenu-node-outline-bay'
            }).appendTo(ui.element);

            if (parentOutlineBay) {
                ui.outline = $('<div>', { class: 'autreemenu-node-outline' }).appendTo(parentOutlineBay);
            }

            //children nodes host
            ui.itemsCtr = $('<div>', { class: 'autreemenu-node-items' }).appendTo(ui.element);

            if (self.expandable) {
                //expander button and related handler
                const xbtn = $('<a>', { href: '#' }).appendTo(xhost).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self.cmdexp();
                    return false;
                });

                const xbtnContent = $('<i>', { class: expSymbol }).appendTo(xbtn);
                const xbtnContentStyle = xbtnContent[0].style;

                const itemsCtrStyle = ui.itemsCtr[0].style;

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

            self.children.forEach(function (cid) {
                const child = context.nodeMap[cid];
                child.render(ui.itemsCtr, ui.outlineBay);
            });

            self.updateChildrenOutlines();
        }

        this.updateSiblingOutlines = function () {
            var parent = context.nodeMap[self.parentId];
            if (parent) {
                parent.updateSiblingOutlines();
                parent.updateChildrenOutlines();
            }
        }

        this.updateChildrenOutlines = function () {
            if (!self.rendered) return;
            var h = itemHeight;
            self.children.forEach(function (cid) {
                const child = context.nodeMap[cid];
                child._ui.outline.css('height', h - 4);
                h += child._ui.element.height();
            });
            self.showOutlineBay(self.expanded);
        }

        this.showOutlineBay = function (value) {
            if (!self.rendered) return;
            ui.outlineBay.css('opacity', value ? 1 : 0);
            var parent = context.nodeMap[self.parentId];
            if (parent) {
                parent.showOutlineBay(value);
            }
        }

        this.expand = function () {
            if (!self.rendered) {
                state = 'O';
            }
            else if (state === 'C' && self.expandable) {
                state = 'o';
                self.showOutlineBay(false);

                const button = ui.element
                    .children('.autreemenu-node-header')
                    .find('.exp > a')
                    .children();
                const buttonStyle = button[0].style;
                buttonStyle.transitionDuration = transitionDuration + 'ms';
                buttonStyle.transitionProperty = 'transform';
                buttonStyle.transform = 'rotate(90deg)';

                const itemsCtrStyle = ui.itemsCtr[0].style;
                itemsCtrStyle.transition = '';
                itemsCtrStyle.opacity = 0;
                itemsCtrStyle.height = 0;

                setTimeout(function () {
                    itemsCtrStyle.transitionDuration = transitionDuration + 'ms';
                    itemsCtrStyle.transitionProperty = 'opacity, height';
                    itemsCtrStyle.opacity = 1;
                    itemsCtrStyle.height = self._getChildrenHeight() + 'px';

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
            else if (state === 'O' && self.expandable) {
                state = 'c';
                self.showOutlineBay(false);

                const button = ui.element
                    .children('.autreemenu-node-header')
                    .find('.exp > a')
                    .children();
                const buttonStyle = button[0].style;
                buttonStyle.transitionDuration = transitionDuration + 'ms';
                buttonStyle.transitionProperty = 'transform';
                buttonStyle.transform = 'rotate(0deg)';

                const itemsCtrStyle = ui.itemsCtr[0].style;
                itemsCtrStyle.transition = '';
                itemsCtrStyle.opacity = 1;
                itemsCtrStyle.height = self._getChildrenHeight() + 'px';

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

        this._expandParents = function () {
            self.expand();
            var parent = context.nodeMap[self.parentId];
            if (parent) {
                parent._expandParents();
            }
        }

        this.select = function (value) {
            if (arguments.length === 0) value = true;
            self._select(value, true);
        }

        this._select = function (value, notify) {
            value = !!value;
            if (selected !== value) {
                selected = value;
                if (self.rendered) {
                    if (selected) {
                        ui.element.addClass('selected');
                    }
                    else {
                        ui.element.removeClass('selected');
                    }
                }
                if (notify) {
                    context.onselect(id, selected);
                }
            }
            if (selected) {
                self._expandParents();
                self.bringIntoView();
            }
        }

        this.bringIntoView = function () {
            if (!self.rendered) return;
            const excess = 1.2;
            setTimeout(function () {
                //quick and dirty 'bringIntoView'
                var outerElement = context.getContainer()[0];
                var outerRect = outerElement.getBoundingClientRect();
                var selfRect = ui.element[0].getBoundingClientRect();
                if (selfRect.top < outerRect.top) {
                    outerElement.scrollTop = outerElement.scrollTop - (outerRect.top - selfRect.top) * excess;
                }
                else if (selfRect.top + selfRect.height > outerRect.top + outerRect.height) {
                    outerElement.scrollTop = outerElement.scrollTop + (selfRect.top + selfRect.height - outerRect.top - outerRect.height) * excess;
                }
            }, transitionDuration * excess);
        }

        this._getChildrenHeight = function () {
            var h = 0;
            ui.itemsCtr.children()
                .each(function () {
                    h += $(this).height();
                });
            return h;
        }

        this.destroy = function () {
            ui = null;
        }
    }


    NS.MenuStruct = function (/*container,*/ options) {

        function scan(source, parentId, level) {
            if ($.isPlainObject(source)) {
                const id = source.id || uuid();
                var node = context.nodeMap[id];
                if (!node) {
                    node = context.nodeMap[id] = new Node(context, id);
                }
                node.parentId = parentId;
                node.level = level;
                node.label = source.label || '';
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


        //function render() {
        //    container.addClass('autreemenu');

        //    context.roots.forEach(function (id) {
        //        const node = context.nodeMap[id];
        //        node.render(container, null);
        //    });

        //    const selectedNode = module.getNode(selId);
        //    selectedNode && selectedNode.bringIntoView();
        //}


        //function destroy() {
        //    for (var id in context.nodeMap) {
        //        context.nodeMap[id].destroy();
        //    }
        //    container.removeClass('autreemenu');
        //    container.empty();
        //}


        function onselect(nodeId, value) {
            if (value) {
                for (var id in context.nodeMap) {
                    if (id !== nodeId) {
                        context.nodeMap[id]._select(false, false);
                    }
                }
                selId = nodeId;
            }
            else if (selId === nodeId) {
                selId = null;
            }

            //notify change
            if ($.isFunction(options.onselect)) {
                const node = selId && context.nodeMap[selId];
                options.onselect(node);
            }
        }

        if (!$.isPlainObject(options)) {
            options = {};
        }

        const context = {
            roots: [],
            nodeMap: {},
            onselect: onselect,
            //getContainer: function () {
            //    return container;
            //}
        }
        const module = {};

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

        var selId;
        module.getSelected = function () {
            return selId && context.nodeMap[selId];
        }
        module.selectNone = function () {
            const node = module.getNode(selId);
            node && node.select(false);
        }

        //module.render = render;
        //module.destroy = destroy;

        return module;
    }


    NS.TreeMenuRenderer = function (struct, container, options) {

        function render() {
            container.addClass('autreemenu');

            context.roots.forEach(function (id) {
                const node = context.nodeMap[id];
                node.render(container, null);
            });

            const selectedNode = module.getNode(selId);
            selectedNode && selectedNode.bringIntoView();
        }


        function destroy() {
            for (var id in context.nodeMap) {
                context.nodeMap[id].destroy();
            }
            container.removeClass('autreemenu');
            container.empty();
        }


        if (!$.isPlainObject(options)) {
            options = {};
        }

        const context = {
            roots: [],
            nodeMap: {},
            onselect: onselect,
            getContainer: function () {
                return container;
            }
        }
        const module = {};

        module.render = render;
        module.destroy = destroy;

        return module;
    }


})(_NS_('AuJS'), jQuery);
