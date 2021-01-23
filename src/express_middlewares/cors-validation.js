'use strict';
const OriginSchema = require('@root/src/schemas/origin.schema');
const connection = require('@root/db-connection');

const CorsValidation = function (origin, callback) {
	const OriginModel = connection.model('Origin', OriginSchema);

	OriginModel.findOne({ url: origin }, function (err, doc) {
		if (err) {
			console.error(err);
			return;
		}

		if (doc === null) {
			callback('null doc');
			return;
		}

		callback(null, doc);
	});
};

module.exports = CorsValidation;
