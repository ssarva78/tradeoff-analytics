var AffinityAnalyzer = require('./affinity-analysis.js'),
	TradeOffAnalyzer = require('./tradeoff-analysis.js'),
	ProductRecommender = require('./product-recommender.js'),
	setutil = require('./setutil.js'),
	express = require('express'),
	bodyParser = require('body-parser'),
	fs = require('fs');

var app = express(), web = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

web.get('/', function(request, response) {
	try {
		var htmlbody = fs.readFileSync('index.html', 'utf8');
		response.status(200).send(htmlbody);
	} catch(err) {
		if(!err || Object.keys(err).length == 0) err = "internal error";
		response.status(500).send(JSON.stringify({error: err}));
	}
});

web.get('/proto', function(request, response) {
	try {
		//var proto = fs.readFileSync('consumer-analytics.proto', 'utf8');
		response.setHeader('Content-disposition',
				'attachment;filename=consumer-analytics.proto');
		response.setHeader('Content-type', 'text/plain');
		
		var fstream = fs.createReadStream('./consumer-analytics.proto');
		fstream.pipe(response);
		
	} catch(err) {
		if(!err || Object.keys(err).length == 0) err = "internal error";
		response.status(500).send(JSON.stringify({error: err}));
	}
});

//affinity apis
app.post('/api/analytics/affinity', function(request, response) {
	/*
	 * sample request structure:
	 * { transactions: [[item1, item2], [item1, ...], ... ],
	 *   itemsets: [[newitem1, newitem2], ...]}
	 *
	 * sample response structure:
	 * { [{itemset: [newitem1, newitem2], confidence: "0.5"}, ...] }
	 */
	try {
		var transactions = request.body.transactions;
		var itemsets = request.body.itemsets;
		var support_threshold = request.body.support_threshold;
		var confidence_threshold = request.body.confidence_threshold;
		
		// initialize analyzer
		var analyzer = new AffinityAnalyzer(
							support_threshold, confidence_threshold);
		
		// get unique item set
		var unique_items = setutil.universalset(transactions);
		
		// get frequency item sets
		var contentions = analyzer.contenders(transactions, unique_items);
		
		var response_obj = [];
		
		for(var i = 0; i < itemsets.length; i++) {
			// find confidence for each target item set
			var confidence = analyzer.rules(
									transactions,
									contentions,
									itemsets[i]);

			/* var confidence_item = {
						itemset: itemsets[i],
						association_rules: confidence
					}; */
			
			response_obj.push({
						itemset: itemsets[i],
						association_rules: confidence
					});
		}
		
		response.status(200).send(JSON.stringify(response_obj));
	} catch(err) {
		if(!err || Object.keys(err).length == 0) err = "internal error";
		response.status(500).send(JSON.stringify({error: err}));
	}
});

//tradeoff apis
app.post('/api/analytics/tradeoff', function(request, response) {
	try {
		var constraints = request.body.constraints;
		var candidates = request.body.candidates;
		var limit = request.body.limit;

		var result = TradeOffAnalyzer.tradeoff(constraints, candidates, limit);

		response.status(200).send(JSON.stringify(result));
	} catch(err) {
		if(!err || Object.keys(err).length == 0) err = "internal error";
		response.status(500).send(JSON.stringify({error: err}));
	}
});

//product recommender
/*
 * request:
 * {
 * 	constraints: {"?" : {goal: "min|max", weight: "?"}, ...},
 * 	transactions: [{title: "", description:"", attributes: {"?" : ["", "", ...], ...}},...],
 * 	candidates: [{title: "", description:"", attributes: {"?" : ["", "", ...], ...}},...],
 * }
 */
app.post('/api/analytics/product', function(request, response) {
	try {
		var constraints = request.body.constraints;
		var transaction = request.body.transactions;
		var candidates = request.body.candidates;
		var support_threshold = request.body.support_threshold;
		var confidence_threshold = request.body.confidence_threshold;
		var limit = request.body.limit;
		
		var result = ProductRecommender.recommend(
								constraints, transaction, candidates,
								support_threshold, confidence_threshold,
								limit);
		
		response.status(200).send(JSON.stringify(result));
		
	} catch(err) {
		if(!err || Object.keys(err).length == 0) err = "internal error";
		response.status(500).send(JSON.stringify({error: err}));
	}
});

function api_server() {
	var port = process.env.CONSUMER_ANALYTICS_API_PORT || 20002;

	console.log('api server is listening to port ' + port + '...');

	var apiserver = app.listen(port);
	
	return apiserver;
}

function web_server() {
	var port = process.env.CONSUMER_ANALYTICS_WEB_PORT || 20001;

	console.log('web server is listening to port ' + port + '...');

	var webserver = web.listen(port);
	
	return webserver;
}

module.exports.api_server = api_server;
module.exports.web_server = web_server;

