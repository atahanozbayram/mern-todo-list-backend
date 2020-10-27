const mongoose = require('mongoose');
const { stringify } = require('querystring');
const { Schema } = mongoose;

const HashSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	hash: { type: String, required: true },
});
