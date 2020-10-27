const mongoose = require('mongoose');
const { Schema } = mongoose;

const TodoSchema = new Schema({
	_id: mongoose.Types.ObjectId,
	timestamp: Date,
	todo: { type: String, required: true },
	completed: { type: Boolean, required: true },
	author: { type: mongoose.Types.ObjectId, required: true },
});

module.exports = TodoSchema;
