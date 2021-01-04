const axios = require('axios').default;
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const UserSchema = require('@root/src/schemas/user.schema');
const connection = require('@root/db-connection');

async function main() {
	const userRoute = express.Router();

	userRoute.post(
		'/register',
		[
			check('firstName')
				.exists()
				.bail()
				.withMessage('firstName field must be not empty')
				.isString()
				.bail()
				.withMessage('firstName field must be string')
				.isLength({ max: 40 })
				.bail()
				.withMessage('firstName field cannot be longer than 40 characters'),
			check('lastName')
				.exists()
				.bail()
				.withMessage('lastName field cannot be empty')
				.isString()
				.bail()
				.withMessage('lastName field must be string')
				.isLength({ max: 40 })
				.bail()
				.withMessage('lastName field cannot be longer than 40 characters'),
			check('email')
				.exists()
				.bail()
				.withMessage('email field must be not empty')
				.isEmail()
				.bail()
				.withMessage('email field must be valid email address')
				.isLength({ max: 254 })
				.bail()
				.withMessage('email field cannot be longer than 254 characters'),
			check('password')
				.exists()
				.bail()
				.withMessage('password field must be not empty')
				.bail()
				.isString()
				.withMessage('password field must be string')
				.isLength({ min: 8 })
				.bail()
				.withMessage('password field must be at least 8 characters'),
		],
		function (req, res, next) {
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
					res.status(400).send(err);
				});
		}
	);

	userRoute.post(
		'/login',
		[
			check('email')
				.exists()
				.bail()
				.notEmpty()
				.bail()
				.withMessage('email field must not be empty')
				.isEmail()
				.bail()
				.withMessage('email field must be valid email'),
			check('password')
				.exists()
				.bail()
				.notEmpty()
				.bail()
				.withMessage('password field must not be empty')
				.isString()
				.bail()
				.withMessage('password field must be string'),
		],
		function (req, res, next) {
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
						errors: [{ msg: 'Unknown error occured in the server.' }],
					});
					return; // terminate the function
				}

				if (user == null) {
					res.status(400).json({ errors: [{ msg: 'Non existent email.' }] });
					return;
				}

				// if program reaches here, that means we have a valid user. Now check for password validity.
				// this if check if it fails
				if (bcrypt.compareSync(password, user.passwordHash) == false) {
					res.status(400).json({ errors: [{ msg: 'Invalid password.' }] });
					return;
				}

				// send request to obtain refresh token
				const axiosRes = await axios({
					method: 'POST',
					baseURL: process.env.AUTH_SERVER_IP || 'http://localhost:5000/api',
					url: 'refreshToken/request',
					data: {
						email: email,
						password: password,
					},
				}).catch((axiosErr) => {
					console.error(axiosErr);
					res
						.status(500)
						.json({ errors: [{ msg: 'some error occured in server side.' }] });
					return;
				});

				if (axiosRes == undefined) return;

				res
					.status(200)
					.cookie('refreshToken', axiosRes.data.refreshToken)
					.send();
			});
		}
	);

	userRoute.post(
		'/logout',
		[
			check('logoutAll')
				.exists()
				.bail()
				.withMessage('logoutAll field must exist.')
				.isBoolean()
				.bail()
				.withMessage('logoutAll field must be boolean.'),
		],
		async function (req, res, next) {
			const errors = validationResult(req);
			if (errors.isEmpty() == false) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			// check for cookie existense
			if (req.cookies['refreshToken'] == undefined) {
				res
					.status(400)
					.json({ errors: [{ msg: 'refreshToken cookie is missing.' }] });
				return;
			}

			const axiosRes = await axios({
				method: 'DELETE',
				baseURL: process.env.AUTH_SERVER_IP || 'http://localhost:5000/api',
				url: '/refreshToken/delete',
				data: {
					token: req.cookies.refreshToken,
					logoutAll: req.body.logoutAll,
				},
			}).catch((axiosErr) => {
				console.error(axiosErr);
				res.status(500).json(axiosErr.response.data);
				return;
			});

			if (axiosRes == undefined) return;

			res.status(200).clearCookie('refreshToken').json(axiosRes.data);
		}
	);
	module.exports = userRoute;
}

main();
