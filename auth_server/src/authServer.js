require('module-alias/register');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiRoute = require('./routes/api');

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
	app.use('/api', apiRoute);

	const port = process.env.AUTH_SERVER_PORT || 5000;
	app.listen(port, () => {
		console.log('auth server started to listen on port %d', port);
	});
}

main();
