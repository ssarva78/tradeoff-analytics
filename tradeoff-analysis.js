var setutil = require('./setutil.js');

/*
 * constraints: {
 * 			"objective_name": {
 *				goal: "min" | "max,
 *				weight: "" // Optional. % distribution of weight across
 *						   // all objectives. So, sum of all weights is 1. 
 *			}
 * 		}
 *
 * candidates: [
 *			{
 *				name: "",
 *				values: [{
 * 					objective: "",
 * 					value: ""
 *				}]
 *			}
 * 		]
 */
module.exports.tradeoff = function(constraints, candidates, limit) {
	var range = {};
	var optimum = {};
	var objectives = [];
	
	var normalize = function(value, min, max) {
		/*
		 * normalize given value to 0-1 range
		 */
		return (value - min) / (max - min);
	}
	
	/*
	 * validate if the sum of weights of all the objective is exactly 1.
	 * validate if one objective has weight defined, every other objective
	 * has weight defined as well. Weightage should either be defined for all
	 * objectives or for none.
	 */
	var total_weight = 0;
	var has_weight = false;
	var constraint_keys = Object.keys(constraints);
	
	for(var i = 0; i < constraint_keys.length; i++) {
		if(constraints[constraint_keys[i]].weight) {
			total_weight += constraints[constraint_keys[i]].weight;
			has_weight = true;
		} else
			if(has_weight > 0)
				throw "not all constraints have weight factor defined";
		
		if(constraints[constraint_keys[i]].goal !== "min"
				&& constraints[constraint_keys[i]].goal !== "max")
			throw "invalid goal '" +
						constraints[constraint_keys[i]].goal +
						"'. goal should be either 'min' or 'max'";
	}

	if(has_weight && Number(total_weight.toFixed(3)) !== 1)
		throw "total weight factor is not equal to 1";
	
	/*
	 * Find the minimum and maximum limites of each objective in the given
	 * set of candidates. This min and max values are used to normalize
	 * the respective objective value to 0-1 range.
	 */
	for(var i = 0; i < candidates.length; i++) {
		var objective_keys = Object.keys(candidates[i].objectives);
		
		for(var j = 0; j < objective_keys.length; j++) {
			
			var objective_value = candidates[i].objectives[objective_keys[j]];
			
			if(range[objective_keys[j]] === undefined) {

				range[objective_keys[j]] = {
						min: objective_value,
						max: objective_value
					};

			} else {

				if(objective_value
							< range[objective_keys[j]].min) {
					range[objective_keys[j]].min =
								objective_value;
				}
				if(objective_value
							> range[objective_keys[j]].max) {
					range[objective_keys[j]].max =
								objective_value;
				}
			}

		}

	}
	
	/*
	 * Calculate the sum of normalized values for each objective for every
	 * candidate.
	 *
	 * The objective value is normalized as % of variation out of total 
	 * variation.
	 *
	 * The normalization is done in order to make all the objective values
	 * comparable with one another and add them and thus transform
	 * multi-objective problem into single-objective problem.
	 * 
	 * If the objectives are weighted (preference), then the product of
	 * respective weight and the normalized objective value are summed up.
	 * The optimal solution is to find the minimum of the weighted (preference) or
	 * non-weighted (non-preference) sum of the objective functions and hence
	 * loss function is used.
	 *
	 */
	for(var i = 0; i < candidates.length; i++) {
		var objective_keys = Object.keys(candidates[i].objectives);

		var sum = 0;
		for(var j = 0; j < objective_keys.length; j++) {
			var objective_value =
					(range[objective_keys[j]].min
							=== range[objective_keys[j]].max)?
						0 :
						normalize(candidates[i].objectives[objective_keys[j]],
								range[objective_keys[j]].min,
								range[objective_keys[j]].max);
			
			var objective = constraints[objective_keys[j]];

			if(objective.goal === 'max')
				objective_value = 1 - objective_value;
			
			objective_value = (objective.weight === undefined)? objective_value :
						objective.weight * objective_value;

			sum += objective_value;
		}
		
		if(optimum[sum] === undefined) {
			optimum[sum] = [];
		}
		
		optimum[sum].push(candidates[i]);
		setutil.addsorted(objectives,
			sum,
			function(a,b){return parseFloat(a) - parseFloat(b);});
	}
	
	var result = [];
	
	/*
	 * order the candidate in the ascending order of the optimal solution.
	 * the lower the objective value, the higher is the candidate's optimized
	 * choice and should appear up in the selection rank.
	 */
	for(var i = 0; i < objectives.length; i++) {
		
		if(limit && result.length >= limit) break;
		
		var candidates = optimum[objectives[i]];
		
		for(var j = 0; j < candidates.length; j++) {
			var variance = has_weight?
								objectives[i] :
								(objectives[i]/constraint_keys.length);
			if(variance === 1)
				continue;
			
			result.push({
				"candidate": candidates[j],
				"variance": variance});

			if(limit && result.length >= limit) break;
		}
	}
		
	return result;

}
