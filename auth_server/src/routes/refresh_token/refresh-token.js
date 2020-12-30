require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const refreshRoute = express.Router();
const { check, validationResult } = require('express-validator');
const connection = require('@root/db-connection');
const UserSchema = require('@root/src/schemas/user.schema');
const RefreshTokenSchema = require('../../schemas/refresh-token.schema');
const mongoose = require('mongoose');

async function main() {
	// create new refresh token
	refreshRoute.post(
		'/request',
		[
			check('email')
				.exists()
				.bail()
				.withMessage('email field must exist')
				.isEmail()
				.bail()
				.withMessage('email field must be email'),
			check('password')
				.exists()
				.bail()
				.withMessage('password field must exist')
				.isString()
				.bail()
				.withMessage('password must be string')
				.notEmpty()
				.bail()
				.withMessage('password field must not be empty'),
		],
		function (req, res, next) {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const { email, password } = req.body;
			// check for validity of authentication information
			const UserModel = connection.model('User', UserSchema);
			UserModel.findOne({ email: email }, function (err, user) {
				if (err) return console.error(err);
				if (user == null) {
					res.status(400).json({ errors: [{ msg: 'Invalid email address.' }] });
					return;
				}

				// if program reaches here, that means we have to check for user's password
				if (!bcrypt.compareSync(password, user.passwordHash)) {
					// password validation fails in this scope
					res.status(400).json({ errors: [{ msg: 'Invalid password' }] });
					return;
				}

				// if the code reaches here, that means we have valid authentication.
				// generate newrefresh token, save it into database, and send it back to the client.
				const token = jwt.sign(
					{ email: email, date: Date.now() },
					process.env.REFRESH_TOKEN_SECRET,
					{ algorithm: 'HS256' }
				);

				// create refresh token model
				const RefreshTokenModel = connection.model(
					'RefreshToken',
					RefreshTokenSchema
				);

				// save the token into database
				RefreshTokenModel.insertMany([
					{
						_id: new mongoose.Types.ObjectId(),
						token: token,
						user: user._id,
					},
				]);

				// send the token back to the client
				res.status(200).json({ refreshToken: token });
			});
		}
	);

	// check for validity of the refresh token.
	refreshRoute.get(
		'/validate',
		[
			check('token')
				.exists()
				.bail()
				.withMessage('token field must exist')
				.isString()
				.bail()
				.withMessage('token field must be string')
				.notEmpty()
				.bail()
				.withMessage('token field must not be empty'),
		],
		function (req, res, next) {
			const errors = validationResult(req);
			// if any errors happen, send errors with status code 400
			if (!errors.isEmpty()) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const { token } = req.body;

			// if no errors happen, then validate the refresh token
			const RefreshTokenModel = connection.model(
				'RefreshToken',
				RefreshTokenSchema
			);
			RefreshTokenModel.findOne({ token: token }, function (err, token) {
				// if any error happens log it, then send response with status code 500
				if (err) {
					console.error(err);
					res.status(500).send('Error happend inside the server.');
					return;
				}

				// if not any token found, send response accordingly
				if (token == null) {
					res
						.status(400)
						.json({ validity: false, msg: "Token doesn't exist in database." });
					return;
				}

				// at this point token should be valid, thus send validity true
				res
					.status(200)
					.json({ validity: true, msg: 'Token is currently valid.' });
			});
		}
	);

	// delete one or all refresh tokens for given user, or token itself.
	// TODO: left here
	refreshRoute.delete(
		'/delete',
		[
			check('token').exists().bail().withMessage('token field must exist.'),
			check('logoutAll')
				.exists()
				.bail()
				.withMessage('logoutAll field must exist')
				.isBoolean()
				.bail()
				.withMessage('logoutAll field must be boolean.'),
		],
		function (req, res, next) {
			const errors = validationResult(req);
			// If any errors occur, then send status 400 for indicating client mistake, and repond with errors.
			if (!errors.isEmpty()) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const { token, logoutAll } = req.body;
			// check for validity of the token first
			jwt.verify(
				token,
				process.env.REFRESH_TOKEN_SECRET,
				function (err, decodedToken) {
					if (err) {
						res.status(500).json({
							errors: [{ msg: err.message }],
						});
						return;
					}

					const RefreshTokenModel = connection.model(
						'RefreshToken',
						RefreshTokenSchema
					);
					RefreshTokenModel.findOne(
						{ token: token },
						function (err, tokenInDB) {
							if (err) {
								res.status(500).json({
									errors: [
										{ msg: 'Something error occured inside the server.' },
									],
								});
								return;
							}

							// if the tokenInDB is null, that means, the token is invalid
							if (tokenInDB == null) {
								// it's user's fault if the token is not existing in the database, so status is 400, send error accordingly
								res.status(400).json({
									errors: [
										{ msg: 'refresh token is not existing in the database.' },
									],
								});
								return;
							}

							// if the program reaches till here, check for logoutAll if it's true, delete all of the tokens relating to the user.
							// if not, only delete the tokenInDB
							if (logoutAll == true) {
								// get the user information out of the token itself first
								const UserModel = connection.model('User', UserSchema);
								UserModel.findOne(
									{ email: decodedToken.email },
									function (err, user) {
										// if error occurs send response with status 500
										if (err) {
											res.status(500).json({
												errors: [
													{ msg: 'Some error occured inside the server.' },
												],
											});
											return;
										}

										// if user is null, send error indicating user nonexisting
										if (user == null) {
											res.status(500).json({
												errors: [
													{ msg: "User for the given token doesn't exist." },
												],
											});
											return;
										}

										// now delete all the tokens with user's id
										RefreshTokenModel.deleteMany({ user: user._id }).exec();
										// respond
										res.status(200).json({
											msg: `All tokens of user <${user.email}> is deleted.`,
										});
										return;
									}
								);
								return;
							}

							// if program reaches here, that means we have to delete only the given token
							RefreshTokenModel.deleteOne({ _id: tokenInDB._id }).exec();
							res
								.status(200)
								.json({ msg: `given token <${tokenInDB.token}> is deleted.` });
						}
					);
				}
			);
		}
	);

	module.exports = refreshRoute;
}

main();
