const express = require('express');
const authMiddleware = require('@root/src/express_middlewares/authorization.middleware');
const userRoute = require('@root/src/routes/user.route');
const todoRoute = require('@root/src/routes/todo.route');

const configuredUserRoutes = userRoute();
const configuredTodoRoutes = todoRoute();

const apiRoute = express.Router();

apiRoute.use('/user', configuredUserRoutes);
apiRoute.use('/todo', authMiddleware);
apiRoute.use('/todo', configuredTodoRoutes);
module.exports = apiRoute;
