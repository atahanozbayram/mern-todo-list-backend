const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = require('./user.schema');

const todoConfig = {};
const userConfig = {};

const todoValidators = {};
const userValidators = {};

todoConfig.maxLength = 280;

userConfig.idType = mongoose.Types.ObjectId;

todoValidators.typeVal = function (todo) {
	if (typeof todo !== 'string') return false;
	return true;
};

todoValidators.lengthVal = function (todo) {
	// check if the given todo is greater than 280 characters, if so return false
	if (todo.length > todoConfig.maxLength) return false;
	return true;
};

userValidators.typeVal = function (userId) {
	if (userId instanceof userConfig.idType === false) return false;
	return true;
};

userValidators.existenceVal = function (userId) {
	// check if the user exists in the database
	this.model('User').findOne({ _id: userId }, function (err, userDoc) {
		if (err) {
			console.error(err);
			return false;
		}

		if (userDoc === null) {
			console.log(err);
			return false;
		}

		return true;
	});
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
	text: {
		type: String,
		required: true,
		validate: [
			{
				validator: todoValidators.typeVal,
				message: function (props) {
					return `${
						props.path
					}'s type must be string, instead received <${typeof props.value}>`;
				},
			},
			{
				validator: todoValidators.lengthVal,
				message: function (props) {
					return `${props.path} max length must be ${todoConfig.maxLength} instead received <${props.value.length}>`;
				},
			},
		],
	},
	completed: { type: Boolean, required: true },
	user: {
		type: userSchema.paths['_id'].instance,
		required: true,
		ref: 'User',
		validate: [
			{
				validator: userValidators.typeVal,
				message: function (props) {
					return `${props.path}'s type must be <${
						userConfig.idType
					}>, instead received <${typeof props.value}> `;
				},
			},
			{
				validator: userValidators.existenceVal,
				message: function (props) {
					return `User with <${props.value}> id does not exist in database`;
				},
			},
		],
	},
});

module.exports = TodoSchema;
