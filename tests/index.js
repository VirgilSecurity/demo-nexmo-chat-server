require('dotenv').config();

const request = require('supertest');
const test = require('tape');
const createUser = require('./helpers/createUser');
const obtainAccessToken = require('./helpers/obtainAccessToken');
const deleteUser = require('./helpers/deleteUser');

const app = require('../app');
const api = request(app);

const USER_IDENTITY = 'nexmo_demo_chat_test_user';
let user;

const base64Decode = input => Buffer.from(input, 'base64').toString('utf8');

test('setup', t => {
	user = createUser(USER_IDENTITY);
	t.end();
});

test('POST /users', t => {
	api.post('/users')
		.send({ csr: user.csr })
		.expect(200)
		.expect(res => {
			const user = res.body.user;
			const cardDto = user.virgilCard;
			const jwt = res.body.jwt;
			const virgilCard = JSON.parse(base64Decode(cardDto));

			t.ok(virgilCard.id, 'Virgil Card has id');
			user.virgilCardId = virgilCard.id;

			t.ok(jwt !== undefined, 'Jwt is returned');
			user.jwt = jwt;

			t.ok(virgilCard.content_snapshot, 'Virgil Card has snapshot');
			t.ok(virgilCard.meta, 'Virgil Card has meta');
			t.ok(virgilCard.meta.signs, 'Virgil Card has signatures');
			const signatures = Object.keys(virgilCard.meta.signs);
			t.equals(signatures.length, 3, 'Virgil Card is signed by the App and Cards Service');
		})
		.end(err => {
			if (err) {
				return t.end(err);
			}

			t.end();
		});
});

test('POST /users with invalid CSR', t => {
	api.post('/users')
		.send({ csr: 'invalid_csr' })
		.expect(400)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 400, 'Error has status');
			t.equals(error.errorCode, 40001, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end((err, res) => {
			if (err) {
				return t.end(err);
			}

			t.end();
		});
});

test('GET /jwt', t => {
	obtainAccessToken(user)
		.then(accessToken => {
			api.get('/jwt')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)
				.expect(res => {
					t.ok(res.body.jwt, 'Jwt received');
				})
				.end(err => {
					if (err) {
						return t.end(err);
					}

					t.end();
				});
		})
		.catch(err => t.end(err));
});

test('GET /jwt without auth header', t => {
	api.get('/jwt')
		.expect(401)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 401, 'Error has status');
			t.equals(error.errorCode, 40101, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => {
			if (err) {
				return t.end(err);
			}

			t.end();
		});
});

test('GET /jwt with invalid token', t => {
	api.get('/jwt')
		.set('Authorization', 'Bearer invalid_access_token')
		.expect(401)
		.expect(res => {
			const error = res.body;
			t.equals(error.status, 401, 'Error has status');
			t.equals(error.errorCode, 40102, 'Error has error code');
			t.ok(error.message, 'Error has message');
		})
		.end(err => {
			if (err) {
				return t.end(err);
			}

			t.end();
		});
});

test('teardown', t => {
	if (!user.virgilCardId) {
		return t.end();
	}

	deleteUser(user)
		.then(() => t.end())
		.catch(e => t.end(e));
});