'use strict';
const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const connection = require('@root/db-connection');
const UserSchema = require('@root/src/schemas/user.schema');
const TodoSchema = require('@root/src/schemas/todo.schema');
const dynamicValMsg = require('./validation');
const errorMsgTemp = require('./error');

const routes = function () {
	const todoRoute = express.Router();
	const validations = {};
	const exp = {};

	const maxPageCounter = function (docCount, perPage) {
		let maxPages = Math.floor(docCount / perPage);

		return maxPages;
	};

	const todoUserMatch = function (req, res, next) {
		const errors = validationResult(req);
		if (errors.isEmpty() === false) {
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
					.json({ errors: [{ msg: errorMsgTemp.general.serverSideError() }] });
				return;
			}

			if (userDoc === null) {
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

				if (todoDoc === null) {
					console.error('todoDoc === null: %o', todoDoc);
					res.status(500).json({
						errors: [{ msg: 'Given todo does not exists in database.' }],
					});
					return;
				}

				// check if the user and todos user id same
				if (userDoc._id.equals(todoDoc.user) === false) {
					res.status(400).json({
						errors: [{ msg: 'Unauthorized to delete given todo.' }],
					});
					return;
				}

				// proceed to the next function
				next();
			});
		});
	};

	validations.get = [
		check('page')
			.if(check('page').exists())
			.isNumeric()
			.bail()
			.withMessage(dynamicValMsg.isType('number')),
	];

	validations.add = [
		check('text')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isString()
			.bail()
			.withMessage(dynamicValMsg.isType('string'))
			.notEmpty()
			.bail()
			.withMessage(dynamicValMsg.notEmpty()),
		check('completed')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isBoolean()
			.bail()
			.withMessage(dynamicValMsg.isType('boolean')),
	];

	validations.delete = [
		check('id')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isMongoId()
			.bail()
			.withMessage(dynamicValMsg.isType(typeof mongoose.Types.ObjectId)),
		todoUserMatch,
	];

	validations.toggleComplete = [
		check('id')
			.exists()
			.bail()
			.withMessage(dynamicValMsg.exists())
			.isMongoId()
			.bail()
			.withMessage(dynamicValMsg.isType(typeof mongoose.Types.ObjectId)),
		todoUserMatch,
	];

	exp.get = function (req, res, next) {
		const { id } = req.authorization.user;
		const { page } = req.query;

		const perPage = 10;

		const TodoModel = connection.model('Todo', TodoSchema);

		if (page === undefined) {
			TodoModel.find({ user: id }, function (err, docs) {
				if (err) {
					console.error(err);
					res.status(500).json({
						errors: [{ msg: errorMsgTemp.general.serverSideError() }],
					});
					return;
				}

				if (docs.length === 0) {
					res.status(500).json({ errors: [{ msg: 'not any todo found.' }] });
					return;
				}

				TodoModel.countDocuments({ user: id }, function (err, docCount) {
					if (err) {
						console.error('estimatedDocumentCount error: %o', err);
						res.status(500).json({
							errors: [{ msg: errorMsgTemp.general.serverSideError() }],
						});
						return;
					}

					const maxPages = maxPageCounter(docCount, perPage);

					res.status(200).json({ todos: docs, maxPages: maxPages });
				});
			});
			return;
		}

		// check whether the page number is not greater than maximum it could be.
		// If it's greater, then send back error.
		TodoModel.countDocuments({ user: id }, function (err, docCount) {
			if (err) {
				console.error('estimatedDocumentCount error: %o', err);
				res
					.status(500)
					.json({ errors: [{ msg: errorMsgTemp.general.serverSideError() }] });
				return;
			}

			const maxPages = maxPageCounter(docCount, perPage);

			if (page > maxPages) {
				res
					.status(400)
					.json({ errors: [{ msg: 'page exceeds maximum available pages.' }] });
				return;
			}

			TodoModel.find({ user: id })
				.limit(perPage)
				.skip(perPage * page)
				.exec(function (err, todoDocs) {
					if (err) {
						console.error('error in TodoModel find: %o', err);
						res.status(500).json({
							errors: [{ msg: errorMsgTemp.general.serverSideError() }],
						});
						return;
					}

					res.status(200).json({ todos: todoDocs, maxPages: maxPages });
					return;
				});
		});
	};

	exp.add = function (req, res, next) {
		const errors = validationResult(req);

		if (errors.isEmpty() === false) {
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
					.json({ errors: [{ msg: errorMsgTemp.general.serverSideError() }] });
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
						errors: [{ msg: errorMsgTemp.general.serverSideError() }],
					});
					return;
				}

				res.status(200).json({ msg: 'Todo added successfully', todo: todoDoc });
			});
		});
	};

	exp.delete = function (req, res, next) {
		const errors = validationResult(req);

		if (errors.isEmpty() === false) {
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

			if (todoDoc === null) {
				console.error('todoDoc === null: %o', todoDoc);
				res.status(500).json({
					errors: [{ msg: 'given todo does not exist in database.' }],
				});
				return;
			}

			res
				.status(200)
				.json({ msg: 'todo deleted successfully.', todo: todoDoc });
		});
	};

	exp.toggleComplete = function (req, res, next) {
		const errors = validationResult(req);

		if (errors.isEmpty() === false) {
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
					.json({ errors: [{ msg: errorMsgTemp.general.serverSideError() }] });
				return;
			}

			if (todoDoc === null) {
				res.status(400).json({ errors: [{ msg: 'Todo is non existent.' }] });
				return;
			}

			todoDoc.completed = !todoDoc.completed;
			todoDoc.save();

			res.status(200).json({ msg: 'completed field toggled', todo: todoDoc });
		});
	};

	todoRoute.get('/get', validations.get, exp.get);
	todoRoute.post('/add', validations.add, exp.add);
	todoRoute.post('/delete', validations.delete, exp.delete);
	todoRoute.post(
		'/toggleComplete',
		validations.toggleComplete,
		exp.toggleComplete
	);

	return todoRoute;
};

module.exports = routes;
