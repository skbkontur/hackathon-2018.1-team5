var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var Base64 = require('js-base64').Base64;
app.listen(80, "10.34.34.49");
var async = require('async');
var md5 = require('md5');
var mapGenerator = require('./map/mapGenerator');
var player = require('./player/player');
var calculator = require('./calcPosition');


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

//генерация карты
var map = mapGenerator.generateMap();
// console.log(map);

global.texture = [];
global.players = [];
global.power = 0;
global.h20 = 0;
global.tin = 0;
global.copper = 0;
global.res = {
    power: 0,
    h20: 100,
    tin: 100,
    copper: 100,
};

// var mapa = fs.readFileSync("map.json", "utf8");
// map = JSON.parse(mapa);
// console.log(map[0])

io.on('connection', function(socket) {
    // console.log(global.players)
    // texture = global.texture
    socket.emit('texture', global.texture);
    socket.emit('map', map);

    console.log(socket.handshake.address);

    socket.on('hello', function(d) {
        //
        if(socket.handshake.address == '10.34.32.59') username = 'pingvi96'
        if(socket.handshake.address == '10.34.34.49') username = 'neroslava'
        token = md5(d.username + socket.id)
        p = {
            username: 'name',

            oxygenLevel: 100,
            temperature: 36.6,
            energyLevel: 100,
            oxygen: 100,

            x: 0,
            y: 0,

            chunkX: -1,
            chunkY: 0,

            blockX: 15,
            blockY: 15,

            socket: "",
            token: "",

            rotation: 0,
            inventory: []
        }
        p.username = username
        p.token = token
        p.socket = socket.id
        global.players.push(p);
        // console.log(newPlayer);
        socket.emit('hello', {
            username: username,
            token: token
        });
    });

    socket.on('you', function(d) {
        for (var i = 0; i < global.players.length; i++) {
            if (global.players[i].socket == socket.id) {
                var landCoord = calculator.getCurrentBlockAndChank(d.x, d.y);
                global.players[i].chunkX = landCoord.chunkX;
                global.players[i].chunkY = landCoord.chunkY;
                global.players[i].blockX = landCoord.blockX;
                global.players[i].blockY = landCoord.blockY;

                global.players[i].oxygen = d.oxygen;
                // global.players[i].username = d.username;
                global.players[i].energyLevel = d.energyLevel;
                global.players[i].temperature = d.temperature;

                global.players[i].x = d.x
                global.players[i].y = d.y
                global.players[i].rotation = d.rotation
            }
        }
    });

    socket.on('map', function(d) {
        socket.emit('map', d);
    });
    socket.on('power', function(d) {
        global.power = global.power+5
    });
    socket.on('h20', function(d) {
        global.h20 = global.h20+5
    });
    socket.on('tim', function(d) {
        global.tim = global.tim+5
    });
    socket.on('copper', function(d) {
        global.copper = global.copper+5
    });



    setInterval(function() {

        global.res.power = global.res.power

        for (var i = 0; i < global.players.length; i++) {

            if (global.players[i].oxygen != 0) global.players[i].oxygen = global.players[i].oxygen - 0.01;

            if (global.players[i].socket == socket.id) {
                io.sockets.sockets[global.players[i].socket].emit('you', global.players[i])
            }
        }
        socket.emit('players', global.players);
        socket.emit('res', global.res);

    }, 1000 / 30)

    setInterval(function() {

        global.res.power = global.res.power + global.power;
        global.res.h20 = global.res.h20 + global.h20;
        global.res.tim = global.res.tim + global.tim;
        global.res.copper = global.res.copper + global.copper;

    }, 2000 )

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
    for (var i = 0; i < files.length; i++) {
        global.texture[i] = "data:image/png;base64," + fs.readFileSync(files[i], 'base64');
    }
})