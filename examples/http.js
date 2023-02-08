;(function(){
	var cluster = require('cluster');
	if(cluster.isMaster){
	  return cluster.fork() && cluster.on('exit', function(){ cluster.fork(); require('../lib/crashed'); });
	}

	var fs = require('fs');
	var config = {
		port: process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8765,
		peers: process.env.PEERS && process.env.PEERS.split(',') || []
	};
	var Gun = require('../'); // require('gun')

	if(process.env.HTTPS_KEY){
		config.key = fs.readFileSync(process.env.HTTPS_KEY);
		config.cert = fs.readFileSync(process.env.HTTPS_CERT);
		config.server = require('https').createServer(config, Gun.serve(__dirname));
	} else {
		config.server = require('http').createServer(Gun.serve(__dirname));
	}

	const gunConfig = {
		web: config.server.listen(config.port),
		peers: config.peers,
	};

	if (process.env.AWS_ACCESS_KEY_ID) {
		gunConfig.s3 = {
			key: process.env.AWS_ACCESS_KEY_ID, // AWS Access Key
			secret: process.env.AWS_SECRET_ACCESS_KEY, // AWS Secret Token
			bucket: process.env.AWS_S3_BUCKET, // The bucket you want to save into
		}
	}

	var gun = Gun(gunConfig);

	console.log('Relay peer started on port ' + config.port + ' with /gun');

	module.exports = gun;
}());