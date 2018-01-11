const virgil = require('virgil-sdk');

module.exports = function createUser(username) {
	const keyPair = virgil.crypto.generateKeys();

	const publicKeyData = virgil.crypto.exportPublicKey(keyPair.publicKey);
	const request = virgil.publishCardRequest({
		identity: username,
		identity_type: 'username',
		scope: virgil.CardScope.APPLICATION,
		public_key: publicKeyData.toString('base64')
	});

	const signer = virgil.requestSigner(virgil.crypto);
	signer.selfSign(request, keyPair.privateKey);

	return {
		csr: request.export(),
		privateKey: keyPair.privateKey
	};
};