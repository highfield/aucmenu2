$(function () {
    'use strict';

    var menu_left = AuJS.TreeMenu($('.container > .left'), {});
    var menu_right = AuJS.TreeMenu($('.container > .right'), {});

    $('.button-left').on('click', function () {
        menu_left.setData(DB.tree);
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.LEFT).toggle();
    });

    $('.button-right').on('click', function () {
        menu_right.setData(DB.tree);
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).toggle();
    });

    $('.button-right-unload').on('click', function () {
        //fCreateRight = false;
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

    $('.button-right-load').on('click', function () {
        //fCreateRight = true;
        //AuJS.AuDocker.docker(AuJS.AuDocker.Sides.RIGHT).invalidateContent();
    });

});


