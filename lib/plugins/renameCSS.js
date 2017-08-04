var he = require('he');


module.exports = {	
    afterPhantomRequest: function(req, res, next) {
      	if(!req.prerender.documentHTML) {
      		  return next();
      	}
				var res = str.replace(/href="\/public\/performance/g, "href=//s3.amazonaws.com/actorindex-sites/public/performance/");
				req.prerender.documentHTML = req.prerender.documentHTML.toString().replace(matches[i], '');
				
        next();
    }
};
