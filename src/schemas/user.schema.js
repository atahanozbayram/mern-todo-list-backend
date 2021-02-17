const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { Schema } = mongoose;

const UserSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
});

// UserSchema.plugin(uniqueValidator);
UserSchema.plugin(uniqueValidator, {
	message: 'Expected email to be unique, {VALUE} is already taken',
});

module.exports = UserSchema;
