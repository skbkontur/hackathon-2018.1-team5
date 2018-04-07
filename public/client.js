var socket = io('10.34.34.49');

var mapC = document.getElementById("map");
var mapL = mapC.getContext("2d");

mapC.width = 1024;
mapC.height = 768;


var playerC = document.getElementById("player");
var objM = playerC.getContext("2d");


playerC.width = 1024;
playerC.height = 768;


var objC = document.getElementById("obj");
var objI = objC.getContext("2d");


objC.width = 1024;
objC.height = 768;

window.player = {
    x: 0,
    y: 0,
    rotation: 0,
    oxygen: 0,
    speed: 2
}


socket.on('texture', function(d) {
    localStorage.setItem("texture", JSON.stringify(d))
});
socket.on('map', function(d) {
    window.maps = d;
    console.log(window.maps);
});
socket.on('hi', function(d) {
    localStorage.setItem("token", d.token)
});

socket.on('you', function(d) {
    window.player.oxygen = d.oxygen;
});

$(document).ready(function() {
    socket.emit('hi', { username: 'test' });
});



var control = {
    "w": false,
    "a": false,
    "s": false,
    "d": false,
    "mouseX": 0,
    "mouseY": 0,
}


//  двигать карту
// отрисовка персов 
//  отрисовка угла перса 


function draw() {
    mapL.clearRect(0, 0, mapC.width, mapC.height);
    objI.clearRect(0, 0, mapC.width, mapC.height);
    objM.clearRect(0, 0, mapC.width, mapC.height);
    texture = JSON.parse(localStorage.texture);
    for (var i = 0; i < texture.length; i++) {
        src = texture[i];
        texture[i] = new Image();
        texture[i].src = src;
    }

    for (var i = 0; i < 16; i++) {
        for (var j = 0; j < 16; j++) {
            x = 32 * i;
            y = 32 * j;
            // mapL.drawImage(texture[11], 0, 0, 32, 32, x, y, 32, 32);
            mapL.drawImage(texture[window.maps[0].map[i][j].texture], 0, 0, 32, 32, x, y, 32, 32);
            // mapL.drawImage(texture[window.map[i][j].texture], 0, 0, 64, 64, x, y, 64, 64);
        }
    }
    objM.drawImage(texture[15], 512 + window.player.x, 368 + window.player.y);
    // socket.emit('move', { token:  localStorage.getItem("token"), control: control });


    if (control['s']) window.player.y = window.player.y + window.player.speed;
    if (control['w']) window.player.y = window.player.y - window.player.speed;
    if (control['a']) window.player.x = window.player.x - window.player.speed;
    if (control['d']) window.player.x = window.player.x + window.player.speed;

    console.log(window.player)
    console.log(control)
}



setInterval(draw, 1000 / 30)





var TO_RADIANS = Math.PI / 180;

function drawRotatedImage(image, x, y, angle) {
    objM.save();
    objM.translate(x, y);
    objM.rotate(TO_RADIANS * angle);
    objM.drawImage(image, -(image.width / 2), -(image.height / 2));
    objM.restore();
}


$(document).mousemove(function(e) {
    CW = $(document).width();
    CH = $(document).height();
    x = e.pageX - CW / 2
    y = e.pageY - CH / 2
    control.mouseX = x;
    control.mouseY = y;
});

$(document).keydown(function(eventObject) {
    switch (eventObject.which) {
        case 87:
            control.w = true;
            break;

        case 65:
            control.a = true;
            break;

        case 83:
            control.s = true;
            break;

        case 68:
            control.d = true;
            break;

        default:
            break;
    }
});

$(document).keyup(function(eventObject) {
    switch (eventObject.which) {
        case 87:
            control.w = false;
            break;

        case 65:
            control.a = false;
            break;

        case 83:
            control.s = false;
            break;

        case 68:
            control.d = false;
            break;

        default:
            break;
    }

});