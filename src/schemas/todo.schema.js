const { promises } = require('fs');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = require('./user.schema');

const todoValidator = function (todo) {
	if (typeof todo !== 'string') return false; // if the parameter isn't string return false immidiately

	// check if the given todo is greater than 280 characters, if so return false
	if (todo.length > 280) return false;

	return true; // if program reaches here, we are good to go.
};

const authorValidator = async function (userId) {
	// check if userId is falsy value if so return false
	if (!userId) return Promise.resolve(false);

	// check if the user exists in the database
	const result = await this.model('User').findOne({ _id: userId }).exec();

	if (result !== null) return Promise.resolve(true);
	else return Promise.resolve(false);
};

const TodoSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	timestamp: Date,
	todo: {
		type: String,
		required: true,
		validate: { validator: todoValidator },
	},
	completed: { type: Boolean, required: true },
	user: {
		type: userSchema.paths['_id'].instance,
		required: true,
		ref: 'User',
		validate: {
			validator: authorValidator,
			message: function () {
				return 'author validation failed';
			},
		},
	},
});

module.exports = TodoSchema;
