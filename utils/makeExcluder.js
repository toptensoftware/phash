let os = require('os');
let glob = require('./glob');

module.exports = function makeExcluder(options)
{
    // No exclude patterns
    if (!options.exclude || options.exclude.length == 0)
        return (x) => false;

    // On windows convert all backslashes to forward slashes
    let convertBackslashes = os.platform() === "win32";

    // Convert pattens to regexp and negative flag
    var patterns = options.exclude.map(x => {
        let negative = x.startsWith('!');
        if (negative)
            x = x.substring(1);
        if (convertBackslashes)
            x = x.replace(/\\/g, '/');
        return {
            negative,
            rx: new RegExp(glob(x), options.icase ? "i" : "")
        };
    });


    // Returns true if file should be ignored
    return function(filepath)
    {
        // Convert backslashes to forward slashes
        if (convertBackslashes)
            filepath = filepath.replace(/\\/g, "/");

        // Make sure there's a leading slash
        if (!filepath[0] == '/')
            filepath = "/" + x;

        // Find last matching pattern
        for (let i= patterns.length-1; i>=0; i--)
        {
            let p = patterns[i];
            if (filepath.match(p.rx) != null)
                return !p.negative;
        }

        // Didn't match any patterns, so file is included
        return false;
    }
}

