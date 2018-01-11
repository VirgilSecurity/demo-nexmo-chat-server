const url = require('url');
const request = require('superagent');
const virgil = require('virgil-sdk');
const config = require('../config');
const errors = require('./errors');

const virgilClient = virgil.client(config.virgil.accessToken);

module.exports = {
	verifyToken(token) {
		return request.post(
			url.resolve(
				config.virgil.authBaseUrl,
				'/v4/authorization/actions/verify'
			)
		)
			.send({ access_token: token })
			.then(res => res.body.resource_owner_virgil_card_id)
			.catch(err => {
				if (err.status === 400) {
					return null;
				}
				return Promise.reject(err);
			});
	},

	getCard(cardId) {
		return virgilClient.getCard(cardId)
			.catch(err => {
				if (err.response && err.response.status === 404) {
					return Promise.reject(errors.INVALID_ACCESS_TOKEN())
				}

				return Promise.reject(err);
			});
	},

	publishCard(csr) {
		return Promise.resolve()
			.then(() => {
				let cardRequest;
				try {
					cardRequest = virgil.publishCardRequest.import(csr);
				} catch (e) {
					return Promise.reject(errors.INVALID_CSR());
				}

				return publish(cardRequest);
			});
	},

	serializeCard(card) {
		const str = JSON.stringify(card.export());
		return Buffer.from(str).toString('base64');
	}
};

function publish(cardRequest) {
	return checkIdentityUnique(cardRequest.identity)
		.then(isUnique => {
			if (!isUnique) {
				return Promise.reject(errors.INVALID_IDENTITY());
			}

			return virgilClient.publishCard(signCardRequest(cardRequest));
		});
}

function checkIdentityUnique(identity) {
	return virgilClient.searchCards(identity)
		.then(cards => cards.length === 0)
		.catch(e => {
			if (e instanceof TypeError) {
				// workaround the bug in virgil-sdk where it throws when
				// search returns null instead of an empty array.
				// Assume identity is unique in this case;
				return true;
			}
			return Promise.reject(e);
		});
}

function signCardRequest(cardRequest) {
	const appKey = virgil.crypto.importPrivateKey(
		config.app.privateKeyData,
		config.app.privateKeyPassword
	);
	const signer = virgil.requestSigner(virgil.crypto);
	signer.authoritySign(cardRequest, config.app.cardId, appKey);
	return cardRequest;
}