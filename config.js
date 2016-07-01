module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 80,
	stormpath: {
		id: process.env.STORMPATH_ID ? process.env.STORMPATH_ID : '',
		secret: process.env.STORMPATH_SECRET ? process.env.STORMPATH_SECRET : '',
		appId: process.env.STORMPATH_APPID ? process.env.STORMPATH_APPID : '',
	},
	sendgrid: {
		username: process.env.SENDGRID_USERNAME ? process.env.SENDGRID_USERNAME : '',
		password: process.env.SENDGRID_PASSWORD ? process.env.SENDGRID_PASSWORD : '',
		key: process.env.SENDGRID_KEY ? process.env.SENDGRID_KEY : ''
	}
};
