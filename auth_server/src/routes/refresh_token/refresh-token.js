const express = require('express');
const refreshRoute = express.Router();
const subRoute = express.Router();

async function main() {
	// create new refresh token
	subRoute.post('/request', [], function (req, res, next) {});
	subRoute.get('/validate', [], function (req, res, next) {});
	subRoute.delete('/delete', [], function (req, res, next) {});

	refreshRoute.use('/refreshRoute', subRoute);

	module.exports = refreshRoute;
}

main();
