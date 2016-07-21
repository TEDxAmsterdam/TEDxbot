module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 80,
	stormpath: {
		id: process.env.STORMPATH_ID ? process.env.STORMPATH_ID : '310HWH2M6UPYINU7FO1484W0X',
		secret: process.env.STORMPATH_SECRET ? process.env.STORMPATH_SECRET : 'SNaz2bTgaA/e2JCTvVXJjgg+22PDz+OR/+/W7Glt1rg',
		appId: process.env.STORMPATH_APPID ? process.env.STORMPATH_APPID : '2dOFY5UnOtoCGznZKlA5ax',
	},
	sendgrid: {
		username: process.env.SENDGRID_USERNAME ? process.env.SENDGRID_USERNAME : '',
		password: process.env.SENDGRID_PASSWORD ? process.env.SENDGRID_PASSWORD : '',
		key: process.env.SENDGRID_KEY ? process.env.SENDGRID_KEY : ''
	}
};
