var constraint = require('./association-constraints.js'),
	setutil = require('./setutil.js');

/*
 * Constructor for affinity analyzer
 * Affinity analyzer is used to perform marke-basket analysis
 *
 * Initializes with user supplied support threshold and confidence
 * threshold which are used to find the frequent itemsets and
 * generate association rules.
 */
function AffinityAnalyzer(supportThreshold, confidenceThreshold) {

	this.frequency_map = {};
	this.contenderset = [], exclusionlist = [];
	
	this.support_threshold =
			(supportThreshold)? supportThreshold : 
					constraint.supportThreshold;
	
	this.confidence_threshold =
			(confidenceThreshold)? confidenceThreshold :
					constraint.confidenceThreshold;
}

/*
 * Calculates the frequency of appearance of an item set in the past
 * historical transaction
 *
 * This is used to calculate the 'support' constraint from the transaction
 *
 * sets - historical transaction
 * set - item set for which the frequency is to be found out
 */
AffinityAnalyzer.prototype.frequency = function (sets, set) {
	var freq = 0;
	
	for(var i = 0; i < sets.length; i++) {
		if(setutil.contains(sets[i], set))
			freq ++;
	}
	
	return freq;
}

/*
 * This function is used to identify the set of frequent itemsets that exceeds
 * minimum support threshold (i.e. has occurred more frequently than specified
 * support threshold)
 *
 * itemset is a set of one or more items whose combination is checked for the
 * frequent occurrence in the historical transaction set
 *
 * Frequent itemsets are determined using downward-closure property of support
 * i.e. if an itemset is not frequent, any superset of the itemset is also not
 * frequent.
 *
 * The implementation of this function is loosely based on the Apriori algorithm,
 * however, the traversal is done bottom-up depth-first search, instead of
 * breadth-first search
 */
AffinityAnalyzer.prototype.findcontenders = function (sets, workingset, uniqueset) {
	
	contains_set =
		function (sets, set) {
			for(var i = 0; i < sets.length; i++) {
				if(setutil.isequal(sets[i], set))
					return true;
			}
		
			return false;
		};
	
	for(var i = 0; i < workingset.length; i++) {
		var currset = workingset[i];
		
		// check if the currset frequency exceeds support threshold
		var freq = this.frequency(sets, currset);

		if((freq / sets.length) >= this.support_threshold) {
			
			this.frequency_map [currset] = freq;
			this.contenderset.push(currset);
		
			// get set of next higher superset
			var tmpworkingset = [];
			for(var j = 0; j < uniqueset.length; j++) {

				if(currset.indexOf(uniqueset[j]) === -1) {
					
					var tmpset = currset.slice();
					tmpset.push(uniqueset[j]);
					
					if(!contains_set(this.contenderset, tmpset)
							&& !contains_set(this.exclusionlist, tmpset))
						tmpworkingset.push(tmpset);
				}
			}

			if(tmpworkingset.length > 0)
				this.findcontenders(sets, tmpworkingset, uniqueset);
			
		} else this.exclusionlist.push(currset);
	}

}

AffinityAnalyzer.prototype.contenders = function(sets, uniqueset) {
	var initialset = [];
	
	this.frequency_map = {};
	this.contenderset = [], this.exclusionlist = [];

	for(var i = 0; i < uniqueset.length; i++) {
		var tmpset = [];
		tmpset.push(uniqueset[i]);
		initialset.push(tmpset);
	}
	
	this.findcontenders(sets, initialset, uniqueset);
			
	return this.contenderset;
}

/*
 * Generates association rules for the interested itemset from the historical
 * transaction, that satisfy the minimum support threshold and minium
 * confidence
 */
 
AffinityAnalyzer.prototype.rules = function (sets, contention, itemset) {
	
	var association_rules = [];
	
	for(var i = 0; i < contention.length; i++) {
		if(setutil.contains(contention[i], itemset))
			continue;
		
		
		
		var unionset = setutil.joinset(contention[i], itemset);
		
		var unionfreq = 
				//this.frequency_map.hasOwnProperty(unionset)?
					//this.frequency_map[unionset] :
					this.frequency(sets, unionset);

		var freq = this.frequency_map[contention[i]];
		
		var confidence = unionfreq / freq;
		if(confidence >= this.confidence_threshold) {
			var tmp = {
					"frequent_item": contention[i],
					"support": freq / sets.length,
					"confidence": confidence
				};
			association_rules.push(tmp);
		}
	}
	
	return association_rules;
}

module.exports = AffinityAnalyzer;
