
const DB = {};


DB.tree = {
    "label": "All Categories",
    "icon": "fa fa-globe",
    "items": [
        {
            "label": "Devices",
            "icon": "fa fa-laptop",
            "items": [
                {
                    "label": "Mobile Phones",
                    "icon": "fa fa-mobile-phone",
                    "items": [
                        { "label": "Super Smart Phone", "icon": "fa fa-audio-description" },
                        { "label": "Thin Magic Mobile", "icon": "fa fa-sign-language" },
                        { "label": "Performance Crusher", "icon": "fa fa-volume-control-phone" },
                        { "label": "Best Futuristic Experience", "icon": "fa fa-tty" }
                    ]
                },
                {
                    "label": "Televisions",
                    "icon": "fa fa-tv",
                    "items": [
                        { "label": "Flat Superscreen", "icon": "fa fa-ambulance" },
                        { "label": "Gigantic LED", "icon": "fa fa-bus", "id": "node_gig_led" },
                        { "label": "Power Eater", "icon": "fa fa-plane" },
                        { "label": "3D Experience", "icon": "fa fa-rocket" },
                        { "label": "Classic Comfort", "icon": "fa fa-truck" }
                    ]
                },
                {
                    "label": "Cameras",
                    "icon": "fa fa-camera",
                    "items": [
                        { "label": "Smart Shot", "icon": "fa fa-dollar" },
                        { "label": "Power Shooter", "icon": "fa fa-euro" },
                        { "label": "Easy Photo Maker", "icon": "fa fa-gg" },
                        { "label": "Super Pixel", "icon": "fa fa-money" }
                    ]
                }
            ]
        },
        {
            "label": "Magazines",
            "icon": "fa fa-newspaper-o",
            "items": [
                { "label": "National Geographic", "icon": "fa fa-bold" },
                { "label": "Scientific American", "icon": "fa fa-cut", id: "sci_am" },
                { "label": "The Spectator", "icon": "fa fa-eraser" },
                { "label": "The Rambler", "icon": "fa fa-link" },
                { "label": "Physics World", "icon": "fa fa-repeat" },
                { "label": "The New Scientist", "icon": "fa fa-th" }
            ]
        },
        {
            "label": "Store",
            "icon": "fa fa-shopping-cart",
            "items": [
                {
                    "label": "Clothes",
                    "icon": "fa fa-child",
                    "items": [
                        {
                            "label": "Women's Clothing",
                            "icon": "fa fa-female",
                            "items": [
                                { "label": "Tops", "icon": "fa fa-wifi" },
                                { "label": "Dresses", "icon": "fa fa-user" },
                                { "label": "Trousers", "icon": "fa fa-tree" },
                                { "label": "Shoes", "icon": "fa fa-trash" },
                                { "label": "Sale", "icon": "fa fa-thumbs-up" }
                            ]
                        },
                        {
                            "label": "Men's Clothing",
                            "icon": "fa fa-male",
                            "items": [
                                { "label": "Shirts", "icon": "fa fa-star" },
                                { "label": "Trousers", "icon": "fa fa-signal" },
                                { "label": "Shoes", "icon": "fa fa-shield" },
                                { "label": "Sale", "icon": "fa fa-road" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Jewelry",
                    "icon": "fa fa-diamond"
                },
                {
                    "label": "Music",
                    "icon": "fa fa-music",
                    "items": [
                        { "label": "Ray Conniff", "icon": "fa fa-hand-lizard-o" },
                        { "label": "Perez Prado", "icon": "fa fa-hand-o-down", "id": "node_perez_prado" },
                        { "label": "Glenn Miller", "icon": "fa fa-hand-o-left" },
                        { "label": "Percy Faith", "icon": "fa fa-hand-o-right" },
                        { "label": "Carlos Santana", "icon": "fa fa-hand-o-up" },
                        { "label": "Burt Bacharach", "icon": "fa fa-hand-paper-o" },
                        { "label": "Laurie Johnson", "icon": "fa fa-hand-peace-o" },
                        { "label": "Tears for fears", "icon": "fa fa-hand-pointer-o" },
                        { "label": "Inxs", "icon": "fa fa-hand-rock-o" },
                        { "label": "Edoardo Bennato", "icon": "fa fa-hand-scissors-o" },
                        { "label": "Claudio Baglioni", "icon": "fa fa-hand-spock-o" },
                        { "label": "James Last", "icon": "fa fa-thumbs-o-down" },
                        { "label": "Duran Duran", "icon": "fa fa-thumbs-o-up" },
                        { "label": "W. A.Mozart", "icon": "fa fa-ambulance" },
                        { "label": "Charles Aznavour", "icon": "fa fa-bicycle" },
                        { "label": "Mina", "icon": "fa fa-bus" },
                        { "label": "The Beatles", "icon": "fa fa-car" },
                        { "label": "Spandau Ballet", "icon": "fa fa-fighter-jet" },
                        { "label": "Bocelli", "icon": "fa fa-motorcycle" },
                        { "label": "Giacomo Puccini", "icon": "fa fa-plane" },
                        { "label": "Madonna", "icon": "fa fa-rocket" },
                        { "label": "L. Van Beethoven", "icon": "fa fa-ship" },
                        { "label": "The Cars", "icon": "fa fa-space-shuttle" },
                        { "label": "Stevie Wonder", "icon": "fa fa-subway" },
                        { "label": "Matia Bazar", "icon": "fa fa-taxi" },
                        { "label": "Rolling Stones", "icon": "fa fa-train" },
                        { "label": "Bee Gees", "icon": "fa fa-truck" },
                        { "label": "Giuseppe Verdi", "icon": "fa fa-wheelchair" },
                        { "label": "Ramones", "icon": "fa fa-mars" },
                        { "label": "Tubeway army", "icon": "fa fa-venus" }
                    ]
                },
                {
                    "label": "Grocery",
                    "icon": "fa fa-cutlery"
                }
            ]
        },
        {
            "label": "Collections",
            "icon": "fa fa-photo",
            "items": [
                { "label": "Generic file", "icon": "fa fa-file" },
                { "label": "Archive", "icon": "fa fa-file-archive-o" },
                { "label": "Audio", "icon": "fa fa-file-audio-o" },
                { "label": "Code", "icon": "fa fa-file-code-o" },
                { "label": "Excel", "icon": "fa fa-file-excel-o" },
                { "label": "Image", "icon": "fa fa-file-image-o" },
                { "label": "Pdf", "icon": "fa fa-file-pdf-o" },
                { "label": "Powerpoint", "icon": "fa fa-file-powerpoint-o" },
                { "label": "Text", "icon": "fa fa-file-text-o" },
                { "label": "Video", "icon": "fa fa-file-video-o" },
                { "label": "Word", "icon": "fa fa-file-word-o" }
            ]
        },
        {
            "label": "Credits",
            "icon": "fa fa-google-wallet",
            "items": [
                { "label": "Amex", "icon": "fa fa-cc-amex" },
                { "label": "Diners club", "icon": "fa fa-cc-diners-club" },
                { "label": "Discover", "icon": "fa fa-cc-discover" },
                { "label": "Jcb", "icon": "fa fa-cc-jcb" },
                { "label": "Mastercard", "icon": "fa fa-cc-mastercard" },
                { "label": "Paypal", "icon": "fa fa-cc-paypal" },
                { "label": "Stripe", "icon": "fa fa-cc-stripe" },
                { "label": "Visa", "icon": "fa fa-cc-visa" },
                { "label": "Credit card", "icon": "fa fa-credit-card" }
            ]
        }
    ]
};
