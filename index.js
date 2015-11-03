"use strict";

var path = require("path"),
    concat = require("concat-stream"),
    through2 = require("through2"),
    fs = require("fs"),
    rework = require("rework"),
    reworkUrl = require("rework-plugin-url");

module.exports = function(browserify, options) {
    var settings = {},
        bundles = {},
        files = {};

    // rewrite relative urls
    function reworkUrls(css, filePath) {
        var actualPath = path.join(settings.rootDir, path.dirname(settings.cssOut));

        return rework(css)
            .use(reworkUrl(function(url) {
                var resolved = path.resolve(path.dirname(filePath), url);
                return path.isAbsolute(url) ? url : path.relative(actualPath, resolved);
            }))
            .toString();
    }

    // specific bundles
    function reduceBundle(bundleFiles) {
        return bundleFiles.reduce(function(buffer, file) {
            var data = files[file];
            delete files[file];
            return buffer + "\r\n" + reworkUrls(data, file);
        }, "");
    }

    // common.js
    function reducer(filesToReduce) {
        return Object.keys(filesToReduce).reduce(function(buffer, key) {
            return buffer + "\r\n" + reworkUrls(files[key], key);
        }, "");
    }

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

    browserify.on("factor.pipeline", function(file, pipeline) {
        bundles[file] = [];

        pipeline.unshift(through2.obj(function(obj, enc, done) {
            if(path.extname(obj.file) === ".css") {
                bundles[file].push(obj.file);
            }
            this.push(obj);
            done();
        }, function(done) {
            // all done
            fs.writeFile(
                path.join(settings.rootDir, path.dirname(settings.cssOut), path.basename(file, ".js") + ".css"),
                reduceBundle(bundles[file]),
                function(err) {
                    if(err) {
                        browserify.emit("error", err);
                    }
                }
            );
            this.push(null);
            done();
        }));
    });

    browserify.on("bundle", function(bundle) {
        bundle.pipe(concat(function() {
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
        }));
    });
};
