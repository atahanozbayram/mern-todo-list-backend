const mongoose = require('mongoose');
const { Schema } = mongoose;

const todoValidator = function (todo) {
	if (typeof todo !== 'string') return false; // if the parameter isn't string return false immidiately

	// check if the given todo is greater than 280 characters, if so return false
	if (todo.length > 280) return false;

	return true; // if program reaches here, we are good to go.
};

const authorValidator = function (authorId) {};

const TodoSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	timestamp: Date,
	todo: {
		type: String,
		required: true,
		validate: { validator: todoValidator },
	},
	completed: { type: Boolean, required: true },
	author: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

module.exports = TodoSchema;
