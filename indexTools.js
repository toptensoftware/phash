let path = require('path');
let os = require('os');
let fs = require('fs');
let commandLineParser = require('./utils/commandLineParser');
let hashfileDatabase = require('./utils/hashfileDatabase')

module.exports = async function main(args)
{

    // Process args
    let cl = commandLineParser.parse(args, {
        usagePrefix: "phash index",
        packageDir: __dirname,
        synopsis: "Update file hash indicies",
        spec: [
            {
                name: "<dir>",
                default: [],
                help: "The directories to check",
            },
            {
                name: "--move",
                help: "Update indicies, assuming files have moved (saves rehashing known files)"
            },
            {
                name: "--purge",
                help: "Purge no longer existing files from indicies"
            },
            {
                name: "--import:<other>",
                default: [],
                help: "Import cache entries from another .phash.db file"
            },
            {
                name: "--reset",
                help: "Delete all previously built indicies"
            },
            {
                name: "--exclude:<spec>",
                default: [],
                help: "Glob pattern for files to exclude",
            },
            {
                name: "--remap:<from:to>",
                default: [],
                help: "Remap directories"
            },
            {
                name: "--delete:<dir>",
                default: [],
                help: "Delete hash maps for specified directories",
            },
            {
                name: "--db:<dbfile>",
                default: null,
                help: "The index database file to use (default = ~/.phash.db)",
            },
            {
                name: "--stat",
                help: "Show index"
            },
            {
                name: "--rootdirs",
                help: "Show root indexed directories"
            },
            {
                name: "--dirs",
                help: "Show all indexed directories"
            },
            {
                name: "--query:<filespec>",
                default: [],
                help: "Query information about known files",
            },
            {
                name: "--icase",
                help: "Case insensitive exclude patten matching (default is true for Windows, else false)",
                default: os.platform() === 'win32',
            },
        ]
    });

    // Work out database file to use
    if (cl.db)
    {
        try
        {
            let s = fs.statSync(cl.db);
            if (s.isDirectory())
                cl.db += ".phash.db";
        }
        catch
        {
        }
    }

    // Delete database file
    if (cl.reset)
    {
        let filename = cl.db ?? hashfileDatabase.filename;
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);
    }

    // Open data
    let db =  new hashfileDatabase(cl.db);

    // Delete
    for (let d of cl.delete)
    {
        db.deleteDir(d);
    }

    // Import
    for (let i of cl.import)
    {
        db.import(i);
    }

    // Remap
    for (let r of cl.remap)
    {
        let parts = r.split(":");
        if (parts.length != 2)
            throw new Error(`Invalid remap: ${r}`);
        db.remap(parts[0], parts[1]);
    }

    // Index files
    if (cl.dir.length > 0)
    {
        await db.indexFiles(cl.dir, cl);
        console.log(`${db.hashed} new, ${db.moved} moved, ${db.purged} removed.`)
    }

    // Purge
    if (cl.purge)
    {
        db.purge();
    }

    // Show root directories
    if (cl.rootdirs)
    {
        db.showDirectories(true);
    }
    
    // Show all directories
    if (cl.dirs)
    {
        db.showDirectories(false);
    }
    
    // Show stats
    if (cl.stat)
    {
        db.showStats();
    }

    // Query?
    if (cl.query.length > 0)
    {
        let total = 0;
        for (let q of cl.query)
        {
            for (let f of db.query(q, cl.icase))
            {
                total++;
                let t = new Date(f.timestamp);
                console.log(`${f.dir}${path.sep}${f.name}`);
                console.log(`  - size: ${f.size}`);
                console.log(`  - time: ${t.toLocaleDateString()} ${t.toLocaleTimeString()}`);
                console.log(`  - hash: ${f.hash}`);

                let sameNames = db.queryByName(f.name);
                if (sameNames.length > 1)
                {
                    console.log(`  - files with same name:`);
                    for (let sn of sameNames)
                    {
                        if (sn.dir == f.dir)
                            continue;
                        console.log(`    - ${sn.dir}${path.sep}${sn.name}${format_diffs(sn, f)}`);
                    }
                }

                let sameHashs = db.queryByHash(f.hash);
                if (sameHashs.length > 1)
                {
                    console.log(`  - files with same content:`);
                    for (let sh of sameHashs)
                    {
                        if (sh.dir == f.dir)
                            continue;
                        console.log(`    - ${sh.dir}${path.sep}${sh.name}${format_diffs(sh, f)}`);
                    }
                }
            }
        }
        console.log(`${total} files found`)
    }
}


function format_diffs(a, b)
{
    let diffs = [];
    if (a.size > b.size)
        diffs.push("larger");
    if (a.size < b.size)
        diffs.push("smaller");
    if (a.timestamp > b.timestamp)
        diffs.push("newer");
    if (a.timestamp < b.timestamp)
        diffs.push("older");
    if (a.hash != b.hash)
        diffs.push("different content");
    if (diffs.length > 0)
        return ` (${diffs.join(", ")})`;
    return "";
}