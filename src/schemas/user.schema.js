const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const alternativeValidator = require('../plugins/unique.plugin');
const { Schema } = mongoose;

const UserSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
});

// UserSchema.plugin(uniqueValidator);
UserSchema.plugin(alternativeValidator);

module.exports = UserSchema;
