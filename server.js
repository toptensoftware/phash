let path = require('path');
let http = require('http');
let express = require('express');
require("express-async-errors");
let fileUpload = require('express-fileupload');
let cookieParser = require('cookie-parser');
let moe = require('@toptensoftware/moe-js');
let commandLineParser = require('./utils/commandLineParser');
let sharp_phash = require("sharp-phash");
let hashfileDatabase = require('./utils/hashfileDatabase')

let db =  new hashfileDatabase();

// Setup express
let app = express(); 
app.use(cookieParser());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());

app.engine('moe', moe.express(app));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'moe');

// Setup HTTP server
let server = http.createServer(app);

// Routes

app.get("/", (req, res) => 
{
    res.render("index");
});

app.post('/', async (req, res) => {
    let hash = await sharp_phash(req.files.file.data);
    res.render("index", {
        results: db.querySimilar(hash)
    });
});

app.get('/image', (req, res) => {
    res.sendFile(req.query.file);
});

app.use((req, res, next) => {
    let err = new Error(`Not Found - ${req.url}`);
    err.status = 404;
    next(err);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(err.status ?? 500).render("error", {
        status: err.status ?? 500,
        message: err.message,
        stack: err.stack    
    });
});


// Graceful shutdown handlers
function gracefulClose(signal) {
    server.closeAllConnections();
    server.close( () => { 
        if (cl.verbose)
            console.log('Server closed.') 
    } );
}
process.on('SIGINT', gracefulClose);
process.on('SIGTERM', gracefulClose);


module.exports = async function main(args)
{
    // Process args
    let cl = commandLineParser.parse(args, {
        usagePrefix: "phash server",
        packageDir: __dirname,
        synopsis: "Runs a simple web server for photo searching",
        spec: [
            {
                name: "--port:<port>",
                help: "The port number to run on",
                default: 3000,
            },
        ]
    });
    
    
    // Start http server
    server.listen(cl.port, cl.host, function () {
        console.log(`Server running on [${server.address().address}]:${server.address().port} (${server.address().family})`);
    });
}