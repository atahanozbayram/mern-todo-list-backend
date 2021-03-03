require('dotenv').config();
const axios = require('axios').default;
const { axiosAuthInstance } = require('@root/src/utils/axiosInstance');
const jwt = require('jsonwebtoken');

const isAuthorized = async function (req, res, next) {
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
						id: decodedAccessToken.user_id,
					},
				};
				next();
			}
		);
	}

	if (validAccess === false && refreshToken) {
		// check for validity of refreshToken
		const auth_server_host =
			process.env.AUTH_SERVER_HOST || 'http://localhost:5000/api';

		axiosAuthInstance({
			method: 'GET',
			url: 'refreshToken/validate',
			data: {
				token: refreshToken,
			},
		})
			.then((axiosRes) => {
				const decodedRefreshToken = jwt.decode(refreshToken);
				res.save = { cookie: {} };
				res.save.cookie.accessToken = jwt.sign(
					{
						email: decodedRefreshToken.email,
						user_id: decodedRefreshToken.user_id,
						firstName: decodedRefreshToken.firstName,
						lastName: decodedRefreshToken.lastName,
						date: Date.now(),
					},
					process.env.ACCESS_TOKEN_SECRET,
					{ algorithm: 'HS256' }
				);
				res.cookie(
					'accessToken',
					jwt.sign(
						{
							email: decodedRefreshToken.email,
							user_id: decodedRefreshToken.user_id,
							firstName: decodedRefreshToken.firstName,
							lastName: decodedRefreshToken.lastName,
							date: Date.now(),
						},
						process.env.ACCESS_TOKEN_SECRET,
						{ algorithm: 'HS256' }
					),
					{
						sameSite: 'none',
						httpOnly: false,
						secure: true,
					}
				);

				req.authorization = {
					user: {
						email: decodedRefreshToken.email,
						id: decodedRefreshToken.user_id,
					},
				};
				next();
				return;
			})
			.catch((axiosErr) => {
				console.error('axiosErr: %o', axiosErr.response.data);
				res.status(401).json({ errors: [{ msg: 'Unauthorized access' }] });
			});

		return;
	}

	if (validAccess === false)
		res
			.status(401)
			.json({
				errors: [
					{
						msg:
							'Unauthorized access, no present valid refresh or access token.',
					},
				],
			});
};

module.exports = isAuthorized;
