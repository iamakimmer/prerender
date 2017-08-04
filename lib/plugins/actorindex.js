var cacheManager = require('cache-manager');


module.exports = {
	beforePhantomRequest: function(req, res, next) {
		if (!req.headers.customdomain) {
			return res.send(401, 'No Header customdomain provided.');
		}
		
		return next();
	}    
};
