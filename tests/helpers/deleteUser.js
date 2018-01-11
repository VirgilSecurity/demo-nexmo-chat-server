const virgil = require('virgil-sdk');

const APP_ID = process.env.VIRGIL_APP_ID;
const APP_PRIVATE_KEY = virgil.crypto.importPrivateKey(
	process.env.VIRGIL_APP_PRIVATE_KEY,
	process.env.VIRGIL_APP_PRIVATE_KEY_PASSWORD
);

module.exports = function deleteUser(user) {
	const request = virgil.revokeCardRequest(user.virgilCardId);
	const signer = virgil.requestSigner(virgil.crypto);
	signer.authoritySign(request, APP_ID, APP_PRIVATE_KEY);

	const client = virgil.client(process.env.VIRGIL_APP_ACCESS_TOKEN);

	return client.revokeCard(request);
};