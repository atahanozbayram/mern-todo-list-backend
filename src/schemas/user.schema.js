const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	name: {
		first: { type: String, required: true },
		last: { type: String, required: true },
	},
	email: { type: String, required: true },
	passwordHash: { type: String, required: true },
});

module.exports = UserSchema;
