require('module-alias/register'); // this line should be on first line whatever happens
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsValidation = require('./express_middlewares/cors-validation');
const apiRoute = require('@root/src/routes/api.route');

async function main() {
	const app = express();

	app.use(cors({ credentials: true, origin: corsValidation }));
	app.use(
		bodyParser.urlencoded({
			extended: true,
		})
	);
	app.use(bodyParser.json());
	app.use(cookieParser());
	app.use('/api', apiRoute);

	const port = process.env.PORT || 3000;
	app.listen(port, () => {
		console.log(`Server started to listen on port ${port}`);
	});
}

main();
