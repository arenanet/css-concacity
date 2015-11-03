# css-concatify

A browserify plugin to concat required CSS. It handles relative URLs and basically a simpler version of browserify-css.
Supports Factor-Bundle w/o any configuration changes.

## Example Usage
```javascript
  var browserify = require("browserify"),
    fs           = require("fs"),
    path         = require("path"),
    cssModule    = require("css-concatify"),
    rebundle     = require("factor-bundle"),
    inputs       = ["foo.js", "bar.js"];
    
  b = browserify();
  
  b.add(inputs);
  
  b.plugin(cssModule, {
    global  : true,
    rootDir : config.cwd,
    output  : "gen/common.css"
  });
  
  b.plugin(rebundle, {
    outputs : inputs.map(function(page) {
        return path.join("./gen", path.basename(page));
    }),
    global : true
  });
  
  b.bundle(function(err, res) {
    if(err) {
        console.log("error", err);
    } else {
        fs.writeFileSync(exit, res);
    }
  });
```
## License

MIT
