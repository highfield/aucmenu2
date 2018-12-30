'use strict';
const fs = require('fs');
const uglifyjs = require('uglify-es');
const uglifycss = require('uglifycss');

const jsmin = uglifyjs.minify(
    {
        "file1.js": fs.readFileSync("./libs/aucmenu2.js", "utf8"),
        "file2.js": fs.readFileSync("./libs/aucmenu2-drawer.js", "utf8"),
        "file3.js": fs.readFileSync("./libs/aucmenu2-struct.js", "utf8"),
        "file4.js": fs.readFileSync("./libs/aucmenu2-selector.js", "utf8"),
        "file5.js": fs.readFileSync("./libs/aucmenu2-tree.js", "utf8"),
        "file6.js": fs.readFileSync("./libs/aucmenu2-blade.js", "utf8")
    }, {
        sourceMap: {
            filename: "./libs/dist/aucmenu2.min.js.map",
            url: "aucmenu2.min.js.map"
        },
        output: {
            comments: 'some'
        }
    }
);
fs.writeFileSync('./libs/dist/aucmenu2.min.js', jsmin.code, "utf8");

const cssmin = uglifycss.processFiles(
    [
        './libs/aucmenu2-drawer.css',
        './libs/aucmenu2-tree.css',
        './libs/aucmenu2-blade.css'
    ], {
        expandVars: true
    }
);
fs.writeFileSync('./libs/dist/aucmenu2.min.css', cssmin, "utf8");
