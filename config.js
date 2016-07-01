module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 80,
	stormpath: {
		id: process.env.STORMPATH_ID ? process.env.STORMPATH_ID : 'NF0P0OR4JZ0BYI1MMHFCH9Z4X',
		secret: process.env.STORMPATH_SECRET ? process.env.STORMPATH_SECRET : 'jjpXpjDjBF8o21VzltHygmYhAkbEozbk7NPsyAPogfQ',
		appId: process.env.STORMPATH_APPID ? process.env.STORMPATH_APPID : '2dOFY5UnOtoCGznZKlA5ax',
	},
	sendgrid: {
		username: process.env.SENDGRID_USERNAME ? process.env.SENDGRID_USERNAME : 'app52491998@heroku.com',
		password: process.env.SENDGRID_PASSWORD ? process.env.SENDGRID_PASSWORD : '18jmleeb8776',
		key: process.env.SENDGRID_KEY ? process.env.SENDGRID_KEY : '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'
	}
};
