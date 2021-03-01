const axios = require('axios').default;

const auth_server_host = process.env.AUTH_SERVER_HOST || 'localhost:5000';

const axiosAuthInstance = axios.create({
	baseURL: `${auth_server_host}/api`,
});

module.exports = { axiosAuthInstance };
