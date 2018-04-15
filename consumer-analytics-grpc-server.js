var grpc = require('grpc');
var AffinityAnalyzer = require('./affinity-analysis.js'),
	TradeOffAnalyzer = require('./tradeoff-analysis.js'),
	ProductRecommender = require('./product-recommender.js'),
	setutil = require('./setutil.js');
	
var analytics_pkg = 
		grpc.load('./consumer-analytics.proto').grpc.analytics;

function analyzeAffinity(call, callback) {
	try {
		var request_transactions = call.request.transactions;
		
		var request_itemsets = call.request.itemsets;
		var support_threshold = call.request.support_threshold;
		var confidence_threshold = call.request.confidence_threshold;
		
		if(support_threshold === 0)
			// possibly defaulted by grpc proto buffer
			support_threshold = undefined;

		if(confidence_threshold === 0)
			// possibly defaulted by grpc proto buffer
			confidence_threshold = undefined;
		
		/*
		 * transform grpc styled request objects into the format
		 * expected by the AffinityAnalyzer methods
		 */
		
		var transactions = [];
		for(var i = 0; i < request_transactions.length; i++) {
			transactions.push(request_transactions[i].record);
		}
				
		var itemsets = [];
		for(var i = 0; i < request_itemsets.length; i++) {
			itemsets.push(request_itemsets[i].item);
		}
		
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
			
			response_obj.push({
					itemset: {item: itemsets[i]},
					association_rules: confidence});
		}
		
		callback(null, {results: response_obj});
	} catch(err) {
		var errmsg =
			(!err || Object.keys(err).length == 0)? "internal error"
				: JSON.stringify(err);
		callback({message: errmsg}, null);
	}
}


function analyzeTradeOff(call, callback) {
	try {
		var request_constraints = call.request.constraints;
		var request_candidates = call.request.candidates;
		var limit = call.request.limit;
		
		if(limit === 0) // possibly defaulted by grpc proto buffer
			limit = undefined;
		
		/*
		 * transform grpc styled constraints object into the format
		 * expected by TradeAnalyzer methods
		 */
		var constraints = {};
		var all_weights_zero = true;
		for(var i = 0; i < request_constraints.length; i++) {
			constraints[request_constraints[i].constraint_name] = {
				goal: request_constraints[i].goal,
				weight: request_constraints[i].weight
			}
			
			all_weights_zero =
				(all_weights_zero && request_constraints[i].weight === 0);
		}
		
		/*
		 * grpc proto buffer will default undefined weight values to zero
		 * which will negatively influence the tradeoff analysis. Hence
		 * if all weights are zero, assume no weight is set and hence set to
		 * undefined.
		 */
		if(all_weights_zero) {
			var constraint_keys = Object.keys(constraints);
			for(var i = 0; i < constraint_keys.length; i++)
				constraints[constraint_keys[i]].weight = undefined;
		}

		/*
		 * transform grpc styled candidates object into the format
		 * expected by TradeAnalyzer methods
		 */
		var candidates = [];
		for(var i = 0; i < request_candidates.length; i++) {
			
			var req_objectives = request_candidates[i].objectives;
			
			var objectives = {};
			for(var k = 0; k < req_objectives.length; k++) {
				objectives[req_objectives[k].constraint_name] =
						req_objectives[k].objective_value;
			}
			
			candidates.push({
				name: request_candidates[i].name,
				objectives: objectives});
		}
		
		//console.log(JSON.stringify(candidates));
		var result = TradeOffAnalyzer.tradeoff(constraints, candidates, limit);
		
		var grpc_result = [];
		/*
		 * transform TradeOffAnalyzer response into grpc styled response
		 */
		for(var i = 0; i < result.length; i++) {
			
			var objective_names = Object.keys(result[i].candidate.objectives);
			var objectives = [];
			for(var k = 0; k < objective_names.length; k++) {
				objectives.push({
					constraint_name: objective_names[k],
					objective_value: result[i].candidate.objectives[objective_names[k]]
				});
			}
			
			grpc_result.push({
				candidate: {
					name: result[i].candidate.name,
					objectives: objectives
				},
				variance: result[i].variance
			});
		}
		
		callback(null, {results: grpc_result});
		
	} catch(err) {
		var errmsg =
			(!err || Object.keys(err).length == 0)? "internal error"
				: JSON.stringify(err);
		callback({message: errmsg}, null);
	}
}

function recommendProduct(call, callback) {
	try {
		var request_constraints = call.request.constraints;
		var request_transactions = call.request.transactions;
		var request_candidates = call.request.candidates;
		var support_threshold = call.request.support_threshold;
		var confidence_threshold = call.request.confidence_threshold;
		var limit = call.request.limit;
		
		if(support_threshold === 0)
			// possibly defaulted by grpc proto buffer
			support_threshold = undefined;

		if(confidence_threshold === 0)
			// possibly defaulted by grpc proto buffer
			confidence_threshold = undefined;
			
		if(limit === 0) // possibly defaulted by grpc proto buffer
			limit = undefined;
		
		/*
		 * transform grpc styled constraints object into the format
		 * expected by ProductRecommender methods
		 */
		var constraints = {};
		var all_weights_zero = true;
		for(var i = 0; i < request_constraints.length; i++) {
			constraints[request_constraints[i].constraint_name] = {
				goal: request_constraints[i].goal,
				weight: request_constraints[i].weight
			}
			
			all_weights_zero =
				(all_weights_zero && request_constraints[i].weight === 0);
		}
		
		/*
		 * grpc proto buffer will default undefined weight values to zero
		 * which will negatively influence the tradeoff analysis. Hence
		 * if all weights are zero, assume no weight is set and hence set to
		 * undefined.
		 */
		if(all_weights_zero) {
			var constraint_keys = Object.keys(constraints);
			for(var i = 0; i < constraint_keys.length; i++)
				constraints[constraint_keys[i]].weight = undefined;
		}
		
		/*
		 * transform grpc styled transactions object into the format
		 * expected by ProductRecommender methods
		 */
		var transactions = [];
		for(var i = 0; i < request_transactions.length; i++) {
			
			var req_attributes = request_transactions[i].attributes;
			
			var attributes = {};
			for(var k = 0; k < req_attributes.length; k++) {
				attributes[req_attributes[k].name] =
						req_attributes[k].value;
			}
			
			transactions.push({
				title: request_transactions[i].title,
				attributes: attributes});
		}
		
		/*
		 * transform grpc styled candidates object into the format
		 * expected by ProductRecommender methods
		 */
		var candidates = [];
		for(var i = 0; i < request_candidates.length; i++) {
			
			var req_attributes = request_candidates[i].attributes;
			
			var attributes = {};
			for(var k = 0; k < req_attributes.length; k++) {
				attributes[req_attributes[k].name] =
						req_attributes[k].value;
			}
			
			candidates.push({
				title: request_candidates[i].title,
				attributes: attributes});
		}
		
		var result = ProductRecommender.recommend(
								constraints, transactions, candidates,
								support_threshold, confidence_threshold,
								limit);
		var grpc_result = [];
		/*
		 * transform TradeOffAnalyzer response into grpc styled response
		 */
		for(var i = 0; i < result.length; i++) {
			
			var objective_names = Object.keys(result[i].candidate.objectives);
			var objectives = [];
			for(var k = 0; k < objective_names.length; k++) {
				objectives.push({
					constraint_name: objective_names[k],
					objective_value: result[i].candidate.objectives[objective_names[k]]
				});
			}
			
			grpc_result.push({
				candidate: {
					name: result[i].candidate.name,
					objectives: objectives
				},
				variance: result[i].variance
			});
		}
		
		callback(null, {results: grpc_result});
		
	} catch(err) {
		var errmsg =
			(!err || Object.keys(err).length == 0)? "internal error"
				: JSON.stringify(err);
		callback({message: errmsg}, null);
	}
}

function grpc_server() {
	var server = new grpc.Server();
	server.addService(
				analytics_pkg.ConsumerAnalytics.service,
				{
					analyzeAffinity: analyzeAffinity,
					analyzeTradeOff: analyzeTradeOff,
					recommendProduct: recommendProduct
				});
	
	var port = process.env.CONSUMER_ANALYTICS_GRPC_PORT || 20003;
	server.bind('0.0.0.0:' + port,
				grpc.ServerCredentials.createInsecure());
	
	console.log('gRPC server listening to ' + port + '...');
	server.start();
}

module.exports.grpc_server = grpc_server;


