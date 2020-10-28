const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { Schema } = mongoose;

const UserSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	name: {
		first: { type: String, required: true },
		last: { type: String, required: true },
	},
	email: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
});

UserSchema.plugin(uniqueValidator);

module.exports = UserSchema;
