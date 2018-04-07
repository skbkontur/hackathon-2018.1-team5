var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var Base64 = require('js-base64').Base64;
app.listen(80, "10.34.34.49");
var async = require('async');
var md5 = require('md5');
var mapGenerator = require('./map/mapGenerator');


var path = require('path');
var mime = require('mime');
var cache = {};

function handler(req, res) {
    var filePath = false;
    if (req.url == '/') {
        filePath = '/index.html';
    } else {
        filePath = req.url;
    }
    var absPath = __dirname + filePath;
    serveStatic(res, cache, absPath);
}


function send404(response) {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.write('Error 404: resource not found.');
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200, { "content-type": mime.lookup(path.basename(filePath)) }
    );
    response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
    // if (cache[absPath]) {
    //     sendFile(response, absPath, cache[absPath]);
    // } else {
    fs.exists(absPath, function(exists) {
        if (exists) {
            fs.readFile(absPath, function(err, data) {
                if (err) {
                    send404(response);
                } else {
                    cache[absPath] = data;
                    sendFile(response, absPath, data);
                }
            });
        } else {
            send404(response);
        }
    });
    // }
}



// var mapa = fs.readFileSync("map.json", "utf8");
// map = JSON.parse(mapa);

var mapa = mapGenerator.generateMap();
map = JSON.parse(mapa);

global.texture = [];
global.players = [];

var player = {
    name: "",
    socket: "",
    token: "",
    oxygenLevel: 100,
    temperature: 36.6,
    energyLevel: 100,
    x: 0,
    y: 0,
    rotation: 0,
    inventory: []
}

// n - name
// s - socket
// t - token
function newPlayer(n, s, t) {
    p = player;
    p.name = n;
    p.socket = s;
    p.token = t;
    return p
}



io.on('connection', function(socket) {
    // texture = global.texture
    socket.emit('texture', texture);
    socket.emit('map', map);

    console.log("user connect " + socket.id);

    socket.on('hi', function(d) {
        token = md5(d.username)
        // console.log(newPlayer('neroslava', socket.id, token))
        global.players.push(newPlayer('test', socket.id, token));
        // console.log(global.players)
});


function getFiles(dirPath, callback) {

    fs.readdir(dirPath, function(err, files) {
        if (err) return callback(err);

        var filePaths = [];
        var name = [];
        async.eachSeries(files, function(fileName, eachCallback) {
            var filePath = path.join(dirPath, fileName);

            fs.stat(filePath, function(err, stat) {
                if (err) return eachCallback(err);

                if (stat.isDirectory()) {
                    getFiles(filePath, function(err, subDirFiles) {
                        if (err) return eachCallback(err);

                        filePaths = filePaths.concat(subDirFiles);
                        eachCallback(null);
                    });

                } else {
                    if (stat.isFile() && /\.png$/.test(filePath)) {
                        filePaths.push(filePath);
                        name = filePath.match(/[0-9]/)
                        name.push(filePath.match(/[0-9]/));
                    }

                    eachCallback(null);
                }
            });
        }, function(err) {
            callback(err, filePaths, name);
        });

    });
}


getFiles('./texture', function(err, files, name) {
    console.log("load texture ...")
    console.log(err || files);
    for (var i = 0; i < files.length; i++) global.texture[i] = "data:image/png;base64," + fs.readFileSync(files[i], 'base64');
});