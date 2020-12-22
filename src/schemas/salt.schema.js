const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { Schema } = mongoose;

const SaltSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	content: { type: String, required: true, unique: true },
	user: { type: mongoose.Types.ObjectId, ref: 'User' },
});

SaltSchema.plugin(uniqueValidator);
module.exports = SaltSchema;
