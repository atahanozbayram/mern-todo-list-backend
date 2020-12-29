const mongoose = require('mongoose');
const connection = mongoose.createConnection('mongodb://localhost:27017', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
});

module.exports = connection;
