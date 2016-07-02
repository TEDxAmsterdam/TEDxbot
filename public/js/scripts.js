	/* http://tedxchatbot.herokuapp.com  */
	var socket = io.connect('http://localhost');

	socket.on('connect', function() {
		console.log('Client has connected to the server!');
		socket.on('message', function(data) {
			console.log(data);
			$('#content').delay(textDelay).queue(function(n) {
				if (data.text && data.text.search('payload') == -1) {
					printChat(data, false);
				} else {
					data.text = JSON.parse(data.text);

					if ('image' == data.text.attachment.type) {
						printChat(data, false); //  data.text.attachment.payload.url
					} else if ('login' == data.text.attachment.type) {
						User.signin(data.text.attachment.payload.username, data.text.attachment.payload.password, {
							cache: true
						}).done(function(user) {
							console.log('Logged in', user.data);

							var data = {
								user: 'tedxbot',
								text: 'Master ' + user.data.firstname + ' you are now logged in !'
							};

							printChat(data, false);

						}).fail(function(err) {
							console.log(err);

							var data = {
								user: 'tedxbot',
								text: 'Your password appears to be incorrect'
							};
							printChat(data, false);
						});
					}
				}
				n();
			});
		});
	});

	socket.on('disconnect', function() {
		console.log('The client has disconnected!');
	});

	function printChat(data, me) {
		var who = 'them';
		if (me) {
			who = 'me';
		} else {
			data.avatar = '//pi.tedcdn.com/r/pe.tedcdn.com/images/ted/c9928d59974a7d5b8f8889794634cbded07ff266_1600x1200.jpg?c=1050%2C550&w=180';
		}
		$('#content').delay(textDelay).queue(function(n) {
			console.log('print', data);
			var templ = '<div class="message-wrapper ' + who + '"><div class="circle-wrapper animated bounceIn" style="background-image:url('+data.avatar+'); background-position:-70px -285px"></div><div class="text-wrapper animated fadeIn">' + data.text + '</div></div>';
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
			printChat(data, me);
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
				user: 'tedxbot',
				text: 'Hello!'
			};
			if (currentUser && currentUser.data && currentUser.data.email) {
				data.text = 'Welcome back ' + currentUser.data.firstname;
			}
			printChat(data, false);
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

	var $content = $('#content');
  var $inner = $('#inner');
	function scrollBottom() {
        $($inner).animate({ scrollTop: $($content).offset().top + $($content).outerHeight(true) }, {
            queue: false,
            duration: 'ease'
        });
    }
