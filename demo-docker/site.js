$(function () {
    'use strict';

    function createLeftContent(context) {
        function update(inc) {
            var num = counter.data('num');
            if (inc) {
                num += inc;
                counter.data('num', num);
            }
            counter.text(num);
        }

        context.element.css('background-color', 'antiquewhite');
        var block = $('<div>', { class: 'test-block' }).appendTo(context.element);
        var counter = $('<div>').data('num', 0).appendTo(block);
        $('<button>').text('inc').appendTo(block).on('click', function () {
            update(1);
        });
        update();
    }


    var fCreateRight = false;
    function createRightContent(context) {
        if (fCreateRight) {
            function update(inc) {
                var num = counter.data('num');
                if (inc) {
                    num += inc;
                    counter.data('num', num);
                }
                counter.text(num);
            }

            context.element.css('background-color', 'pink');
            var block = $('<div>', { class: 'test-block' }).appendTo(context.element);
            var counter = $('<div>').data('num', 0).appendTo(block);
            $('<button>').text('inc').appendTo(block).on('click', function () {
                update(1);
            });
            update();
        }
    }


    $(window).on('AuDocker:ready', function () {
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.LEFT).setOptions({
            render_lg: AuJS.AuDockerRenderers.GenericContainer({ createContent: createLeftContent, autoClose: false }),
            render_sm: AuJS.AuDockerRenderers.GenericContainer({ createContent: createLeftContent, autoClose: true })
        });

        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).setOptions({
            render_lg: AuJS.AuDockerRenderers.GenericContainer({ createContent: createRightContent })
        });
    });

    $('.button-left').on('click', function () {
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.LEFT).toggle();
    });

    $('.button-right').on('click', function () {
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).toggle();
    });

    $('.button-right-unload').on('click', function () {
        fCreateRight = false;
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

    $('.button-right-load').on('click', function () {
        fCreateRight = true;
        AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

});
