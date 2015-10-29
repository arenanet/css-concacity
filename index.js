"use strict";

var path = require("path"),
    through2 = require("through2"),
    fs = require("fs");

function reducer(files) {
    return Object.keys(files).reduce(function(buffer, key) {
        return buffer + "\r\n" + files[key];
    }, "");
}

module.exports = function(browserify, options) {
    var settings = {},
        files = {};

    options = options || {};

    settings.rootDir = path.resolve(options.rootDir || options.d || process.cwd());
    settings.cssOut = options.output || options.o;

    browserify.transform(function(filename) {
        var buffer = "";

        if(path.extname(filename) !== ".css") {
            return through2();
        }

        return through2(function(chunk, enc, callback) {
            // do nothing
            buffer += chunk;
            callback();
        }, function(callback) {
            files[filename] = buffer;
            this.push("");
            callback();
        });
    }, { global : true });

    browserify.on("bundle", function(bundle) {
        bundle.on("end", function() {
            if(settings.cssOut) {
                fs.writeFile(
                    path.join(settings.rootDir, settings.cssOut),
                    reducer(files),
                    function(err) {
                        if(err) {
                            browserify.emit("error", err);
                        }
                    }
                );
            }
        });
    });
};
