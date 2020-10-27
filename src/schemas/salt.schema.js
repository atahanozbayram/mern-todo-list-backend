const mongoose = require('mongoose');
const { stringify } = require('querystring');
const { Schema } = mongoose;

const Salt = new Schema({
	_id: mongoose.Types.ObjectId,
	content: { type: String, required: true },
	user: { type: mongoose.Types.ObjectId, ref: 'User' },
});
