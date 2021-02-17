'use strict';
const axios = require('axios').default;
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const UserSchema = require('@root/src/schemas/user.schema');
const connection = require('@root/db-connection');
const dynamicValMsg = require('./validation');
const errorMsgTmp = require('./error');

const routes = function () {
	const userRoute = express.Router();
	const validations = {};
	const exp = {};

	validations.register = [
		check('firstName')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isString()
			.bail()
			.withMessage(dynamicValMsg.isType('string'))
			.isLength({ max: 40 })
			.bail()
			.withMessage(dynamicValMsg.isLength({ max: 40 })),
		check('lastName')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isString()
			.bail()
			.withMessage(dynamicValMsg.isType('string'))
			.isLength({ max: 40 })
			.bail()
			.withMessage(dynamicValMsg.isLength({ max: 40 })),
		check('email')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isEmail()
			.bail()
			.withMessage(dynamicValMsg.isEmail())
			.isLength({ max: 253 })
			.bail()
			.withMessage(dynamicValMsg.isLength({ max: 253 })),
		check('password')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.bail()
			.isString()
			.withMessage(dynamicValMsg.isType('string'))
			.isLength({ min: 8 })
			.bail()
			.withMessage(dynamicValMsg.isLength({ min: 8 })),
	];

	validations.login = [
		check('email')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.notEmpty()
			.bail()
			.withMessage(dynamicValMsg.notEmpty())
			.isEmail()
			.bail()
			.withMessage(dynamicValMsg.isEmail()),
		check('password')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.notEmpty()
			.bail()
			.withMessage(dynamicValMsg.notEmpty())
			.isString()
			.bail()
			.withMessage(dynamicValMsg.isType('string')),
	];

	validations.logout = [
		check('logoutAll')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isBoolean()
			.bail()
			.withMessage(dynamicValMsg.isType('boolean')),
	];

	exp.register = function (req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { firstName, lastName, email, password } = req.body;

		const passwordSalt = bcrypt.genSaltSync(1);
		const passwordHash = bcrypt.hashSync(password, passwordSalt);

		const UserModel = connection.model('User', UserSchema);
		const user = new UserModel({
			_id: new mongoose.Types.ObjectId(),
			firstName,
			lastName,
			email,
			passwordHash,
		});

		user
			.save()
			.then((result) => {
				res.status(200).json({
					msg: 'User registered successfully',
					firstName: firstName,
					lastName: lastName,
					email: email,
				});
			})
			.catch((err) => {
				res.status(400).json({
					errors: Object.entries(err.errors).map(([key, value]) => {
						return { path: key, msg: value.message, kind: value.kind };
					}),
				});
			});
	};

	exp.login = function (req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { email, password } = req.body;

		// check if the email and password match
		const UserModel = connection.model('User', UserSchema);
		UserModel.findOne({ email: email }, async function (err, user) {
			if (err) {
				console.error(err);
				res.status(500).json({
					errors: [{ msg: errorMsgTmp.general.serverSideError() }],
				});
				return; // terminate the function
			}

			if (user === null) {
				res.status(400).json({ errors: [{ msg: 'Non existent email.' }] });
				return;
			}

			// if program reaches here, that means we have a valid user. Now check for password validity.
			// this if check if it fails
			if (bcrypt.compareSync(password, user.passwordHash) === false) {
				res.status(400).json({ errors: [{ msg: 'Invalid password.' }] });
				return;
			}

			const auth_host = process.env.AUTH_SERVER_HOST || 'http://localhost';
			const auth_port = process.env.AUTH_SERVER_PORT || 5000;

			// send request to obtain refresh token
			const axiosRes = await axios({
				method: 'POST',
				baseURL: `${auth_host}:${auth_port}/api`,
				url: 'refreshToken/request',
				data: {
					email: email,
					password: password,
				},
			}).catch((axiosErr) => {
				console.error(axiosErr);
				res
					.status(500)
					.json({ errors: [{ msg: errorMsgTmp.general.serverSideError() }] });
				return;
			});

			if (axiosRes === undefined) return;

			res
				.status(200)
				.cookie('refreshToken', axiosRes.data.refreshToken, {
					sameSite: 'none',
					httpOnly: false,
					secure: true,
				})
				.json({ msg: 'logged in successfully.' });
		});
	};

	exp.logout = async function (req, res, next) {
		const errors = validationResult(req);
		if (errors.isEmpty() === false) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		// check for cookie existense
		if (req.cookies['refreshToken'] === undefined) {
			res
				.status(400)
				.json({ errors: [{ msg: 'refreshToken cookie is missing.' }] });
			return;
		}

		const auth_host = process.env.AUTH_SERVER_HOST || 'http://localhost';
		const auth_port = process.env.AUTH_SERVER_PORT || 5000;

		const axiosRes = await axios({
			method: 'DELETE',
			baseURL: `${auth_host}:${auth_port}/api`,
			url: '/refreshToken/delete',
			data: {
				token: req.cookies.refreshToken,
				logoutAll: req.body.logoutAll,
			},
		}).catch((axiosErr) => {
			console.error(axiosErr);
			res
				.status(500)
				.json({ msg: 'auth server error.', data: axiosErr.response.data });
			return;
		});

		if (axiosRes === undefined) return;

		res
			.status(200)
			.clearCookie('refreshToken')
			.json({ msg: 'logged out successfully.', data: axiosRes.data });
	};

	userRoute.post('/register', validations.register, exp.register);
	userRoute.post('/login', validations.login, exp.login);
	userRoute.post('/logout', validations.logout, exp.logout);

	return userRoute;
};

module.exports = routes;
