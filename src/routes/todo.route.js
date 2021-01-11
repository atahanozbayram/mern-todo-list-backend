const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const connection = require('@root/db-connection');
const UserSchema = require('@root/src/schemas/user.schema');
const TodoSchema = require('@root/src/schemas/todo.schema');

async function main() {
	const todoRoute = express.Router();

	todoRoute.post(
		'/add',
		[
			check('text')
				.exists()
				.bail()
				.withMessage('text field must exist')
				.isString()
				.bail()
				.withMessage('text field must be string'),
			check('completed')
				.exists()
				.bail()
				.withMessage('completed field must exist')
				.isBoolean()
				.bail()
				.withMessage('completed field must be boolean'),
		],
		function (req, res, next) {
			const errors = validationResult(req);

			if (errors.isEmpty() == false) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const { accessToken } = req.cookies;
			const { email: userEmail } = req.authorization.user;
			// retrieve user id
			const UserModel = connection.model('User', UserSchema);

			UserModel.findOne({ email: userEmail }, function (err, user) {
				if (err) {
					console.error(err);
					res
						.status(500)
						.json({ errors: [{ msg: 'some error occured on server side.' }] });
					return;
				}

				// this means user is not found
				if (!user) {
					res.status(400).json({ errors: [{ msg: 'user not found' }] });
					return;
				}

				const { text, completed } = req.body;
				const TodoModel = connection.model('Todo', TodoSchema);
				const todo = new TodoModel({
					_id: new mongoose.Types.ObjectId(),
					timestamp: Date.now(),
					text: text,
					completed: completed,
					user: user._id,
				});

				todo.save(function (err, todoDoc) {
					if (err) {
						console.error(err);
						res.status(500).json({
							errors: [{ msg: 'Some error occured on server side.' }],
						});
						return;
					}

					res.status(200).json({ todo: todoDoc });
				});
			});
		}
	);
	todoRoute.post('/delete', [], function (req, res, next) {});
	todoRoute.post('/toggleComplete', [], function (req, res, next) {});

	module.exports = todoRoute;
}

main();
