const path = require('path');

const res = require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
if (res.error) {
	throw res.error;
}

const request = require('supertest');
const test = require('tape');
const { VirgilCrypto, VirgilCardCrypto } = require('virgil-crypto');
const { CardManager } = require('virgil-sdk');
const createUser = require('./helpers/createUser');
const obtainAccessToken = require('./helpers/obtainAccessToken');

const virgilCrypto = new VirgilCrypto();
const cardManager = new CardManager({
	cardCrypto: new VirgilCardCrypto(virgilCrypto),
	cardVerifier: null,
	retryOnUnauthorized: false
});

// make sure the app is started with `docker-compose up`
const api = request('http://localhost:3000');

const USER_IDENTITY = 'nexmo_demo_chat_test_user_' + Date.now();
let user;

const CONVERSATION_NAME = 'nexmo_demo_chat_conversation_' + Date.now();
let conversation;

test('POST /users', t => {
	user = createUser(USER_IDENTITY);
	api.post('/users')
		.send({ raw_card_string: user.rawCard.toString() })
		.expect(200)
		.expect(res => {
			const { user: nexmoUser, nexmo_jwt, virgil_jwt } = res.body;
			const cardDto = nexmoUser.virgil_card;
			const virgilCard = cardManager.importCardFromString(cardDto);

			t.ok(virgilCard.id, 'Virgil Card has id');
			t.ok(nexmo_jwt, 'Nexmo JWT is returned');
			t.ok(virgil_jwt, 'Virgil JWT is returned');

			Object.assign(user, nexmoUser, { virgilCardId: virgilCard.id });

			t.ok(virgilCard.contentSnapshot, 'Virgil Card has snapshot');
			t.equals(virgilCard.signatures.length, 2, 'Virgil Card is signed by the Virgil Cards Service');
		})
		.end(err => t.end(err));
});

testWithAccessToken('POST /conversations', (t, accessToken) => {
	api.post('/conversations')
		.set('Authorization', `Bearer ${accessToken}`)
		.send({ display_name: CONVERSATION_NAME })
		.expect(200)
		.expect(res => {
			const result = res.body;
			t.ok(result.id, 'Conversation has ID');
			conversation = result;
		})
		.end(err => t.end(err));
});

testWithAccessToken('PUT /conversations', (t, accessToken) => {
	if (!conversation) {
		return t.end('Conversation does not exist.');
	}

	api.put('/conversations')
		.set('Authorization', `Bearer ${accessToken}`)
		.send({
			conversation_id: conversation.id,
			user_id: user.id,
			action: 'join'
		})
		.expect(200)
		.expect(res => {
			const membership = res.body;
			t.ok(membership.id, 'Membership is created.');
			t.equal(membership.state, 'JOINED', 'Membership state is "JOINED"');
		})
		.end(err => t.end(err));
});

testWithAccessToken('GET /nexmo-jwt', (t, accessToken) => {
	api.get('/nexmo-jwt')
		.set('Authorization', `Bearer ${accessToken}`)
		.expect(200)
		.expect(res => {
			t.ok(res.body.jwt, 'JWT received');
		})
		.end(err => t.end(err));
});

testWithAccessToken('GET /virgil-jwt', (t, accessToken) => {
	api.get('/virgil-jwt')
		.set('Authorization', `Bearer ${accessToken}`)
		.expect(200)
		.expect(res => {
			t.ok(res.body.jwt, 'JWT received');
		})
		.end(err => t.end(err));
});

test('POST /users with invalid card', t => {
	api.post('/users')
		.send({ raw_card_string: 'invalid_card' })
		.expect(400)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 400, 'Error has status');
			t.equals(error.error_code, 40001, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => t.end(err));
});

test('GET /nexmo-jwt without auth header', t => {
	api.get('/nexmo-jwt')
		.expect(401)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 401, 'Error has status');
			t.equals(error.error_code, 40101, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => t.end(err));
});

test('GET /nexmo-jwt with invalid token', t => {
	api.get('/nexmo-jwt')
		.set('Authorization', 'Bearer invalid_access_token')
		.expect(401)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 401, 'Error has status');
			t.equals(error.error_code, 40102, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => t.end(err));
});

test('GET /virgil-jwt without auth header', t => {
	api.get('/virgil-jwt')
		.expect(401)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 401, 'Error has status');
			t.equals(error.error_code, 40101, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => t.end(err));
});

test('GET /virgil-jwt with invalid token', t => {
	api.get('/virgil-jwt')
		.set('Authorization', 'Bearer invalid_access_token')
		.expect(401)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 401, 'Error has status');
			t.equals(error.error_code, 40102, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => t.end(err));
});

function testWithAccessToken(name, cb) {
	let accessTokenPromise;

	function getAccessTokenPromise(user) {
		if (!accessTokenPromise) {
			accessTokenPromise = obtainAccessToken(user);
		}
		return accessTokenPromise;
	}

	return test(name, t => {
		if (!user.virgilCardId) {
			return t.end('Cannot test without user record');
		}

		getAccessTokenPromise(user)
			.then(accessToken => {
				cb(t, accessToken);
			})
			.catch(ignore => {});
	});
}