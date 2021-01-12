const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const connection = require('@root/db-connection');
const UserSchema = require('@root/src/schemas/user.schema');
const TodoSchema = require('@root/src/schemas/todo.schema');

async function main() {
	function todoUserMatch(req, res, next) {
		const errors = validationResult(req);
		if (errors.isEmpty() == false) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const UserModel = connection.model('User', UserSchema);
		const { email: userEmail } = req.authorization.user;

		UserModel.findOne({ email: userEmail }, function (err, userDoc) {
			if (err) {
				console.error(err);
				res
					.status(500)
					.json({ errors: [{ msg: 'Some error occured on server side.' }] });
				return;
			}

			if (userDoc == null) {
				res
					.status(400)
					.json({ errors: [{ msg: "User doesn't exist in database." }] });
				return;
			}

			const TodoModel = connection.model('Todo', TodoSchema);
			const { id } = req.body;

			TodoModel.findOne({ _id: id }, function (err, todoDoc) {
				if (err) {
					console.error('error: %o', err);
					res.status(500).json({ errors: [err] });
					return;
				}

				if (todoDoc == null) {
					console.error('todoDoc == null: %o', todoDoc);
					res.status(500).json({
						errors: [{ msg: 'Given todo does not exists in database.' }],
					});
					return;
				}

				// check if the user and todos user id same
				if (userDoc._id.equals(todoDoc.user) == false) {
					res.status(400).json({
						errors: [{ msg: 'Unauthorized to delete given todo.' }],
					});
					return;
				}

				// proceed to the next function
				next();
			});
		});
	}

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

					res
						.status(200)
						.json({ msg: 'Todo added successfully', todo: todoDoc });
				});
			});
		}
	);
	todoRoute.post(
		'/delete',
		[
			check('id')
				.exists()
				.bail()
				.withMessage('id field must exist.')
				.isMongoId()
				.bail()
				.withMessage('id field must be mongo id.'),
			todoUserMatch,
		],
		function (req, res, next) {
			const errors = validationResult(req);

			if (errors.isEmpty() == false) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const TodoModel = connection.model('Todo', TodoSchema);
			const { id } = req.body;
			TodoModel.findOneAndDelete({ _id: id }, function (err, todoDoc) {
				if (err) {
					console.error('error: %o', err);
					res.status(500).json({ errors: [err] });
					return;
				}

				if (todoDoc == null) {
					console.error('todoDoc == null: %o', todoDoc);
					res.status(500).json({
						errors: [{ msg: 'given todo does not exist in database.' }],
					});
					return;
				}

				res
					.status(200)
					.json({ msg: 'todo deleted successfully.', todo: todoDoc });
			});
		}
	);
	todoRoute.post(
		'/toggleComplete',
		[
			check('id')
				.exists()
				.bail()
				.withMessage('id field must exist.')
				.isMongoId()
				.bail()
				.withMessage('id field must be mongo id.'),
			todoUserMatch,
		],
		function (req, res, next) {
			const errors = validationResult(req);

			if (errors.isEmpty() == false) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const TodoModel = connection.model('Todo', TodoSchema);
			const { id } = req.body;
			TodoModel.findOne({ _id: id }, function (err, todoDoc) {
				if (err) {
					console.err(err);
					res
						.status(500)
						.json({ errors: [{ msg: 'Some error occured on server side.' }] });
					return;
				}

				if (todoDoc == null) {
					res.status(400).json({ errors: [{ msg: 'Todo is non existent.' }] });
					return;
				}

				todoDoc.completed = !todoDoc.completed;
				todoDoc.save();

				res.status(200).json({ msg: 'completed field toggled', todo: todoDoc });
			});
		}
	);

	module.exports = todoRoute;
}

main();
