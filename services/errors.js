const inherits = require('util').inherits;

function ApiError(status, errorCode, errorName, message) {
	Error.captureStackTrace(this, ApiError);
	this.status = status;
	this.errorCode = errorCode;
	this.name = errorName;
	this.message = message;

}
inherits(ApiError, Error);

ApiError.prototype.toJSON = function () {
	return {
		status: this.status,
		error_code: this.errorCode,
		message: this.message
	};
};

const INVALID_RAW_CARD = () => new ApiError(
	400,
	40001,
	'InvalidCard',
	'Could not parse provided raw card string.'
);
const INVALID_IDENTITY = () => new ApiError(
	400,
	40002,
	'InvalidIdentity',
	'Another Virgil Card with the same identity has already been registered.'
);
const MISSING_RAW_CARD = () => new ApiError(
	400,
	40003,
	'MissingCard',
	'Request body is malformed. Expected JSON with "raw_card_string" property. Did you forget Content-Type header?'
);
const MISSING_PARAM = (paramName) => new ApiError(
	400,
	40004,
	'MissingParameter',
	`Request body is malformed. Expected JSON with "${paramName}" property. Did you forget Content-Type header?`
);
const MISSING_AUTHORIZATION = () => new ApiError(
	401,
	40101,
	'Unauthorized',
	'Authorization header is missing.'
);
const INVALID_ACCESS_TOKEN = () => new ApiError(
	401,
	40102,
	'Unauthorized',
	'Access token is invalid or has expired.'
);
const VIRGIL_AUTH_ERROR = () => new ApiError(
	500,
	50010,
	'VirgilAuthError',
	'Received unexpected error from Virgil Auth service'
);
const VIRGIL_CARDS_ERROR = () => new ApiError(
	500,
	50020,
	'VirgilCardsError',
	'Received unexpected error from Virgil Cards service'
);
const INTERNAL_ERROR = () => new ApiError(
	500,
	50000,
	'InternalServerError',
	'An unexpected error has occurred on the server.'
);
const NOT_FOUND = () => new ApiError(
	404,
	40400,
	'NotFound',
	'Not Found'
);

module.exports = {
	ApiError,
	MISSING_RAW_CARD,
	INVALID_RAW_CARD,
	INVALID_IDENTITY,
	MISSING_PARAM,
	MISSING_AUTHORIZATION,
	INVALID_ACCESS_TOKEN,
	VIRGIL_AUTH_ERROR,
	VIRGIL_CARDS_ERROR,
	INTERNAL_ERROR,
	NOT_FOUND
};