const express = require('express');
const userRoute = require('@root/src/routes/user.route');

const apiRoute = express.Router();

apiRoute.use('/user', userRoute);
module.exports = apiRoute;
