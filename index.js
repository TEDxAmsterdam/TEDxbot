// TEDxBOT
// version 0.2
// by dligthart <dligthart@gmail.com>

var config = require('./config');

/** Botkit **/
var Botkit = require('botkit');
var controller = require(__dirname + '/WebSocketBot.js')({debug:true});

/** Stormpath **/
var stormpath = require('stormpath');

var apiKey = {
	id: config.stormpath.id,
	secret: config.stormpath.secret
};
var appId = config.stormpath.appId;

if(!apiKey.id || !apiKey.secret) {
	console.warn('Stormpath API key and secret are required');
	process.exit();
}

var client = new stormpath.Client({ apiKey: apiKey });

var application = null;

client.getApplication('https://api.stormpath.com/v1/applications/' + appId, function(err, resource) {
	if(err) console.log('Could not retrieve stormpath application', appId);
	application = resource;
});

var bot = controller.spawn({});

controller.setupWebserver(config.port, bot, function(err, webserver) {
	console.log('started ws');
});

controller.hears(['hi'], ['direct_message', 'direct_mention'], function (bot, message) {
  startRegistrationConversation(bot, message);
});

function startRegistrationConversation(bot, message) {
	var account = {
		  givenName: '',
			surname: '',
		  username: '',
		  email: '',
		  password: ''
	};
	function configAccount() {
			return account;
	}

	bot.startConversation(message, function(err, convo) {
    convo.say('Hello! Human!');
		convo.ask('Would you like to register? ', function(response, convo) {
			if('yes' == response.text.toLowerCase()) {
				convo.next();
				inputName(response, convo, configAccount);
			}
		});
  });
}

function createAccount(convo, account) {
	application.createAccount(account(), function(err, createdAccount) {
		if(err) {
			console.log(err);

			convo.say('Something went wrong during registration..');
			convo.next();

			// 2001: account exists.
			if(err.userMessage) {
		  	convo.say(err.userMessage);
				convo.next();

				switch(err.code) {
					case 2001:
						inputEmail(null, convo, account);
					break;
				}
			}

		} else {
		  console.log(createdAccount);
			convo.say('Splendid! You have been registered!');
			convo.next();
			convo.say('One more thing; you can use this password to log in: ' + account.password);
			convo.next();
			convo.say('Master, I bid you farewell. Thank you for activating my circuits. ');
			convo.next();
			convo.say('And please check your email - I have sent you a message..bye bye');
		}
	});
}

function inputName(response, convo, account) {
	convo.ask('I\'m delighted to make your acquaintance, Human, may I ask what is your designation?', function(response, convo) {
		account().givenName = capitalizeFirstLetter(response.text);
		convo.say('I am here to serve you, Master ' + account().givenName +' !');
		convo.next();
		convo.ask('Master '+ account().givenName + ', if you don\'t mind me asking; what is your last name? ', function(response, convo) {
			account().surname = capitalizeFirstLetter(response.text);
			convo.say(account().givenName +  ' ' + account().surname + ', Master, what a beautiful name, splendid! I have stored your full name in my memory banks..');
			convo.next();
			inputEmail(response, convo, account);
		});
	});
}

function inputEmail(response, convo, account) {
	convo.ask('Now please enter your email address so I can send you lots of spam - wink wink ;)', function(response, convo) {
		account().email = extractEmail(response.text.toLowerCase());
		convo.say('Thanks you entered: ' + account().email);
		convo.next();
		convo.ask('Master ' + account().givenName + ', did you enter the correct email address?', function(response, convo) {
			if('yes' == response.text) {
				account().username = account().email;
				account().password = makePassword(13, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');
				createAccount(convo, account);
			} else {
				convo.say('Ok let\'s go through it again...sigh..	');
				convo.next();
				inputEmail(response, convo, account);
			}
		});
	});
}

function makePassword(n, a) {
  var index = (Math.random() * (a.length - 1)).toFixed(0);
  return n > 0 ? a[index] + makePassword(n - 1, a) : '';
}

function extractEmail(text){
  var r = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
	if(r) {
		return r[0];
	}
	return null;
}

function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}
