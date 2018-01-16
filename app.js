const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const errors = require('./services/errors');
const logger = require('./services/logger');
const router = require('./routes/api');

const app = express();

app.use(helmet());

app.get('/health/status', (req, res) => {
	res.status(200).end();
});

app.use(morgan('combined', {
	skip: (req, res) => res.statusCode < 400
}));

app.use(bodyParser.json());
app.use(enableCORS);
app.use(router);
app.use(handleNotFound);
app.use(handleError);

module.exports = app;

function enableCORS(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization' );
	res.header('Access-Control-Max-Age', 86400);

	next();
}

function handleNotFound(req, res, next) {
	next(errors.NOT_FOUND());
}

function handleError(err, req, res, next) {
	let error;
	if (err instanceof errors.ApiError) {
		error = err;
	} else {
		logger.error('Unexpected error', err);
		error = errors.INTERNAL_ERROR();
	}

	res.status(error.status)
		.json(error.toJSON());
}