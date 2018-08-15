const url = require('url');
const request = require('superagent');
const {
	CardManager,
	VirgilCardVerifier,
	JwtGenerator,
	GeneratorJwtProvider,
	RawSignedModel
} = require('virgil-sdk');
const {
	VirgilCrypto,
	VirgilCardCrypto,
	VirgilAccessTokenSigner
} = require('virgil-crypto');
const config = require('../config');
const errors = require('./errors');

const virgilCrypto = new VirgilCrypto();
const cardCrypto = new VirgilCardCrypto(virgilCrypto);
const cardVerifier = new VirgilCardVerifier(cardCrypto);

const jwtGenerator = new JwtGenerator({
	accessTokenSigner: new VirgilAccessTokenSigner(virgilCrypto),
	apiKeyId: config.virgil.apiKeyId,
	apiKey: virgilCrypto.importPrivateKey(config.virgil.apiKey),
	appId: config.virgil.appId
});

const accessTokenProvider = new GeneratorJwtProvider(jwtGenerator);
const cardManager = new CardManager({
	cardCrypto,
	cardVerifier,
	accessTokenProvider,
	retryOnUnauthorized: true
});

module.exports = {
	async getUserCardId(token) {
		try {
			const res = await request.post(
				url.resolve(
					config.virgil.authBaseUrl,
					'/v5/authorization/actions/verify'
				)
			).send({ access_token: token });

			return res.body.resource_owner_virgil_card_id;
		} catch (error) {
			if (error && error.status === 400) {
				return null;
			}

			throw error;
		}
	},

	getCard(cardId) {
		return cardManager.getCard(cardId);
	},

	async publishCard(rawCardStr) {
		let rawCard;
		try {
			rawCard = RawSignedModel.fromString(rawCardStr);
		} catch (error) {
			throw  errors.INVALID_RAW_CARD();
		}

		// verify that identity is unique
		const existingCards = await cardManager.searchCards(extractIdentity(rawCard));
		if (existingCards.length > 0) {
			throw errors.INVALID_IDENTITY();
		}

		return cardManager.publishRawCard(rawCard);
	},

	serializeCard(card) {
		return cardManager.exportCardAsString(card);
	},

	generateJwt(identity) {
		return jwtGenerator.generateToken(identity);
	}
};

function extractIdentity (rawCard) {
	const { identity } = JSON.parse(rawCard.contentSnapshot);
	return identity;
}