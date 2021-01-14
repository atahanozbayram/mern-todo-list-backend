'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const DB_SERVER_HOST = process.env.DB_SERVER_HOST || 'localhost';
const DB_SERVER_PORT = process.env.DB_SERVER_PORT || 27017;
const DB_NAME = process.env.DB_NAME || '';
const DB_USER = process.env.DB_USER || '';
const DB_PASS = process.env.DB_PASS || '';
const connectionString = DB_USER
	? `mongodb://${DB_USER}:${DB_PASS}@${DB_SERVER_HOST}:${DB_SERVER_PORT}/${DB_NAME}`
	: `mongodb://${DB_SERVER_HOST}:${DB_SERVER_PORT}/${DB_NAME}`;

const connection = mongoose.createConnection(connectionString, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	autoCreate: process.env.NODE_ENV === 'production' ? false : true,
	autoIndex: process.env.NODE_ENV === 'production' ? false : true,
	connectTimeoutMS: 5000,
});

connection.catch(console.error);
module.exports = connection;
