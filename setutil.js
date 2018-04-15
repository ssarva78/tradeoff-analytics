module.exports.setof = function(arr) {
	var s = [];
	for(var i = 0; i < arr.length; i++) {
		if(s.indexOf(arr[i]) === -1)
			s.push(arr[i]);
	}
	
	return s;
}

module.exports.contains = function (arr1, arr2) {
	// check if element in arr2 is contained in arr1
	
	for(var i = 0; i < arr2.length; i++) {
		if(arr1.indexOf(arr2[i]) === -1)
			return false;
	}
	
	return true;
}

module.exports.isequal = function (set1, set2) {
	
	return (set1.length == set2.length
				&& this.contains(set1, set2));
}

module.exports.universalset = function (sets) {
	var set = [];
	
	for(var i = 0; i < sets.length; i++) {
		for(var j = 0; j < sets[i].length; j++) {
			if(set.indexOf(sets[i][j]) === -1)
				set.push(sets[i][j]);
		}
	}
	
	return set;
}

module.exports.joinset = function (set1, set2) {
	var jset = [];
	
	jset = set1.slice();
	
	for(var i = 0; i < set2.length; i++) {
		if(set1.indexOf(set2[i]) === -1)
			jset.push(set2[i]);
	}
	
	return jset;
}

module.exports.addsorted = function (set, item, comparator) {
	
	var locator =
		function (set, item, comparator) {
			var start = 0, end = set.length;
			
			while(start < end) {
				var midpoint = (start + end) >> 1;
				if (comparator?
						comparator(set[midpoint], item) < 0 :
							set[midpoint] < item)
					start = midpoint + 1;
				else end = midpoint;
			}
			
			return start;
		};
	
	var index = locator(set, item, comparator);
	
	if((comparator? comparator(set[index], item) === 0 : set[index] === item)) {
		return;
	}
	
	set.splice(index, 0, item);
}
