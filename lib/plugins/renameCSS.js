var he = require('he');


module.exports = {	
    afterPhantomRequest: function(req, res, next) {
      	if(!req.prerender.documentHTML) {
      		  return next();
      	}
				req.prerender.documentHTML = req.prerender.documentHTML.replace(/href="\/public\/performance/g, "href=//s3.amazonaws.com/actorindex-sites/public/performance/");
        next();
    }
};
