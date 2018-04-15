var grpc = require('grpc');

var analytics_pkg = 
		grpc.load('./consumer-analytics.proto').grpc.analytics;

function test_affinity() {
	
	var client = new analytics_pkg.ConsumerAnalytics(
					'localhost:20003',
					grpc.credentials.createInsecure());
	
	var request = {
		"transactions": [
			{record: ["milk", "bread"]},
			{record: ["butter"]},
			{record: ["beer", "diaper"]},
			{record: ["milk", "bread", "butter"]},
			{record: ["bread"]}
		],
		"itemsets": [
			{item: ["milk"]}
		],
		"support_threshold": 0.4,
		"confidence_threshold":0.5
	};
	
	client.analyzeAffinity(request, function(err, response) {
		
		if(err)
			console.log(err);
		else
			console.log(JSON.stringify(response));
	});
}

function test_tradeoff() {
	var client = new analytics_pkg.ConsumerAnalytics(
					'localhost:20003',
					grpc.credentials.createInsecure());
	
	var request = {
		"constraints" : [
			{constraint_name: "duration", "goal": "min", weight: 0.1},
			{constraint_name: "adverse_effect", "goal": "min", weight: 0.3},
			{constraint_name: "success", "goal": "max", weight: 0.3},
			{constraint_name: "longivity", "goal": "max", weight: 0.15},
			{constraint_name: "price", "goal": "min", weight: 0.15}
			],
		"candidates" : [
			{
			"name": "BTC",
			"objectives": [{constraint_name: "duration", objective_value: 12}, {constraint_name: "adverse_effect", objective_value: 5}, {constraint_name: "success", objective_value: 50}, {constraint_name: "longivity", objective_value: 10}, {constraint_name: "price", objective_value: 8500}]
			},{
			"name": "BIC followed by weekly syntinene",
			"objectives": [{constraint_name: "duration", objective_value: 10}, {constraint_name: "adverse_effect", objective_value: 3}, {constraint_name: "success", objective_value: 70}, {constraint_name: "longivity", objective_value: 6.5}, {constraint_name: "price", objective_value: 11000}]
			},{
			"name": "EG followed by syntinene every 2 weeks",
			"objectives": [{constraint_name: "duration", objective_value: 7}, {constraint_name: "adverse_effect", objective_value: 4}, {constraint_name: "success", objective_value: 70}, {constraint_name: "longivity", objective_value: 15}, {constraint_name: "price", objective_value: 8750}]
			},{
			"name": "FEG followed by weekly syntinene",
			"objectives": [{constraint_name: "duration", objective_value: 7}, {constraint_name: "adverse_effect", objective_value: 4}, {constraint_name: "success", objective_value: 85}, {constraint_name: "longivity", objective_value: 14.75}, {constraint_name: "price", objective_value: 8750}]
			},{
			"name": "EG followed by weekly syntinene",
			"objectives": [{constraint_name: "duration", objective_value: 3}, {constraint_name: "adverse_effect", objective_value: 1}, {constraint_name: "success", objective_value: 65}, {constraint_name: "longivity", objective_value: 5}, {constraint_name: "price", objective_value: 8000}]
			},{
			"name": "AG followed by donatel every 3 weeks",
			"objectives": [{constraint_name: "duration", objective_value: 10}, {constraint_name: "adverse_effect", objective_value: 3}, {constraint_name: "success", objective_value: 90}, {constraint_name: "longivity", objective_value: 6}, {constraint_name: "price", objective_value: 11000}]
			}
		],
		"limit" : 4
	};
	
	client.analyzeTradeOff(request, function(err, response) {
		
		if(err)
			console.log(err);
		else
			console.log(JSON.stringify(response));
	});
}

function test_product() {
	var client = new analytics_pkg.ConsumerAnalytics(
					'169.46.26.232:20003',
					grpc.credentials.createInsecure());
	
	var request = {
		"constraints" : [
			{constraint_name: "genre", "goal": "max"},
			{constraint_name: "casting", "goal": "max"}
			],
		"transactions" : [
			{
			"title": "Vettaiyadu Vilaiyadu",
			"attributes": [{name: "genre", value: ["action", "thriller", "crime"]}, {name: "casting", value: ["kamal", "jyothika"]}]
			},{
			"title": "Kadugu",
			"attributes": [{name: "genre", value: ["action", "crime"]}, {name: "casting", value: ["bharath", "rajendran"]}]
			},{
			"title": "Boss Baskaran",
			"attributes": [{name: "genre", value: ["comedy", "romance"]}, {name: "casting", value: ["arya", "nayandara"]}]
			},{
			"title": "Vishwaroopam",
			"attributes": [{name: "genre", value: ["action", "thriller"]}, {name: "casting", value: ["kamal", "andria"]}]
			},{
			"title": "Papanasam",
			"attributes": [{name: "genre", value: ["crime", "thriller"]}, {name: "casting", value: ["kamal", "gowthami"]}]
			}
		],
		"candidates" : [
			{
			"title": "Panchathanthiram",
			"attributes": [{name: "genre", value: ["comedy", "romance"]}, {name: "casting", value: ["kamal", "simran"]}]
			},{
			"title": "Visaranai",
			"attributes": [{name: "genre", value: ["crime", "thriller"]}, {name: "casting", value: ["karthik"]}]
			}
		],
		"support_threshold": 0.25,
		"confidence_threshold":0.5,
		"limit" : 4
	};
	
	client.recommendProduct(request, function(err, response) {
		
		if(err)
			console.log(err);
		else
			console.log(JSON.stringify(response));
	});
}

//test_affinity();
//test_tradeoff();
test_product();


