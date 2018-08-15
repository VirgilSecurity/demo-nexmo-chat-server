require('dotenv').config();

const missingParams = [
	'VIRGIL_APP_ID',
	'VIRGIL_API_KEY',
	'VIRGIL_API_KEY_ID',
	'VIRGIL_AUTH_URL',
	'VIRGIL_AUTH_PUBLIC_KEY',
	'NEXMO_API_KEY',
	'NEXMO_API_SECRET',
	'NEXMO_APP_ID',
	'NEXMO_APP_PRIVATE_KEY'
].filter(name => !process.env[name]);

if (missingParams.length > 0) {
	throw new Error(`Invalid configuration. Missing: ${missingParams.join()}.`);
}

module.exports = {
	virgil: {
		apiKey: process.env.VIRGIL_API_KEY,
		apiKeyId: process.env.VIRGIL_API_KEY_ID,
		appId: process.env.VIRGIL_APP_ID,
		authBaseUrl: process.env.VIRGIL_AUTH_URL,
		authPublicKey: process.env.VIRGIL_AUTH_PUBLIC_KEY
	},
	nexmo: {
		apiKey: process.env.NEXMO_API_KEY,
		apiSecret: process.env.NEXMO_API_SECRET,
		applicationId: process.env.NEXMO_APP_ID,
		privateKey: Buffer.from(process.env.NEXMO_APP_PRIVATE_KEY, 'base64')
	}
};