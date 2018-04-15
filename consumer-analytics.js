var webserver = require('./consumer-analytics-api.js'),
	grpcserver = require('./consumer-analytics-grpc-server.js');


console.log('starting web server...');
webserver.web_server();

console.log('starting api server...');
webserver.api_server();

console.log('starting grpc server...');
grpcserver.grpc_server();

