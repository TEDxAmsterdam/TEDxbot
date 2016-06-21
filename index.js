// TEDxBOT
// version 0.2
// by dligthart <dligthart@gmail.com>

var config = require('./config');

/** Botkit **/
var Botkit = require('botkit');
var controller = require(__dirname + '/WebSocketBot.js')({
    debug: true
});

/** Stormpath **/
var stormpath = require('stormpath');

var apiKey = {
    id: config.stormpath.id,
    secret: config.stormpath.secret
};
var appId = config.stormpath.appId;

if (!apiKey.id || !apiKey.secret) {
    console.warn('Stormpath API key and secret are required');
    process.exit();
}

var client = new stormpath.Client({
    apiKey: apiKey
});

var application = null;

client.getApplication('https://api.stormpath.com/v1/applications/' + appId, function(err, resource) {
    if (err) console.log('Could not retrieve stormpath application', appId);
    application = resource;
});

var bot = controller.spawn({});

controller.setupWebserver(config.port, bot, function(err, webserver) {
    console.log('started ws');
});

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`say Hi ` to start a conversation with me.\n' +
      '`say help` to see this again.'
  bot.reply(message, help)
});

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'This is a test for an attachment'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Whoop whoop',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'http://dev.tedx.amsterdam',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
});

controller.hears(['register', 'signup', 'create account', 'sign up'], ['direct_message', 'direct_mention'], function(bot, message) {
	if(message.data && message.data.data.email) {
		bot.reply(message, 'I\'m sorry, ' + message.data.data.firstname + ' I\'m afraid I can\'t do that.');
	}
	else {
		startRegistrationConversation(bot, message);
	}
});

controller.hears(['hi', 'hello', 'what\'s up', 'howdy', 'hallo', 'hoi', 'he', 'hai', 'dag'], ['direct_message', 'direct_mention'], function(bot, message) {
		if(message.data && message.data.data.email) {
			bot.reply(message, 'Glad to have you here, ' + message.data.data.firstname);
			bot.reply(message, 'You are logged in and ready for action!');
		}
    else {
			startRegistrationConversation(bot, message);
		}
});

function startHelp(bot, message) {
	// TODO:
	// stop, start, proceed, quit, ask me anything
}

/**
id,
firstname,
lastname,
title,
gender,
email,
address,
zipcode,
city,
country,
phonenumber,
birthdate,
language,
organization,
function,
tag1,
tag2,
tag3,
role,
status,
venue,
by_who,
twitter,
ning_profile,
What is your BIG question?,
backend_tag,
Attended in
*/

// Onboarding flow.
function startRegistrationConversation(bot, message) {
    var account = {
        givenName: '', 	// *
        surname: '', 		// *
        username: '',	 	// * - email
        email: '',  		// *
        password: '', 	// * - generated
				gender: 'male|female',
				organization: '', // ** reg flow
				function: 'function', // ** reg flow
				language: '',
				birthdate: '',
				address: '',
				zipcode: '',
				city: '', 			// *
				country: '',
				phone: '',
				tags:'', // ** reg flow
				reason: '', // ** reg flow
    };

    function configAccount() {
        return account;
    }

    bot.startConversation(message, function(err, convo) {
        convo.sayFirst('What a lovely day!');
        convo.ask('Would you like to register? ', [{
						pattern: bot.utterances.yes,
						callback: function(response, convo) {
								convo.say('Great! I will continue...');
								convo.next();
								inputName(response, convo, configAccount, bot);
						}
				}, {
						pattern: bot.utterances.no,
						callback: function(response, convo) {
								convo.say('Perhaps later.');
								convo.next();
						}
				}]);
    });
}

// Event registration flow.
function startEventRegistrationConversation() {
	// input tags (interests).
}

function createAccount(convo, account) {
    application.createAccount(account(), function(err, createdAccount) {
        if (err) {
            console.log(err);

            convo.say('Something went wrong during registration..');
            convo.next();

            // 2001: account exists.
            if (err.userMessage) {
                convo.say(err.userMessage);
                convo.next();

                switch (err.code) {
                    case 2001:
                        inputEmail(null, convo, account);
                        break;
                }
            }

        } else {
            console.log(createdAccount);
            convo.say('Splendid! You have been registered!');
            convo.next();
						sendLogin(convo, account);
          //  convo.say('One more thing; you can use this password to log in: ' + account().password);
          //  convo.next();
            convo.say('Master, I bid you farewell. Thank you for activating my circuits. ');
            convo.next();
            convo.say('And please check your email - I have sent you a message..bye bye');
        }
    });
}

function inputName(response, convo, account, bot) {
    convo.ask('I\'m delighted to make your acquaintance, may I ask what is your first name?', function(response, convo) {
        account().givenName = capitalizeFirstLetter(response.text);
        convo.say('I am here to serve you, Master ' + account().givenName + ' !');
        convo.next();
        convo.ask('Master ' + account().givenName + ', if you don\'t mind me asking; what is your last name? ', function(response, convo) {
            account().surname = capitalizeFirstLetter(response.text);
            convo.say(account().givenName + ' ' + account().surname + ', Master, what a beautiful name, splendid! I have stored your full name in my memory banks..');
            convo.next();
            inputEmail(response, convo, account, bot);
        });
    });
}

// inputLocation() of cityname
function inputLocation(response, convo, account, bot) {

}

// choice: (linkedin), email address (exchange for linkedin if choice is email addr)

// verify email

// login status change front-end

// known account (email) -> enter password -> logged in -> check if registered for event ? -> yes -> loggedin -> redirect to homepage
// known account (email) -> enter password -> logged in -> check if registered for event ? -> no -> [event register flow]
// known account (email) -> enter password -> wrong password -> reset password -> check email

// unknown account (email) ->
// unknown account (email) ->

function inputEmail(response, convo, account, bot) {
    convo.ask('Now please enter your email address so I can send you lots of spam - wink wink ;)', function(response, convo) {
        account().email = extractEmail(response.text.toLowerCase());
        convo.say('Thanks you entered: ' + account().email);
        convo.next();
				//TODO remove this make it shorter.
				convo.ask('Master ' + account().givenName + ', did you enter the correct email address?', [{
            pattern: bot.utterances.yes,
            callback: function(response, convo) {
								account().username = account().email;
								account().password = makePassword(13, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');
								createAccount(convo, account);
            }
        }, {
            pattern: bot.utterances.no,
            callback: function(response, convo) {
              	convo.say('Ok let\'s go through it again...sigh..	;)');
								inputEmail(response, convo, account);
            }
        }]);
    });
}

function sendLogin(convo, account) {
	var msg = {
      attachment: {
      	type: "login",
        payload: {
          username: account().username,
					password: account().password
        }
      }
  };
  convo.say(JSON.stringify(msg));
	convo.next();
}

function inputTags() {

}

function inputLanguage() {
	// TODO: implment.
}

function inputBirthdate() {
	//TODO: implement
}

function inputGender() {
	//TODO: implement.
}

function inputOrg() {
	//TODO: implement.
}

function loginWithLinkedIn() {
	//TODO: implement
}

function makePassword(n, a) {
    var index = (Math.random() * (a.length - 1)).toFixed(0);
    return n > 0 ? a[index] + makePassword(n - 1, a) : '';
}

function extractEmail(text) {
    var r = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    if (r) {
        return r[0];
    }
    return null;
}

function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}
