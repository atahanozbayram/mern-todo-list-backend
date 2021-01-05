const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const connection = require('@root/db-connection');

async function main() {
	const todoRoute = express.Router();

	todoRoute.post('/add', [], function (req, res, next) {
		//TODO: delete response
		res.send('all good');
	});
	todoRoute.post('/delete', [], function (req, res, next) {});
	todoRoute.post('/toggleComplete', [], function (req, res, next) {});

	module.exports = todoRoute;
}

main();
