const dynamicValidationMessages = {};

dynamicValidationMessages.exists = function () {
	return function (value, { path }) {
		return `${path} field must exist.`;
	};
};

dynamicValidationMessages.isType = function (typeName) {
	return function (value, { path }) {
		return `${path} field must be '${typeName}', instead received '${typeof value}.'`;
	};
};

dynamicValidationMessages.isLength = function ({ min, max }) {
	if (min && max) {
		return function (value, { path }) {
			return `${path} field must be minimum ${min}, and maximum ${max} characters long, instead received ${value.length} characters.`;
		};
	}

	if (min) {
		return function (value, { path }) {
			return `${path} field must be minimum ${min} characters long, instead received ${value.length} characters.`;
		};
	}

	if (max) {
		return function (value, { path }) {
			return `${path} field must be maximum ${max} characters long, instead received ${value.length} characters.`;
		};
	}
	return '';
};

dynamicValidationMessages.notEmpty = function () {
	return function (value, { path }) {
		return `${path} field must be not empty.`;
	};
};

dynamicValidationMessages.isEmail = function () {
	return function (value, { path }) {
		return `${path} field must be valid email address, instead received '${value}'`;
	};
};

module.exports = dynamicValidationMessages;
