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
            renderer: treeRenderer,
            isAutoClose: false,
            persistent: true
        },
        render_sm: {
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

    //$(window).on('AuDocker:ready', function () {
    //    AuJS.AuDocker.docker(AuJS.AuDocker.Sides.LEFT).setOptions({
    //        render_lg: {
    //            renderer: treeRenderer,
    //            isAutoClose: false,
    //            persistent: true
    //        },
    //        render_sm: {
    //            renderer: bladeRenderer,
    //            isAutoClose: true,
    //            persistent: true,
    //            customDrawer: true
    //        }
    //    });

    //    AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).setOptions({
    //        render_lg: {
    //            renderer: rightRenderer,
    //            persistent: true
    //        }
    //    });
    //});


    $('.button-left').on('click', function () {
        dl.toggle();
    });

    $('.button-right').on('click', function () {
        dr.toggle();
    });


});

