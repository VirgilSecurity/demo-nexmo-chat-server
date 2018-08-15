const request = require('superagent');
const url = require('url');
const { VirgilCrypto } = require('virgil-crypto');

const virgilCrypto = new VirgilCrypto();

const getAbsoluteUrl = (path) => url.resolve(process.env.VIRGIL_AUTH_URL, path);

module.exports = function obtainAccessToken({ virgilCardId, privateKey }) {
	return request
		.post(getAbsoluteUrl('/v5/authorization-grant/actions/get-challenge-message'))
		.set('Content-Type', 'application/json')
		.send(JSON.stringify({ resource_owner_virgil_card_id: virgilCardId }))
		.then(res => {
			const { authorization_grant_id, encrypted_message } = res.body;
			return request.post(getAbsoluteUrl(`/v5/authorization-grant/${authorization_grant_id}/actions/acknowledge`))
				.send({ encrypted_message: reEncryptForAuth(encrypted_message, privateKey) })
				.then(res => res.body.code);
		})
		.then(grantCode => {
			return request.post(getAbsoluteUrl(`/v5/authorization/actions/obtain-access-token`))
				.send({ grant_type: 'access_code', code: grantCode })
				.then(res => res.body.access_token);
		});
};

function reEncryptForAuth(ciphertext, privateKey) {
	const decrypted = virgilCrypto.decrypt(ciphertext, privateKey);
	const authPublicKey = virgilCrypto.importPublicKey(process.env.VIRGIL_AUTH_PUBLIC_KEY);
	return virgilCrypto.encrypt(decrypted, authPublicKey).toString('base64');
}