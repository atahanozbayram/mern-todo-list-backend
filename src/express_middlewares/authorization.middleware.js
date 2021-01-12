require('dotenv').config();
const express = require('express');
const axios = require('axios').default;
const jwt = require('jsonwebtoken');
const connection = require('@root/db-connection');

async function isAuthorized(req, res, next) {
	const { accessToken, refreshToken } = req.cookies;
	let validAccess = false;

	if (accessToken) {
		jwt.verify(
			accessToken,
			process.env.ACCESS_TOKEN_SECRET,
			{ maxAge: 15 },
			function (err, decodedAccessToken) {
				if (err) {
					return;
				}

				validAccess = true;
				req.authorization = {
					user: {
						email: decodedAccessToken.email,
					},
				};
				next();
			}
		);
	}

	if (validAccess === false && refreshToken) {
		// check for validity of refreshToken
		const axiosRes = await axios({
			method: 'GET',
			baseURL: process.env.AUTH_SERVER_IP || 'http://localhost:5000/api',
			url: 'refreshToken/validate',
			data: {
				token: refreshToken,
			},
		}).catch((axiosErr) => {
			console.error('axiosErr: %o', axiosErr.response.data);
			res.status(401).json({ errors: [{ msg: 'Unauthorized access' }] });
		});

		if (axiosRes === undefined) return;

		const decodedRefreshToken = jwt.decode(refreshToken);
		res.cookie(
			'accessToken',
			jwt.sign(
				{ email: decodedRefreshToken.email, date: Date.now() },
				process.env.ACCESS_TOKEN_SECRET,
				{ algorithm: 'HS256' }
			)
		);

		req.authorization = {
			user: {
				email: decodedRefreshToken.email,
			},
		};
		next();
		return;
	}

	if (validAccess === false)
		res.status(401).json({ errors: [{ msg: 'Unauthorized access.' }] });
}

module.exports = isAuthorized;
