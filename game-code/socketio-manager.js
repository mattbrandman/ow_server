var app = require('../app');
var io = app.io;
var socketioJwt = require("socketio-jwt");
var User = require('../models/user');
var queueItem = require('../models/queue-item');
var mongoose = require('mongoose');

const EventEmitter = require('events')
secretKey = 'teatime';

class SocketManager extends EventEmitter{

    constructor() {
        super()
        this.socketMap = {};
        this.roomMap = {};
        io.on('connection', socketioJwt.authorize({
                secret: secretKey,
                timeout: 15000 // 15 seconds to send the authentication message
            }))
            .on('authenticated', socket => {
                this.reconnect(socket, socket.decoded_token.id);
                console.log(socket.id);
                console.log('logged in');
                this.map_userId_socket(socket.decoded_token.id, socket);
                socket.on('joinQueue', (data) => {
                    this.emit('newQueueItem', socket);
                });
            })
    }
    // should be moved at a later date to the queue server

    reconnect(socket, userId) {
        if (this.roomMap[userId.toString()] != undefined) {
            for(var i = 0; i < this.roomMap[userId.toString()].length; i++) {
                socket.join(this.roomMap[userId.toString()][i])
            }
        }
    }

    map_user_socket(user, socket) {
        this.socketMap[user.id] = socket;
    }

    map_userId_socket(userId, socket) {
    	this.socketMap[userId] = socket;
    }

    join_room(user, room) {
    	this.socketMap[user.id.toString()].join(room);
        var rooms = this.roomMap[user.id.toString()];
        if (rooms == undefined) {
            this.roomMap[user.id.toString()] = []
            this.roomMap[user.id.toString()].push(room)
        } else {
            this.roomMap[user.id.toString()].push(room);
        }
    }

    leave_room(user, room) {
    	this.socketMap[user.id.toString()].leave(room);
        var index = this.roomMap[user.id.toString()].indexOf(room.toString());
        if (index > -1) {
            roomMap[user.id.toString()].splice(index, 1);
        }
    }

    message_to_room(room, message, object = '') {
        console.log(room);
    	io.to(room.toString()).emit(message, object);
    }

    message_to_user(user, message, object='') {
    	var socket = this.socketMap[user.id.toString()];
    	socket.emit(message, object);
    }

    message_to_all(message, object='') {
    	io.emit(message, object);

    }

}

var socketManagerSingleton = new SocketManager();

module.exports = socketManagerSingleton;
