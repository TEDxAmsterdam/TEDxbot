module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 80,
	stormpath: {
		id: process.env.STORMPATH_ID ? process.env.STORMPATH_ID : '',
		secret: process.env.STORMPATH_SECRET ? process.env.STORMPATH_SECRET : '',
		appId: process.env.STORMPATH_APPID ? process.env.STORMPATH_APPID : '',
	}
};
