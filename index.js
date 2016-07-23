// TEDxBOT
// version 0.2
// by dligthart <dligthart@gmail.com>

var config = require('./config');
var Botkit = require('botkit');
var controller = require(__dirname + '/WebSocketBot.js')({
    debug: true
});
// https://github.com/stormpath/stormpath-sdk-node/blob/master/example.js
var stormpath = require('stormpath');
var request = require('request');
var MapboxClient = require('mapbox');
var sgHelper = require('sendgrid').mail;
var sg = require('sendgrid').SendGrid(config.sendgrid.key);

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

controller.hears(['hi', 'hello', 'howdy', 'hallo', 'hoi'], ['direct_message', 'direct_mention'], function(bot, message) {
		if(message.data && message.data.data.email) {
      console.log('MESSAGE', message);
			bot.reply(message, 'Glad to have you here, ' + message.data.data.firstname);
		}
    else {
			startRegistrationConversation(bot, message);
		}
});

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
				customData: {
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
					reason2016: '', // ** reg flow
					event2016: '' // ** reg flow
				}
    };

    function configAccount() {
        return account;
    }

    bot.startConversation(message, function(err, convo) {
        convo.sayFirst('What a lovely day!');
        var msg = {
            attachment: {
            	type: "decision",
              payload: {
                text: 'Would you like to register?',
                yes: 'Yes',
      					no: 'No'
              }
            }
        };
        decide(convo, JSON.stringify(msg), function(r,c){
            c.say('Great! I will continue...');
            c.next();
            inputEmailRegistration(convo, configAccount);
        },
        function(r,c) {
          c.say('Perhaps you would like to login?');
          c.next();
          inputEmailLogin(c, configAccount);
        });
    });
}

function decide(convo, question, yesCb, noCb) {
  convo.ask(question, [{
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
          yesCb(response, convo);
      }
  }, {
      pattern: bot.utterances.no,
      callback: function(response, convo) {
          noCb(response, convo);
      }
  }]);
}

function inputName(convo, account) {
    convo.ask('I\'m delighted to make your acquaintance, may I ask what is your first name?', function(response, convo) {
        if(!response.text) {
          convo.next();
          inputName(convo, account);
        } else {
          account().givenName = capitalizeFirstLetter(response.text);
          convo.say('Pleased to meet you, ' + account().givenName + ' !');
          convo.next();
          convo.ask(account().givenName + ', if you don\'t mind me asking; what is your last name? ', function(response, convo) {
              account().surname = capitalizeFirstLetter(response.text);
              convo.say(account().givenName + ' ' + account().surname + ', What a beautiful name, splendid! ');
              createAccount(convo, account);
          });
        }

    });
}

function inputLocation(convo, account) {
  convo.ask('What is your city of residence?', function(response, convo) {
			account().customData.city = capitalizeFirstLetter(response.text);
			var client = new MapboxClient('pk.eyJ1IjoidGVkeGFtc3RlcmRhbSIsImEiOiJjaXEzbzAzZHAwMDZ1aTJuZGw2bXJtNW45In0.YDB2RiF_pHlry694BJcQaw');
			client.geocodeForward(account().customData.city, function(err, res) {
					//console.log(err, res);
					if(err) {
						convo.say('Wow, this city is not listed in my database; it must be lovely there for sure!');
						convo.next();
						convo.ask('In which country do you reside?)', function(response, convo) {
				        account().customData.country = response.text.toLowerCase()
								convo.say(account().customData.country + ' sounds like a cool place to be');
								convo.next();
				    });
					} else {
						if(res.features.length == 0) {
							convo.next();
							inputLocation(convo, account);
						}
						else {
							if(!res.features[0].context) {
								convo.next();
								inputLocation(convo, account);
							}
							else {
								var tempCountry = res.features[0].context[parseInt(res.features[0].context.length - 1)].text;
								console.log(res.features[0].context, res.features[0].context.length, tempCountry);
								account().customData.country = tempCountry;
								var reply = 'I love ' + account().customData.city + ' in ';
								if(account().customData.country.endsWith('s')
									|| account().customData.country.toLowerCase().indexOf('united') > -1
									|| account().customData.country.toLowerCase().indexOf('union') > -1
									|| account().customData.country.toLowerCase().indexOf('republic') > -1) {
									reply += 'the ' + account().customData.country;
								} else {
									reply += account().customData.country;
								}
						  	convo.say(reply);
								convo.next();
								inputOrg(convo, account);
							}
						}
					}
			});
	});
}

function inputOrg(convo, account) {
	convo.ask('What is the name of your organization?', function(response, convo) {
        account().customData.organization = response.text;
				convo.next();
				convo.ask('What is your function within the '+account().customData.organization+' organization?', function(response, convo) {
				  account().customData.function = capitalizeFirstLetter(response.text);
					convo.next();
					inputGender(convo, account);
				});
  });
}

function inputGender(convo, account) {
  decide(convo,
    JSON.stringify({
      attachment: {
        type: "decision",
        payload: {
          text: 'Are you male?',
          yes: 'Yes',
          no: 'No'
        }
      }
    }),
  function(r,c) {
    account().customData.gender = 'male';
    c.say('Hello Sir! Great! I will continue...');
    c.next();
  },
  function(r,c) {
    account().customData.gender = 'female';
    c.say('Hello Madam! Great! I will continue...');
    c.next();
  });
}

// choice: (linkedin), email address (exchange for linkedin if choice is email addr)

// verify email

// login status change front-end

// known account (email) -> enter password -> logged in -> check if registered for event ? -> yes -> loggedin -> redirect to homepage
// known account (email) -> enter password -> logged in -> check if registered for event ? -> no -> [event register flow]
// known account (email) -> enter password -> wrong password -> reset password -> check email

// unknown account (email) ->
// unknown account (email) ->

function inputEmailRegistration(convo, account) {
    convo.ask('Please enter your email address', function(response, convo) {
        account().email = extractEmail(response.text.toLowerCase());
        convo.say('Thanks you entered: ' + account().email);
				convo.say('I will check if this account is already present..')
				validateAccount(convo, account, false);
    });
}

function inputEmailLogin(convo, account) {
	convo.ask('Please enter your email address', function(response, convo) {
			account().email = extractEmail(response.text.toLowerCase());
			validateAccount(convo, account, true);
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
	console.log(msg);
  convo.say(JSON.stringify(msg));
	convo.next();
}

function validateAccount(convo, account, inLoginFlow) {
	application.getAccounts({ email: account().email }, function(err, accounts) {
		if(err) {
			convo.say('An error occurred during account validation');
			convo.next();
		}
		if (accounts && parseInt(accounts.size) >= 1) {
			convo.next();
      decide(convo, JSON.stringify({
          attachment: {
            type: "decision",
            payload: {
              text: 'I have located your account. Would you like to login?',
              yes: 'Yes login',
              no: 'Re-enter email'
            }
          }
      }), function(r,c) {
        c.next();
        c.ask('Please enter your password to login.', function(response, convo) {
            account().username = account().email;
  					account().password = response.text;
  					inputRegisterEvent(c, account);
  	    });
      }, function(r,c){
        c.next();
        inputEmailRegistration(c, account);
      });

    } else {
			convo.say("It seems that this account does not exist");
			convo.next();
      decide(convo, JSON.stringify({
          attachment: {
            type: "decision",
            payload: {
              text: account().givenName + ', did you enter the correct email address?',
              yes: 'Yes',
              no: 'No'
            }
          }
      }),
      function(r,c) {
        c.next();
        inputName(c, account);
      },
      function(r,c) {
        c.say('Ok let\'s go through it again...sigh..	;)');
        c.next();
        if(inLoginFlow) {
          inputEmailLogin(c, account);
        }
        else {
          inputEmailRegistration(c, account);
        }
      });
		}
	});
}

function createAccount(convo, account) {

    account().username = account().email;
    account().password = makePassword(13, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');

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
                        inputEmailRegistration(convo, account);
                        break;
                }
            }
        } else {
            console.log(createdAccount);
            convo.say('Splendid! You have been registered! Welcome!');
            convo.next();
						sendLogin(convo, account);
						sendMail(account().email, 'Your login credentials', account().username + ' ' + account().password);
            convo.next();
            inputRegisterEvent(convo, account);
        }
    });
}

function inputRegisterEvent(convo, account) {
	login(account().username, account().password, function(acc) {
		if(!acc) {
			validateAccount(convo, account, true);
		} else {
			console.log('Account info', acc);
			convo.next();
      if('yes' == acc.customData.event2016) {
          convo.say('I see you are already registered for the 2016 TedxAmsterdam event! You said the following:');
          convo.next();
          convo.say(acc.customData.reason2016);
          convo.next();
          convo.say('That is just awesome! See you soon!')
          convo.next();

      }
      else if(!acc.customData.event2016){
        decide(convo, JSON.stringify({
              attachment: {
                type: "decision",
                payload: {
                  text: 'Would you like to register for the event?',
                  yes: 'Yes',
                  no: 'No'
                }
              }
          }),function(r,c) {
            acc.customData.event2016 = 'yes';
            c.next();
            c.say('You are going ! :) ');
            c.next();
            c.ask('Can you tell me the reason why you want to go?', function(r, c) {
                acc.customData.reason2016 = r.text;
                acc.save(function (err, acc) {
                  if(!err) {
                    c.next();
                    c.say('Splendid! Thank you for registering for the event and have a great day!');
                    c.next();
                  } else {
                    c.say('Something went wrong..');
                    c.next();
                  }
                });
            });
          },
          function(r,c) {
            acc.customData.event2016 = 'no';
            acc.save(function (err, acc) {
              if(!err) {
                c.say('You are not going.. :( Maybe next time?');
                c.next();
              } else {
                c.say('Something went wrong..');
                c.next();
              }
            });
          });

      }
		}
	});
}

function inputTags() {

}

function inputLanguage() {
	// TODO: implment.
}

function inputBirthdate() {
	//TODO: implement
}

function loginWithLinkedIn() {
	//TODO: implement
}

function login(username, password, cb) {
	application.authenticateAccount({username: username, password: password}, function (err, authRes) {
		console.log(err, authRes);
		if(!err) {
			authRes.getAccount().expand({customData: true}).exec(function (err, acc) {
				console.log(err, acc);
				cb(acc);
			});
		} else {
			cb(false);
		}
	});
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

function getConceptsClassification(arr, callback) {
		var text = arr.join("+");
		//console.log(text);
		var api = 'https://alchemy.p.mashape.com/text/TextGetRankedConcepts?linkedData=false&outputMode=json&text=' + text;
		var options = {
		  url: api,
		  headers: {
		    'X-Mashape-Key': '3wA8TeL1DGmshMHp9kga5a1ffV1pp1Ws8gXjsnH2sCubmBNyxd',
				'Accept': 'application/json'
		  }
		};
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var result = JSON.parse(body);
				//console.log(result);
				callback({"concepts": result.concepts, "tags": arr});
			}
		});
}

function sendMail(toEmail, subject, body) {
  var from_email = new sgHelper.Email("bot@tedx.amsterdam");
  var to_email = new sgHelper.Email(toEmail);
  var content = new sgHelper.Content("text/plain", body);
  var mail = new sgHelper.Mail(from_email, subject, to_email, content);

  var requestBody = mail.toJSON();
  var request = sg.emptyRequest();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sg.API(request, function (response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
  });
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}
