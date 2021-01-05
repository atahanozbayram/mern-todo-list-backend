const express = require('express');
const authMiddleware = require('@root/src/express_middlewares/authorization.middleware');
const userRoute = require('@root/src/routes/user.route');
const todoRoute = require('@root/src/routes/todo.route');

const apiRoute = express.Router();

apiRoute.use('/user', userRoute);
apiRoute.use('/todo', authMiddleware);
apiRoute.use('/todo', todoRoute);
module.exports = apiRoute;
