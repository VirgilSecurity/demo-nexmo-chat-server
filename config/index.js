require('dotenv').config();

const missingParams = [
	'VIRGIL_APP_ID',
	'VIRGIL_APP_ACCESS_TOKEN',
	'VIRGIL_APP_PRIVATE_KEY_PASSWORD',
	'VIRGIL_APP_PRIVATE_KEY',
	'NEXMO_API_KEY',
	'NEXMO_API_SECRET',
	'NEXMO_APP_ID',
	'NEXMO_APP_PRIVATE_KEY',
	'VIRGIL_AUTH_URI',
	'VIRGIL_AUTH_PUBLIC_KEY'
].filter(name => !process.env[name]);

if (missingParams.length > 0) {
	throw new Error(`Invalid configuration. Missing: ${missingParams.join()}.`);
}

module.exports = {
	app: {
		cardId: process.env.VIRGIL_APP_ID,
		privateKeyData: process.env.VIRGIL_APP_PRIVATE_KEY,
		privateKeyPassword: process.env.VIRGIL_APP_PRIVATE_KEY_PASSWORD
	},
	virgil: {
		accessToken: process.env.VIRGIL_APP_ACCESS_TOKEN,
		authBaseUrl: process.env.VIRGIL_AUTH_URI
	},
	nexmo: {
		apiKey: process.env.NEXMO_API_KEY,
		apiSecret: process.env.NEXMO_API_SECRET,
		applicationId: process.env.NEXMO_APP_ID,
		privateKey: Buffer.from(process.env.NEXMO_APP_PRIVATE_KEY, 'base64')
	}
};