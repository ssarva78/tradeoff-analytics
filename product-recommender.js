var AffinityAnalyzer = require('./affinity-analysis.js'),
	TradeOffAnalyzer = require('./tradeoff-analysis.js'),
	setutil = require('./setutil.js');

/*
 * combines affinity analytics and tradeoff analytics to recommend a product
 * based on multiple parameters of the product, based on the past purchase
 * history
 */

module.exports.recommend = function(
				constraints, transaction, candidates,
				support_threshold, confidence_threshold,
				limit) {
		
		var constraint_keys = Object.keys(constraints);
		
		var contentions = {};
		var candidate_analysis = {};
		
		/*
		 * Find association rule for each attribute of the product from the
		 * historical transaction
		 */
		for(var i = 0; i < constraint_keys.length; i++) {
			var analyzer = new AffinityAnalyzer
								(support_threshold, confidence_threshold);
			
			var txns = [];

			for(var j = 0; j < transaction.length; j++) {
				if(transaction[j].attributes[constraint_keys[i]] !== undefined
						&& transaction[j].attributes[constraint_keys[i]].constructor
								=== Array) {
					txns.push(transaction[j].attributes[constraint_keys[i]]);
				}
			}

			if(txns.length === 0) {
				continue;
			}
			
			//var unique_items = setutil.universalset(txns);
			
			//contentions[constraint_keys[i]] =
					//analyzer.contenders(txns, unique_items);
						
			var continue_to_next_key = false;
			for(var j = 0; j < candidates.length; j++) {
				
				var itemset = candidates[j].attributes[constraint_keys[i]];
				
				if(itemset === undefined)
					continue;
				
				if(itemset.constructor !== Array)
					continue;
				
				var confidence = [];
				
				// find the frequency of past occurance for each of the item in
				// the candidate itemset of same attribute
				var support_sum = 0;
				for(var k = 0; k < itemset.length; k++) {
					
					var item = [];
					item.push(itemset[k]);
					
					var freq = analyzer.frequency(txns, item);
					support_sum += (freq / txns.length);
				
					/*
					var tmpconfidence = analyzer.rules(txns,
												contentions[constraint_keys[i]],
												item);
					
					if(!tmpconfidence || tmpconfidence.length === 0)
						tmpconfidence = [{confidence: 0}];
					
					for(var l = 0; l < tmpconfidence.length; l++)
						confidence.push(tmpconfidence[l]);
					*/
				}
				
				if(candidate_analysis[candidates[j].title] === undefined) {
					candidate_analysis[candidates[j].title] = {};
				}
				
				candidate_analysis[candidates[j].title][constraint_keys[i]]
						= support_sum; //confidence;
			}
			
			//if(continue_to_next_key)
				//continue;
		}
		
		if(Object.keys(candidate_analysis).length === 0)
			return [];
		

		/*
		 * Trade off the confidence value determined for each of the attributes of
		 * the candidate products
		 */
		var tradeoff_candidates = [];
		for(var i = 0; i < candidates.length; i++) {
			
			var candidate = {
				name: candidates[i].title,
				objectives: {}
			};
			
			for(var j = 0; j < constraint_keys.length; j++) {

				// accept both number or array. if number, directly assign to
				// trade-off input
				var obj = candidates[i].attributes[constraint_keys[j]];

				if(obj !== undefined && obj.constructor === Number) {
					
					candidate.objectives[constraint_keys[j]] =
							candidates[i].attributes[constraint_keys[j]];
				} else {
					// var calculated_confidence =
					var total_support =
							candidate_analysis[candidates[i].title][constraint_keys[j]];
							
					if(total_support === undefined)
						continue;
					
					/*
					// determine trade off only for the maximum confidence generated
					var max_confidence = 0;
					for(var k = 0; k < calculated_confidence.length; k++) {
						if(max_confidence < calculated_confidence[k].confidence)
							max_confidence = calculated_confidence[k].confidence;
					}
					*/
					candidate.objectives[constraint_keys[j]] = total_support; //max_confidence;
				}
			}
			
			tradeoff_candidates.push(candidate);
		}

		//console.log(tradeoff_candidates);
		
		return TradeOffAnalyzer.tradeoff(constraints, tradeoff_candidates, limit);
}
