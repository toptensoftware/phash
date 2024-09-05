let fs = require('fs');
let commandLineParser = require('./utils/commandLineParser.js');
let hashfileDatabase = require('./utils/hashfileDatabase')

const sharp_phash = require("sharp-phash");
const sharp_dist = require("sharp-phash/distance");

function phash_helper(file)
{
    let img = fs.readFileSync(file);
    return sharp_phash(img);
}

module.exports = async function main(args)
{
    // Process args
    let cl = commandLineParser.parse(args, {
        usagePrefix: "phash next",
        packageDir: __dirname,
        synopsis: "Calculates the phash for a file",
        spec: [
            {
                name: "<filename>",
                help: "The file to phash",
            },
            {
                name: "<filename2>",
                help: "Optional second file to compare",
                default: null,
            },
        ]
    });

    let hash = await phash_helper(cl.filename);
    console.log(hash);
    if (cl.filename2)
    {
        let hash2 = await phash_helper(cl.filename2);
        console.log(hash2);
        console.log("similarity: ", sharp_dist(hash, hash2));
    }
    else
    {
        let db =  new hashfileDatabase();
        for (let f of db.querySimilar(hash))
        {
            console.log(f.similarity, f.name);
        }
    }
    
    /*
    let hash = await phash.compute(cl.filename);
    console.log(hash);
    if (cl.filename2)
    {
        let hash2 = await phash.compute(cl.filename2);
        console.log(hash2);
        console.log("similarity: ", phash.compare(hash, hash2));
    }
    else
    {
        let db =  new hashfileDatabase();
        for (let f of db.querySimilar(hash))
        {
            console.log(f.similarity, f.name);
        }
    }
    */
}
