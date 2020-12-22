const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const UserSchema = require('./schemas/user.schema');
const { body, validationResult, check } = require('express-validator');
const SaltSchema = require('./schemas/salt.schema');

async function main() {
	const connection = await mongoose
		.createConnection('mongodb://localhost:27017', {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
		})
		.catch((error) => {
			console.error(error);
		});

	const app = express();

	app.use(
		bodyParser.urlencoded({
			extended: true,
		})
	);
	app.use(bodyParser.json());

	app.post(
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
					const SaltModel = connection.model('Salt', SaltSchema);
					const salt = new SaltModel({
						_id: new mongoose.Types.ObjectId(),
						content: passwordSalt,
						user: result._id,
					});

					salt.save().catch(console.error);

					res.status(200).send('success');
				})
				.catch((err) => {
					res.status(500).send(err);
				});
		}
	);

	app.post(
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
		}
	);

	const port = 3000;
	app.listen(port, () => {
		console.log(`Server started to listen on port ${port}`);
	});
}

main();
