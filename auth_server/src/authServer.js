const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { body } = require('express-validator');

async function main() {
	const connection = mongoose
		.createConnection('mongodb://localhost:27017', {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
		})
		.catch(console.error);

	const app = express();
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	const port = process.env.AUTH_SERVER_PORT || 5000;
	app.listen(port, () => {
		console.log('auth server started to listen on port %n', port);
	});
}

main();
