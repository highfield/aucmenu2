$(function () {
    'use strict';

    /**
     * menu model structure
     **/
    const menu_struct = AuMenuStruct();


    $('.button-struct-set').on('click', function () {
        menu_struct.setData(DB.tree);
    });

    $('.button-struct-clear').on('click', function () {
        menu_struct.setData(null);
    });


    /**
     * selection manager (single selection only)
     **/
    const selectionManager = AuMenuSelectorSingle();
    selectionManager.addListener(function (selId) {
        const node = menu_struct.getNode(selId);
        $('#sel_id').text(node && node.id || '');
        $('#sel_lab').text(node && node.label || '');
    });


    $('#open').on('click', function () {
        renderer.attach({
            element: $('.container > .mid')
        });
        renderer.open();
    });

    $('#close').on('click', function () {
        renderer.close();
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
     * menu renderer
     **/
    const renderer = AuBladeMenuRenderer(menu_struct);
    renderer.selector = selectionManager;

    $('.button-render').on('click', function () {
        renderer.attach({
            element: $('.container > .mid')
        });
    });

    $('.button-destroy').on('click', function () {
        renderer.detach();
    });


});


