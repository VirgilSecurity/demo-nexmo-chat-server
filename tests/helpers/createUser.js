const { VirgilCrypto, VirgilCardCrypto } = require('virgil-crypto');
const { CardManager } = require('virgil-sdk');

const virgilCrypto = new VirgilCrypto();
const cardManager = new CardManager({
	cardCrypto: new VirgilCardCrypto(virgilCrypto),
	cardVerifier: null,
	retryOnUnauthorized: false
});

module.exports = function createUser(username) {
	const keyPair = virgilCrypto.generateKeys();

	const rawCard = cardManager.generateRawCard({
		identity: username,
		privateKey: keyPair.privateKey,
		publicKey: keyPair.publicKey
	});

	return {
		rawCard,
		privateKey: keyPair.privateKey
	};
};