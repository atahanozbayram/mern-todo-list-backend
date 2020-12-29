const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { Schema } = mongoose;

const RefreshTokenSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	token: { type: String, required: true },
	user: { type: mongoose.Types.ObjectId, ref: 'User' },
});

RefreshTokenSchema.plugin(uniqueValidator);
module.exports = RefreshTokenSchema;
