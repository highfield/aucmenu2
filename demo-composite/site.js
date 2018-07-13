$(function () {
    'use strict';

    /**
     * sample content manager for the right sidebar
     **/

    function myRenderer() {

        function update(inc) {
            const counter = fragment.children().eq(0);
            var num = counter.data('num');
            if (inc) {
                num += inc;
                counter.data('num', num);
            }
            counter.text(num);
        }

        var fragment;
        return {
            create: function () {
                if (fragment) return;
                fragment = $('<div>', { class: 'test-block' });
                $('<div>').data('num', 0).appendTo(fragment);
                $('<button>').text('inc').appendTo(fragment).on('click', function () {
                    update(1);
                });
                update();
            },
            attach: function (hook) {
                if (fragment) {
                    hook.element.append(fragment);
                }
            },
            detach: function (hook) {
                hook.element.children().detach();
            },
            destroy: function () {
                fragment = null;
            }
        }
    }

    const rightRenderer = myRenderer();


    $('.button-right-unload').on('click', function () {
        rightRenderer.destroy();
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

    $('.button-right-load').on('click', function () {
        rightRenderer.create();
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });



    /**
     * menu model structure
     **/
    const menu_struct = AuJS.MenuStruct();
    menu_struct.setData(DB.tree);


    /**
     * selection manager (single selection only)
     **/
    const selectionManager = AuJS.MenuSelectorSingle();

    selectionManager.addListener(function (selId) {
        //just display some info about the current selection
        const node = menu_struct.getNode(selId);
        $('#sel_id').text(node && node.id || '');
        $('#sel_lab').text(node && node.label || '');
    });


    $('#sel_none').on('click', function () {
        selectionManager.selection = null;
    });

    $('#sel_n1').on('click', function () {
        selectionManager.selection = 'node_gig_led';
    });

    $('#sel_n2').on('click', function () {
        selectionManager.selection = 'node_perez_prado';
    });

    $('#sel_n3').on('click', function () {
        selectionManager.selection = 'node_verdi';
    });



    /**
     * blade-menu renderer
     **/
    const bladeRenderer = AuJS.BladeMenuRenderer(menu_struct);
    bladeRenderer.selector = selectionManager;



    /**
     * tree-menu renderer
     **/
    const treeRenderer = AuJS.TreeMenuRenderer(menu_struct);
    treeRenderer.selector = selectionManager;



    /**
     * Drawers setup
     **/

    const drawerCtl = AuJS.Drawer.Controller();
    const dl = drawerCtl.add(AuJS.Drawer.Sides.LEFT, {
        render_lg: {
            name: 'myTree',
            renderer: treeRenderer,
            isAutoClose: false,
            persistent: true
        },
        render_sm: {
            name: 'myBlade',
            renderer: bladeRenderer,
            isAutoClose: true,
            persistent: true,
            customDrawer: true
        }
    });

    const dr = drawerCtl.add(AuJS.Drawer.Sides.RIGHT, {
        render_lg: {
            renderer: rightRenderer,
            persistent: true,
            drawerSize: 400,
        }
    });
    drawerCtl.create();


    $('.button-left').on('click', function () {
        dl.toggle();
    });

    $('.button-right').on('click', function () {
        dr.toggle();
    });



    /**
     * (bonus) Hammer.js setup
     **/

    const hammer = new Hammer(dl.element[0]);
    hammer.get('swipe').set({
        direction: Hammer.DIRECTION_LEFT
    });
    hammer.on('swipe', function () {
        if (dl.rendererName === 'myBlade') {
            bladeRenderer.back();
        }
    });



});

