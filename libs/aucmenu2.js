
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
        transitionDuration: 300,    //ms
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
                    .appendTo(bay)
            }
            created = true;
        }

        const busyItems = [];
        module.notify = function (item, coerce) {
            const req = (typeof coerce === 'boolean')
                ? coerce
                : (item.isAutoClose && item.state !== States.CLOSED);

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
        }

        module.destroy = function () {
            if (bay) {
                bay.remove();
            }
            bay = element = null;
            created = false;
        }

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
                }
            }

            function getActualDrawerOffset() {
                switch (side) {
                    case Sides.LEFT: return -module.getActualOption('drawerSize');
                    case Sides.RIGHT: return module.getActualOption('drawerSize');
                }
            }

            function indent(active) {
                var padding = '';
                if (active && !rendererInfo.isAutoClose) {
                    padding = module.getActualOption('drawerSize');
                }
                $('body').css('padding-' + side, padding);
            }

            function preset(state) {
                const elementStyle = element[0].style;
                elementStyle.width = module.getActualOption('drawerSize') + 'px';
                switch (state) {
                    case States.OPENING:
                    case States.OPENED:
                        elementStyle.visibility = '';
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
                return (rendererInfo[pname] > 0)
                    ? rendererInfo[pname]
                    : defaults[pname];
            }

            Object.defineProperty(module, 'side', {
                get: function () { return side; }
            });

            var rendered = false;
            Object.defineProperty(module, 'rendered', {
                get: function () { return rendered; }
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
                        'visibility': 'hidden',
                    })
                    .appendTo(container);
                rendered = true;
                module.invalidateContent();
            }

            module.open = function (coerce) {
                if (coerce === true && rendererInfo.customDrawer) {
                    setState(States.OPENED);
                }
                else {
                    if (state !== States.CLOSED) return;
                    if (rendererInfo.renderer) {
                        setState(States.OPENING);
                        if (rendererInfo.customDrawer) {
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
            }

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
                const info = (w <= 600 && options.render_sm) || (w <= 960 && options.render_md) || options.render_lg;
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
                    if ((rendererInfo !== info) || isContentDirty) {
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
                        if (rendererInfo.customDrawer) {
                            rendererInfo.renderer.preset(state);
                        }
                        else {
                            preset(state);
                        }

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
            }

            module.destroy = function () {
                if (rendered) {
                    NS.Overlay.notify(module, false);
                    element.remove();
                }
                element = null;
                rendered = false;
            }

            return module;
        }


        const resize = function () {
            drawers.forEach(function (d) {
                d.updateRenderer();
            });
        }

        const overlayClick = function (e) {
            if ($(e.target).closest('.aujs-drawer-overlay').length) {
                drawers.forEach(function (d) {
                    if (d.isAutoClose) {
                        d.close();
                    }
                });
            }
        }

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
        }

        module.remove = function (item) {
            if (rendered) {
                throw new Error('Invalid operation.');
            }
            if (!item) return;
            const ix = drawers.indexOf(item);
            if (ix >= 0) {
                drawers.splice(ix, 1);
            }
        }


        module.create = function () {
            if (rendered) return;

            drawers.forEach(function (d) {
                d.create();
            });

            $(NS.Overlay.container).on('click', overlayClick);
            $(window).on('resize', resize);
            rendered = true;
        }

        module.destroy = function () {
            $(window).off('resize', resize);
            $(NS.Overlay.container).off('click', overlayClick);

            drawers.forEach(function (d) {
                d.destroy();
            });
            rendered = false;
        }

        return module;
    }

})(_NS_('AuJS.Drawer'), jQuery);


(function (NS, $) {
    'use strict';

    const uuid = (function () {
        var n = 0;
        return function () {
            return 'aujs_id_' + (n++);
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

})(_NS_('AuJS'), jQuery);


(function (NS, $) {
    'use strict';

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


})(_NS_('AuJS'), jQuery);


(function (NS, $) {
    'use strict';

    const defaults = Object.freeze({
        itemHeight: 48,             //px
        indentWidth: 32,            //px
        expanderWidth: 32,          //px
        iconWidth: 24,              //px
        expSymbol: 'fas fa-chevron-right',
        transitionDuration: 300,    //ms
    });


    NS.TreeMenuRenderer = function (struct, opts) {

        const yieldDuration = 10;   //ms

        const context = struct._getContext();
        const options = $.extend({}, ($.isPlainObject(opts) ? opts : {}), defaults);


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

                selected && self.element.addClass('selected');

                const header = $('<div>', { class: 'aujs-treemenu-node-header' }).css({
                    'height': owner.getActualOption('itemHeight')
                }).appendTo(self.element);


                //block to host the expander button, whereas useful
                const xhost = $('<div>', { class: 'exp' }).css({
                    'display': (extras.allocateExpanders ? '' : 'none'),
                    'min-width': owner.getActualOption('expanderWidth'),
                }).appendTo(header);

                //main button, as the node selection button, and related handler
                const mbtn = $('<a>', { href: '#' }).appendTo(header).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (module.selector) {
                        module.selector.selection = node.id;
                    }
                    return false;
                });

                if (!extras.allocateExpanders) {
                    mbtn.css('margin-left', 4);
                }

                //node main face: text and optional icon
                const inner = $('<div>', { class: 'aujs-treemenu-node-caption' }).appendTo(mbtn);
                const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(node.label);
                //const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    const hostIcon = $('<div>', { class: 'icon' }).css({
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

                if (node.expandable) {
                    //expander button and related handler
                    const xbtn = $('<a>', { href: '#' }).appendTo(xhost).on('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        self.cmdexp();
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
                    }

                    node.children.forEach(function (cid) {
                        const child = context.nodeMap[cid];
                        const nrend = nrendMap[cid] = new NodeRenderer(owner, child);
                        nrend.render(self.itemsCtr, self.outlineBay, childrenExtras);
                    });
                }

                rendered = true;
                setTimeout(self.updateChildrenOutlines, yieldDuration);
            }

            this.updateSiblingOutlines = function () {
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.updateSiblingOutlines();
                    parent.updateChildrenOutlines();
                }
            }

            this.updateChildrenOutlines = function () {
                if (!rendered) return;
                var h = owner.getActualOption('itemHeight');
                node.children.forEach(function (cid) {
                    const child = nrendMap[cid];
                    child.outline.css('height', h - 4);
                    h += child.element[0].getBoundingClientRect().height;
                });
                //self.showOutlineBay(self.expanded, false);
                self.outlineBay.css('opacity', self.expanded ? 1 : 0);
            }

            this.showOutlineBay = function (coerce) {
                if (!rendered) return;
                const f = (typeof coerce === 'boolean') ? coerce : self.expanded;
                self.outlineBay.css('opacity', f ? 1 : 0);
                var parent = nrendMap[node.parentId];
                if (parent) {
                    parent.showOutlineBay(coerce);
                }
            }

            this.expand = function () {
                if (!rendered) {
                    state = AuJS.Drawer.States.OPENED;
                }
                else if (state === AuJS.Drawer.States.CLOSED && node.expandable) {
                    state = AuJS.Drawer.States.OPENING;
                    self.showOutlineBay(false);

                    const button = self.element
                        .children('.aujs-treemenu-node-header')
                        .find('.exp > a')
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
            }

            this.collapse = function () {
                if (!rendered) {
                    state = AuJS.Drawer.States.CLOSED;
                }
                else if (state === AuJS.Drawer.States.OPENED && node.expandable) {
                    state = AuJS.Drawer.States.CLOSING;
                    self.showOutlineBay(false);

                    const button = self.element
                        .children('.aujs-treemenu-node-header')
                        .find('.exp > a')
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
            }

            this.cmdexp = function () {
                if (state === AuJS.Drawer.States.CLOSED) {
                    self.expand();
                }
                else if (state === AuJS.Drawer.States.OPENED) {
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
            }

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
            }

            this.getChildrenHeight = function () {
                var h = 0;
                self.itemsCtr.children()
                    .each(function () {
                        h += $(this)[0].getBoundingClientRect().height;
                    });
                return h;
            }
        }


        const isAnyChildExpandable = function (idList) {
            for (var i = 0; i < idList.length; i++) {
                const child = context.nodeMap[idList[i]];
                if (child.expandable) return true;
            }
            return false;
        }

        const selector_onselect = function (selection) {
            for (var id in nrendMap) {
                nrendMap[id].select(id === selection);
            }
        }


        const module = {};

        module.getActualOption = function (pname) {
            return options[pname];
        }

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
        }

        module.detach = function (h) {
            if (hook) {
                hook.element.children().detach();
                hook = null;
            }
            rendered = false;
        }

        var nrendMap = {};
        module.render = function () {
            if (rendered) return;   //TEMP
            var outer = hook.element.children('.aujs-treemenu');
            if (outer.length === 0) {
                outer = $('<div>', { class: 'aujs-treemenu' }).appendTo(hook.element);
            }

            const extras = {
                allocateExpanders: isAnyChildExpandable(context.roots)
            }

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
        }


        module.destroy = function () {
            rendered = false;
            nrendMap = {};
        }

        return module;
    }



})(_NS_('AuJS'), jQuery);


(function (NS, $) {
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
    });


    NS.BladeMenuRenderer = function (struct, opts) {

        const yieldDuration = 10;   //ms

        const context = struct._getContext();
        const options = $.extend({}, ($.isPlainObject(opts) ? opts : {}), defaults);


        function BladeRenderer(owner, node) {
            const self = this;
            const baseClass = 'aujs-blademenu-node blade';

            this.rendered = false;
            this.element = null;
            this.itemCtr = null;

            this.render = function (bladeContainer) {
                self.element = $('<div>', { class: baseClass + ' close' })
                    .appendTo(bladeContainer);

                const header = $('<div>', { class: 'header' }).css({
                    'min-height': owner.getActualOption('itemHeight')
                }).appendTo(self.element);


                //block to host the back button
                const bhost = $('<div>', { class: 'back' }).css({
                    'min-width': owner.getActualOption('expanderWidth'),
                }).appendTo(header);

                //back button and related handler
                const bbtn = $('<a>', { href: '#' }).appendTo(bhost).on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (involvedBlades.length > 1) {
                        involvedBlades.splice(0, 1);
                        updateBlades();
                    }
                    else {
                        module.close();
                    }
                    return false;
                });

                const bbtnContent = $('<i>', {
                    class: owner.getActualOption('backSymbol')
                }).appendTo(bbtn);

                //main button, as the node selection button, and related handler
                const mbtn = $('<a>').appendTo(header);

                if (node.id) {
                    mbtn.attr('href', '#').on('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (module.selector) {
                            module.selector.selection = node.id;
                        }
                        return false;
                    });
                }

                //node main face: text and optional icon
                const inner = $('<div>', { class: 'caption' }).appendTo(mbtn);
                const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(node.label);
                //const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    const hostIcon = $('<div>', { class: 'icon' }).css({
                        'min-width': owner.getActualOption('iconWidth')
                    }).appendTo(inner);
                    $('<i>', { class: node.icon }).appendTo(hostIcon);
                }

                //children nodes host
                self.itemsCtr = $('<div>', { class: 'items' }).appendTo(self.element);

                node.children.forEach(function (id) {
                    const child = context.nodeMap[id];
                    const nrend = nrendMap[id] = new NodeRenderer(owner, self, child);
                    nrend.render(self.itemsCtr, bladeContainer);
                });

                self.rendered = true;
            }

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
            }
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
            }

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

                selected && self.element.addClass('selected');

                const header = $('<div>', { class: 'header' }).css({
                    'height': owner.getActualOption('itemHeight')
                }).appendTo(self.element);


                //block to host the expander button, whereas useful
                const xhost = $('<div>', { class: 'exp' }).css({
                    'min-width': owner.getActualOption('expanderWidth'),
                }).appendTo(header);

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
                //const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

                if (node.icon) {
                    const hostIcon = $('<div>', { class: 'icon' }).css({
                        'min-width': owner.getActualOption('iconWidth')
                    }).appendTo(inner);
                    $('<i>', { class: node.icon }).appendTo(hostIcon);
                }

                if (node.children.length) {
                    const childBlade = new BladeRenderer(owner, node);
                    bladeList.push(childBlade);
                    childBlade.render(bladeContainer);

                    //expander button and related handler
                    const xbtn = $('<a>', { href: '#' }).appendTo(xhost).on('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        involvedBlades.unshift(childBlade);
                        updateBlades();
                        return false;
                    });

                    self.xbtnContent0 = $('<i>', {
                        class: owner.getActualOption('expSymbol')
                    }).css('display', 'none').appendTo(xbtn);
                    self.xbtnContent1 = $('<i>', {
                        class: owner.getActualOption('hiliteSymbol')
                    }).css('display', 'none').appendTo(xbtn);
                }

                self.rendered = true;
                renderSelection();
            }

            this.select = function (value) {
                value = !!value;
                if (selected !== value) {
                    selected = value;
                    renderSelection();
                }
            }

            this.hilite = function (value) {
                value = !!value;
                if (hilited !== value) {
                    hilited = value;
                    renderSelection();
                }
            }

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
            }
        }


        const updateBlades = function () {
            bladeList.forEach(function (blade) {
                blade.indent(involvedBlades.indexOf(blade));
            });
            for (var id in nrendMap) {
                const nr = nrendMap[id];
                nr.hilite(involvedNodes.indexOf(nr) >= 0);
            }
        }


        const restoreSelectedBlades = function () {
            involvedBlades = [];
            involvedNodes = [];
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
        }


        const selector_onselect = function (selection) {
            for (var id in nrendMap) {
                nrendMap[id].select(id === selection);
            }
            restoreSelectedBlades();
        }


        const module = {};

        module.getActualOption = function (pname) {
            return options[pname];
        }

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
            get: function () { return state === AuJS.Drawer.States.OPENED || state === AuJS.Drawer.States.OPENING; }
        });

        module.create = function () {
            //
        }

        var hook;
        module.attach = function (h) {
            if (!hook) {
                hook = h;
                module.render();
            }
        }

        module.detach = function (h) {
            if (hook) {
                hook.element.children().detach();
                hook = null;
            }
            state = AuJS.Drawer.States.CLOSED;
            rendered = false;
        }

        var bladeList = [], involvedBlades = [], involvedNodes = [];
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
            inner.css('width', hook.getActualOption
                ? hook.getActualOption('drawerSize')
                : module.getActualOption('drawerSize')
            );

            const vroot = {
                id: '',
                level: 0,
                label: 'Menu title',
                icon: '',
                children: context.roots
            };
            const blade = new BladeRenderer(module, vroot);
            bladeList.push(blade);
            blade.render(inner);

            const selection = module.selector && module.selector.selection;
            if (selection) {
                const selectedRenderer = nrendMap[selection];
                selectedRenderer && selectedRenderer.select(true);
            }

            rendered = true;
            setTimeout(restoreSelectedBlades, yieldDuration);
        }


        var state = AuJS.Drawer.States.CLOSED;
        module.open = function (cb) {
            if (state === AuJS.Drawer.States.CLOSED) {
                state = AuJS.Drawer.States.OPENING;
                if (this.rendered) {
                    restoreSelectedBlades();
                }
                else {
                    module.render();
                }
                setTimeout(function () {
                    state = AuJS.Drawer.States.OPENED;
                    if ($.isFunction(cb)) cb();
                }, module.getActualOption('transitionDuration'));
            }
        }


        module.close = function (cb) {
            if (state === AuJS.Drawer.States.OPENED) {
                state = AuJS.Drawer.States.CLOSING;
                hook.close && hook.close(true);
                involvedBlades = [];
                involvedNodes = [];
                updateBlades();
                setTimeout(function () {
                    state = AuJS.Drawer.States.CLOSED;
                    if ($.isFunction(cb)) cb();
                }, module.getActualOption('transitionDuration'));
            }
        }


        module.preset = function (s) {
            if (state === s) return;
            state = s;
            switch (state) {
                case AuJS.Drawer.States.OPENING:
                    if (this.rendered) {
                        restoreSelectedBlades();
                    }
                    else {
                        module.render();
                    }
                    state = AuJS.Drawer.States.OPENED;
                    break;

                case AuJS.Drawer.States.CLOSING:
                case AuJS.Drawer.States.CLOSED:
                    involvedBlades = [];
                    involvedNodes = [];
                    updateBlades();
                    state = AuJS.Drawer.States.CLOSED;
                    break;
            }
        }

        module.destroy = function () {
            state = AuJS.Drawer.States.CLOSED;
            rendered = false;
            involvedBlades = [];
            involvedNodes = [];
            bladeList = [];
            nrendMap = {};
        }

        return module;
    }



})(_NS_('AuJS'), jQuery);

