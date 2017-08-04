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
					if (err) {
						console.error(err);
						return res.send(500, err.message);	
					}
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
											Bucket: bucket
										}, function(err, data) {	
											console.log('err', err);						
											if (err) {
												return next(err);
											}
											var params = {
												Bucket: "bucket", 
												Policy: `{\"Version\": \"2008-10-17\", \"Statement\": [{ \"Sid\": \"AllowPublicRead\",\"Effect\": \"Allow\",\"Principal\": {\"AWS\": \"*\"}, \"Action\": [ \"s3:GetObject\"], \"Resource\": [\"arn:aws:s3:::${bucket}\" ] } ]}`
											};
											s3.putBucketPolicy(params, function(err, data) {
												console.log('new bucket policy', err);
												console.log('new bucket policy', data);

												// Create JSON for setBucketWebsite parameters
												var staticHostParams = {
													Bucket: bucket,
													WebsiteConfiguration: {
														ErrorDocument: {
															Key: 'error'
														},
														IndexDocument: {
															Suffix: 'index'
														},
													}
												};			
												s3.putBucketWebsite(staticHostParams, function(err, data) {
													if (err) {
														// display error message
														console.log("Error", err);
														next(err);
													} else {
														// update the displayed policy for the selected bucket
														console.log("Success", data);
														next(null);
													}
												});																								
											});											
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
						if (err) {
							console.log('err', err);
						}
						callback(err);
					});					
    }
};
