$(function () {
    'use strict';

    function myRenderer () {

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


    const leftRenderer = myRenderer();
    leftRenderer.create();

    const rightRenderer = myRenderer();


    const drawerCtl = AuJS.Drawer.Controller();
    const dl = drawerCtl.add(AuJS.Drawer.Sides.LEFT, {
        render_lg: {
            renderer: leftRenderer,
            isAutoClose: false,
            persistent: true
        },
        render_sm: {
            renderer: leftRenderer,
            isAutoClose: true,
            persistent: true,
            drawerSize: 200
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
    //            renderer: leftRenderer,
    //            isAutoClose: false,
    //            persistent: true
    //        },
    //        render_sm: {
    //            renderer: leftRenderer,
    //            isAutoClose: true,
    //            persistent: true,
    //            drawerSize: 200
    //        }
    //    });

    //    AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).setOptions({
    //        render_lg: {
    //            renderer: rightRenderer,
    //            persistent: true,
    //            drawerSize: 450,
    //        }
    //    });
    //});

    $('.button-left').on('click', function () {
        dl.toggle();
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.LEFT).toggle();
    });

    $('.button-right').on('click', function () {
        dr.toggle();
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).toggle();
    });

    $('.button-right-unload').on('click', function () {
        rightRenderer.destroy();
        dr.invalidateContent();
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

    $('.button-right-load').on('click', function () {
        rightRenderer.create();
        dr.invalidateContent();
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

});
