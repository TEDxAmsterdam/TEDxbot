var SOCKET_SERVER_URL = 'http://tedxchatbot.herokuapp.com';

function messageReducer(state, action) {
  if (typeof state === 'undefined') {
    return {body: null};
  }
  switch (action.type) {
    case 'MESSAGE_RECEIVED':
      return {body: action.message};
    default:
      return {body: null};
  }
}

function userReducer(state, action) {
	if (typeof state === 'undefined') {
    return {};
  }
	switch(action.type) {
		case 'LOGGEDIN':
			return {user: action.user};
		default:
			return {user: null};
	}
}
function attachmentReducer(state, action) {
	if (typeof state === 'undefined') {
    return {};
  }
	switch(action.type) {
		case 'ATTACHMENT_RECEIVED':
			if('login' == action.attachment.type) {
				return {login: action.attachment.payload};
			}
			else if('image' == action.attachment.type){
				return {image: null};
			}
		default:
			return {};
	}
}
var rootReducer = Redux.combineReducers({
    message: messageReducer,
		user: userReducer,
		attachment: attachmentReducer
});

var store = Redux.createStore(rootReducer);

function render() {
	state = store.getState();
	console.log('state', state);

	// Print message from bot.
	if(state.message.body) {
		var who = 'them';
		var avatar = '/images/avatar.png';
		$('#content').delay(textDelay).queue(function(n) {
			var templ = $('<div class="message-wrapper ' + who + '"><div class="circle-wrapper animated bounceIn" style="background-image:url('+avatar+'); background-size: 50px 50px;background-position:-5px -5px"></div><div class="text-wrapper animated fadeIn">' + state.message.body + '</div></div>');
			var indicator = $('<img class="indicator" src="/images/chatindicator.gif"/>');
			var parent = $(this);
			$(this).remove('.indicator');
			indicator.appendTo($(this)).fadeOut('slow', function(){
				parent.append(templ);
				$('#input').val('');
				scrollBottom();
			});
			scrollBottom();
			n();
		});
	}

	// Login user.
	if(state.attachment.login) {
		User.signin(state.attachment.login.username, state.attachment.login.password, {
			cache: true
		}).done(function(user) {
			store.dispatch(loggedInAction(user.data));
			store.dispatch(messageReceivedAction('Master ' + user.data.firstname + ' you are now logged in !'));
		}).fail(function(err) {
			console.log(err);
			store.dispatch(messageReceivedAction('Your password appears to be incorrect'));
		});
	}
}

function loggedInAction(userData) {
	return {
		type: 'LOGGEDIN',
		user: userData
	}
}

function messageReceivedAction(message) {
	return {
		type: 'MESSAGE_RECEIVED',
		message: message
	}
}

function attachmentReceivedAction(attachment) {
	return {
		type: 'ATTACHMENT_RECEIVED',
		attachment: attachment
	}
}

render()
store.subscribe(render);

var socket = io.connect(SOCKET_SERVER_URL);
socket.on('connect', function() {
	console.log('Client has connected to the server!');
	socket.on('message', function(data) {
		//console.log(data);
		$('#content').delay(textDelay).queue(function(n) {
			if (data.text && data.text.search('payload') == -1) {
				store.dispatch(messageReceivedAction(data.text));
			} else {
				data.text = JSON.parse(data.text);
				if(data.text.attachment.type) {
					store.dispatch(attachmentReceivedAction(data.text.attachment));
				}
			}
			n();
		});
	});
});

socket.on('disconnect', function() {
	console.log('The client has disconnected!');
});

function printChat(text) {
	who = 'me';
	$('#content').delay(textDelay).queue(function(n) {
		var templ = '<div class="message-wrapper ' + who + '"><div class="animated bounceIn"></div><div class="text-wrapper animated fadeIn">' + text + '</div></div>';
		$(this).append(templ);
		$('#input').val('');
		scrollBottom();
		n();
	});
}

function sendChat(message, me) {
	var text = message;
	if (!message) {
		text = $('#input').val()
	}
	console.log('sending: ' + text);
	var data = {
		user: 'You',
		channel: socket.io.engine.id,
		text: text,
		data: currentUser
	};
	socket.emit('message', data);
	if (!message) {
		printChat(data.text);
	}
}

$.fn.enterKey = function(fnc) {
	return this.each(function() {
		$(this).keypress(function(ev) {
			var keycode = (ev.keyCode ? ev.keyCode : ev.which);
			if (keycode == '13') {
				fnc.call(this, ev);
			}
		});
	});
}

$(function() {
	$('#content').delay(textDelay).queue(function(n) {
		var data = {
			text: 'Hello!'
		};
		if (currentUser && currentUser.data && currentUser.data.email) {
			data.text = 'Welcome back ' + currentUser.data.firstname;
		}
		store.dispatch(messageReceivedAction(data.text));
		n();
	});

	$("form").on('submit', function(e) {
		e.preventDefault();
	});

	$("#input").enterKey(function() {
		sendChat(false, true);
	})

	$('#send').on('click', function() {
		sendChat(false, true);
	});

	$('#login').on('click', function() {
		login();
	});
});

function onLogin(user) {
	// Do stuff upon user login.
	console.log('User loggedin', user);
	alert(user.email + ' is loggedin');
}

function login() {
	if (currentUser && currentUser.data && currentUser.data.email) {
		var user = currentUser;
		onLogin(user.data);
	} else {
		var userObj = {
			email: $('.signin-form #email').val(),
			password: $('.signin-form #password').val(),
		};
		User.signin(userObj.email, userObj.password, {
			cache: true
		}).done(function(user) {
			onLogin(user.data);
		}).fail(function(err) {
			console.log(err);
		});
	}
}

function scrollBottom() {
	var $content = $('#content');
	var $inner = $('#inner');
  $($inner).animate({ scrollTop: $($content).height() }, {
  	queue: true,
    duration: 'ease'
  });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
