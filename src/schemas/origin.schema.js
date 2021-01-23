const mongoose = require('mongoose');
const { Schema } = mongoose;

const OriginSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	url: 'string',
});

module.exports = OriginSchema;
