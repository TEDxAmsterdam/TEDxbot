// WebsocketBot v1.1
// by dligthart <dligthart@gmail.com>
var Botkit = require(__dirname + '/node_modules/botkit/lib/CoreBot.js');
var async = require('async');
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var session = require("express-session")({
    secret: "tedx-chat-session-secret-1111",
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");

var activeSockets = [];

function WebSocketBot(configuration) {

    var ws_botkit = Botkit(configuration || {});
    var bot = {};

    ws_botkit.defineBot(function(botkit, config) {
        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {
						if(message.channel) {
							botkit.debug('bot.send: ', message);

							var activeSocket = {};
							for(var i=0;i<activeSockets.length;i++) {
								botkit.debug(activeSockets[i].id);
								if(activeSockets[i].id.indexOf(message.channel) > -1){
									activeSocket = activeSockets[i];
								}
							}
							if(activeSocket.id) {
		            activeSocket.emit('message', {
		                user: 'tedxbot',
		                channel: message.channel,
		                text: message.text
		            });
							} else {
								botkit.debug('No active socket found');
							}
						} else {
							botkit.debug('bot.send: No channel id found');
						}
        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.user = src.user;
            msg.channel = src.channel;

            bot.say(msg, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                        botkit.tasks[t].convos[c].source_message.channel == message.channel
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }

            cb();
        };

        return bot;
    });

    ws_botkit.on('tick', function() {
      //  console.log('hello, my circuits are fine..');
    });

    ws_botkit.setupWebserver = function(port, bot, cb) {
        app.use(session);
        io.use(sharedsession(session));

				app.use(express.static(path.join(__dirname, 'public')));

        app.get('/', function(req, res) {
            res.send('<h1>Hello world</h1>');
        });

        server.listen(port ? port : 80);
        io.on('connection', function(socket, err) {

						var socketId = socket.id;
  					var clientIp = socket.request.connection.remoteAddress;

						console.log('Connection established', socketId, clientIp);

            socket.on('message', function(message) {
                console.log(message);
                ws_botkit.trigger('direct_message', [bot, message]);
                ws_botkit.receiveMessage(bot, message);
            });

						activeSockets.push(socket);

						socket.on('disconnect', function() {
				      console.log('Got disconnect!', socket.id);
				      var i = activeSockets.indexOf(socket);
				      activeSockets.splice(i, 1);
							for(var i=0;i<activeSockets.length;i++) {
								console.log('Active connection:', activeSockets[i].id);
							}
				   });
        });
        ws_botkit.config.port = port;
        return ws_botkit;
    };

    ws_botkit.createWebhookEndpoints = function(webserver, bot, cb) {
        console.log('testing..');
    };

    ws_botkit.startTicking();

    return ws_botkit;
};

module.exports = WebSocketBot;
