var cacheManager = require('cache-manager');
var s3 = new (require('aws-sdk')).S3({params:{Bucket: process.env.S3_BUCKET_NAME}});
const async = require('async');

module.exports = {
    init: function() {
        this.cache = cacheManager.caching({
            store: s3_cache
        });
    },

    beforePhantomRequest: function(req, res, next) {
			return next();
			if(req.method !== 'GET') {
			    return next();
			}

			if (!req.headers.customdomain) {
				return res.send(200, 'No Header customdomain provided.');
			}

			// this.cache.get(req.prerender.url, function (err, result) {

			//     if (!err && result) {
			//         console.log('cache hit');
			//         return res.send(200, result.Body);
			//     }
					
			//     next();
			// });
			
    },

    afterPhantomRequest: function(req, res, next) {
			console.log('in afterPhantomRequest');
			console.log('req.prerender.url', req.prerender.url);
			console.log('headers', req.headers);
			if(req.prerender.statusCode !== 200) {
					return next();
			}
						
			var url = req.prerender.url.split('/').pop();
			console.log('setting url', url);
			if (!url) {
				return res.send(500, 'No Valid Page Name Set on url: ' + url);	
			}
			console.log('NODE_ENV', process.env.NODE_ENV);
			this.cache.set(url, req.prerender.documentHTML, process.env.NODE_ENV == 'production' ? req.headers.customdomain : 'test-' + req.headers.customdomain, function(err, result) {
					if (err) console.error(err);
					next();
			});
        
    }
};


var s3_cache = {
    get: function(key, callback) {
        if (process.env.S3_PREFIX_KEY) {
            key = process.env.S3_PREFIX_KEY + '/' + key;
        }

        s3.getObject({
            Key: key
        }, callback);
    },
    set: function(key, value, bucket, callback) {
        if (process.env.S3_PREFIX_KEY) {
            key = process.env.S3_PREFIX_KEY + '/' + key;
				}
				console.log('bucket', bucket);

					async.waterfall([
						function(next) {
							s3.headBucket({
								Bucket: bucket
							}, function(err, data) {
								if (err) {
									s3.createBucket({
											Bucket: bucket,
											CreateBucketConfiguration: {
												LocationConstraint: "eu-east-1"
											}											
										}, function(err, data) {							
											next(err);
									});									
								}								
							});
						},
						function(next) {
							var request = s3.putObject({
									Bucket: bucket,
									Key: key,
									ContentType: 'text/html;charset=UTF-8',
									StorageClass: 'REDUCED_REDUNDANCY',
									Body: value
							}, function(err) {
								next(err);
							});
						}
					], function(err) {
						callback(err);
					});					
    }
};
