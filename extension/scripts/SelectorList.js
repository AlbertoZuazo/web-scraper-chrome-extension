var SelectorList = function (selectors) {

	if(selectors === undefined) {
		return;
	}

	for(var i = 0;i<selectors.length;i++) {
		this.push(selectors[i]);
	}
};

SelectorList.prototype = new Array;

SelectorList.prototype.push = function(selector) {

	if(!this.hasSelector(selector.id)) {
		if(!(selector instanceof Selector)) {
			selector = new Selector(selector);
		}
		Array.prototype.push.call(this, selector);
	}
};

SelectorList.prototype.hasSelector = function(selectorId) {

	if(selectorId instanceof Object) {
		selectorId = selectorId.id;
	}

	for (var i = 0; i < this.length; i++) {
		if(this[i].id === selectorId) {
			return true;
		}
	}
	return false;
};

/**
 * Returns all selectors or recursively find and return all child selectors of a parent selector.
 * @param parentSelectorId
 * @returns {Array}
 */
SelectorList.prototype.getAllSelectors = function(parentSelectorId) {

	if(parentSelectorId === undefined) {
		return this;
	}

	var getAllChildSelectors = function(parentSelectorId, resultSelectors) {
		this.forEach(function(selector) {
			if(selector.hasParentSelector(parentSelectorId)) {
				if(resultSelectors.indexOf(selector) === -1) {
					resultSelectors.push(selector);
					getAllChildSelectors(selector.id, resultSelectors);
				}
			}
		}.bind(this));
	}.bind(this);

	var resultSelectors = [];
	getAllChildSelectors(parentSelectorId, resultSelectors);
	return resultSelectors;
};

/**
 * Returns only selectors that are directly under a parent
 * @param parentSelectorId
 * @returns {Array}
 */
SelectorList.prototype.getDirectChildSelectors = function(parentSelectorId) {
	var resultSelectors = new SelectorList();
	this.forEach(function(selector) {
		if(selector.hasParentSelector(parentSelectorId)) {
			resultSelectors.push(selector);
		}
	});
	return resultSelectors;
};

SelectorList.prototype.clone = function() {
	var resultList = new SelectorList();
	this.forEach(function(selector){
		resultList.push(selector);
	});
	return resultList;
};

SelectorList.prototype.fullClone = function() {
	var resultList = new SelectorList();
	this.forEach(function(selector){
		resultList.push(JSON.parse(JSON.stringify(selector)));
	});
	return resultList;
};

SelectorList.prototype.concat = function() {
	var resultList = this.clone();
	for(var i in arguments) {
		arguments[i].forEach(function(selector) {
			resultList.push(selector);
		}.bind(this));
	}
	return resultList;
};

SelectorList.prototype.getSelector = function(selectorId) {
	for (var i = 0; i < this.length; i++) {
		var selector = this[i];
		if (selector.id === selectorId) {
			return selector;
		}
	}
};

/**
 * Returns all selectors if this selectors including all parent selectors within this page
 * @param selectorId
 * @returns {*}
 */
SelectorList.prototype.getOnePageSelectors = function (selectorId) {
	var resultList = new SelectorList();
	var selector = this.getSelector(selectorId);
	resultList.push(this.getSelector(selectorId));

	// add parent selectors
	var currentSelector = selector;
	while (true) {
		var parentSelectorId = currentSelector.parentSelectors[0];
		if (parentSelectorId === "_root") break;
		var parentSelector = this.getSelector(parentSelectorId);
		if(parentSelector.willReturnElements()) {
			resultList.push(parentSelector);
			currentSelector = parentSelector;
		}
		else {
			break;
		}
	}

	// add all child selectors
	resultList = resultList.concat(this.getSinglePageAllChildSelectors(selector.id));
	return resultList;
};

/**
 * Returns all child selectors of a selector which can be used within one page.
 * @param parentSelectorId
 */
SelectorList.prototype.getSinglePageAllChildSelectors = function(parentSelectorId) {

	var resultList = new SelectorList();
	var childSelectors = this.getDirectChildSelectors(parentSelectorId);
	childSelectors.forEach(function (childSelector) {
		resultList.push(childSelector);
		if(childSelector.willReturnElements()) {
			resultList = resultList.concat(this.getSinglePageAllChildSelectors(childSelector.id));
		}
	}.bind(this));
	return resultList;
};

SelectorList.prototype.willReturnMultipleRecords = function(selectorId) {
	
	// handle reuqested selector
	var selector = this.getSelector(selectorId);
	if(selector.willReturnMultipleRecords() === true) {
		return true;
	}
	
	// handle all its child selectors
	var childSelectors = this.getAllSelectors(selectorId);
	for (var i = 0; i < childSelectors.length; i++) {
		var selector = childSelectors[i];
		if (selector.willReturnMultipleRecords() === true) {
			return true;
		}
	}
	
	return false;
};

/**
 * When serializing to JSON convert to an array
 * @returns {Array}
 */
SelectorList.prototype.toJSON = function() {
	var result = [];
	this.forEach(function(selector) {
		result.push(selector);
	});
	return result;
};

SelectorList.prototype.getSelectorById = function (selectorId) {
	for (var i = 0; i < this.length; i++) {
		var selector = this[i];
		if (selector.id === selectorId) {
			return selector;
		}
	}
}