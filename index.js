#!/usr/bin/env node
let commandLineParser = require('./utils/commandLineParser.js');

var parser = commandLineParser.parser({
    usagePrefix: "phash",
    packageDir: __dirname,
    spec: [
        {
            name: "index",
            help: "Build and update file hash indicies"
        },
        {
            name: "phash",
            help: "Calculates the phash for a file",
        },
        {
            name: "server",
            help: "Runs a simple web server for photo searching",
        },
        {
            name: "--help",
            help: "Show this help",
            terminal: true,
        },
        {
            name: "--version",
            help: "Show version info",
            terminal: true,
        },
    ]

});

// Parse command line
let cl = parser.parse(process.argv.slice(2));
if (!cl.$command)
{
    parser.show_help();
    return;
}

if (cl.$command == "index")
    cl.$command = "indexTools";

(async function() {
    // Dispatch it
    await require('./' + cl.$command)(cl.$tail)
})();
