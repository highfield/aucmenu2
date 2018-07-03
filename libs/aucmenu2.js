
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
                switch (state) {
                    case AuJS.AuDocker.States.OPENING:
                    case AuJS.AuDocker.States.OPENED:
                        context.element.css({
                            'display': '',
                            'transform': 'translate3d(0,0,0)',
                            'transition-duration': '0ms',
                            'transition-property': 'transform'
                        });
                        indent(!options.autoClose);
                        break;

                    case AuJS.AuDocker.States.CLOSING:
                    case AuJS.AuDocker.States.CLOSED:
                        context.element.css({
                            'display': 'none',
                            'transform': 'translate3d(' + offset + 'px,0,0)',
                            'transition-duration': '0ms',
                            'transition-property': 'transform'
                        });
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
                context.element.css({
                    'display': '',
                });
                setTimeout(function () {
                    context.element.css({
                        'transform': 'translate3d(0,0,0)',
                        'transition-duration': transitionDuration + 'ms',
                        'transition-property': 'transform'
                    });
                    //context.element.css('background-color', 'antiquewhite').text('Dock mode');
                    setTimeout(function () {
                        if (!options.autoClose) {
                            indent(true);
                        }
                        cb();
                    }, transitionDuration);
                }, yieldDuration);
            }

            module.close = function (cb) {
                context.element.css({
                    'transform': 'translate3d(' + offset + 'px,0,0)',
                    'transition-duration': transitionDuration + 'ms',
                    'transition-property': 'transform'
                });
                if (!options.autoClose) {
                    indent(false);
                }
                setTimeout(function () {
                    context.element.css({
                        'display': 'none'
                    });
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
    const transitionDuration = 600;     //ms

    const uuid = (function () {
        var n = 0;
        return function () {
            return 'autreemenu_node_' + (n++);
        }
    })();

    /**
     * node schema:
     *  parentId: (string) ref-ID to the parent node, or <null> for a root node
     *  level: (number) non-negative integer indicating the depth level, where zero is a root
     *  expanded: (bool) indicates whether the node is expanded or not
     *  label: (string)
     *  icon: (string)
     *  children: (array) list of ID-references to the children nodes
     */
    function Node(id) {
        const self = this;
        var state = 'O';

        Object.defineProperty(this, 'id', {
            value: id,
            writable: false
        });

        //Object.defineProperty(this, 'expanded', {
        //    get: function () { return state === 'O'; }
        //});

        this.parentId = null;
        this.level = 0;
        this.expanded = false;
        this.label = null;
        this.icon = null;
        this.children = [];
        this.element = null;

        this.expand = function () {
            if (state === 'C') {
                state = 'o';
                const button = self.element.children('.autreemenu-node-header > .exp > a').children();
                button.css({
                    'transform': 'rotate(90deg)',
                    'transition-duration': transitionDuration + 'ms',
                    'transition-property': 'transform'
                });

                const items = self.element.children('.autreemenu-node-items');
                items.css({
                    'opacity': 1,
                    'height': childrenHeight(items),
                    'transition-duration': transitionDuration + 'ms',
                    'transition-property': 'opacity, height'
                });

                setTimeout(function () {
                    state = 'O';
                }, transitionDuration);
            }
        }

        this.collapse = function () {
            if (state === 'O') {
                state = 'c';
                const button = self.element.children('.autreemenu-node-header > .exp > a').children();
                button.css({
                    'transform': 'rotate(0deg)',
                    'transition-duration': transitionDuration + 'ms',
                    'transition-property': 'transform'
                });

                const items = self.element.children('.autreemenu-node-items');
                items.css({
                    'opacity': 0,
                    'height': 0,
                    'transition-duration': transitionDuration + 'ms',
                    'transition-property': 'opacity, height'
                });

                setTimeout(function () {
                    state = 'C';
                }, transitionDuration);
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
    }


    function childrenHeight(itemsCtr) {
        var h = 0;
        (itemsCtr || self.element.children('.autreemenu-node-items'))
            .children()
            .each(function () {
                h += $(this).height();
            });
        return h;
    }


    NS.TreeMenu = function (container, options) {

        function scan(source, parentId, level) {
            if ($.isPlainObject(source)) {
                const id = source.id || uuid();
                var node = nodeMap[id];
                if (!node) {
                    node = nodeMap[id] = new Node(id);
                    //node = nodeMap[id] = { id: id };
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


        function render() {
            //var list = [];
            //for (var id in nodeMap) {
            //    list.push({ id: id, pos: nodeMap[id].pos });
            //}
            //list.sort(function (a, b) { return a.pos - b.pos; });

            //var roots = [];
            //list.forEach(function (n) {
            //    if (nodeMap[n.id].level === 0) {
            //        roots.push(n.id);
            //    }
            //});

            roots.forEach(function (id) {
                renderNode(id, container);
            });
        }


        function renderNode(id, parentElement) {
            const node = nodeMap[id];
            node.element = $('<div>', { class: 'autreemenu-node', 'data-id': id })
                .appendTo(parentElement);

            const header = $('<div>', { class: 'autreemenu-node-header' }).css({
                'height': itemHeight
            }).appendTo(node.element);

            const hostExp = $('<div>', { class: 'exp' }).appendTo(header);
            const btnExp = $('<a>', { href: '#' }).appendTo(hostExp).on('click', hbtnExp);

            const btnCapt = $('<a>', { href: '#' }).appendTo(header);
            const inner = $('<div>', { class: 'autreemenu-node-caption' }).appendTo(btnCapt);
            const hostLabel = $('<span>', { class: 'label' }).appendTo(inner).text(node.label);
            const hostIcon = $('<div>', { class: 'icon' }).appendTo(inner);

            if (options.renderIcon) {
                //TODO
            }
            else if (node.icon) {
                $('<i>', { class: node.icon }).appendTo(hostIcon);
            }

            if (options.renderExp) {
                //TODO
            }
            else if (node.children.length) {
                $('<i>', { class: expSymbol }).appendTo(btnExp);
            }

            const itemsCtr = $('<div>', { class: 'autreemenu-node-items' }).appendTo(node.element);
            node.children.forEach(function (cid) {
                renderNode(cid, itemsCtr);
            });
            itemsCtr.css({
                'opacity': 1,
                'height': childrenHeight(itemsCtr),
                'display': 'block'
            });
        }


        function hbtnExp(e) {
            e.stopPropagation();
            e.preventDefault();
            const id = $(this).closest('.autreemenu-node').data('id');
            const node = nodeMap[id];
            node.cmdexp();
            return false;
        }

        container.addClass('autreemenu');

        const roots = [];
        const nodeMap = {};
        const module = {};

        module.init = function () {

        }

        module.getData = function () { }
        module.setData = function (data) {
            roots.splice(0);
            Array.prototype.push.apply(roots, scan(data, null, 0));
            render();
        }

        module.getState = function () { }
        module.setState = function () { }

        module.getSelected = function () { }
        module.setSelected = function () { }

        module.refresh = function () { }


        module.destroy = function () {

        }

        return module;
    }


})(_NS_('AuJS'), jQuery);
