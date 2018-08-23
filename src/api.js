const express = require('express');
const router = express.Router();
const virgil = require('./services/virgil');
const nexmo = require('./services/nexmo');
const errors = require('./errors');

module.exports = router;

router.post('/users', async (req, res, next) => {
	const rawCardStr = req.body.raw_card_string;

	if (!rawCardStr) {
		return next(errors.MISSING_RAW_CARD());
	}

	try {
		const card = await virgil.publishCard(rawCardStr);
		const user = await nexmo.createUser(card.identity);
		const nexmo_jwt = nexmo.generateJwt(card.identity);
		const virgil_jwt = virgil.generateJwt(card.identity);
		const response = Object.assign({}, {
			user: Object.assign(user, { virgil_card: virgil.serializeCard(card) }),
			nexmo_jwt,
			virgil_jwt
		});
		res.json(response);
	} catch (error) {
		next(error);
	}
});

router.get('/users', (req, res, next) => {
	nexmo.listUsers()
		.then(users => res.json(users))
		.catch(next);
});

router.post('/conversations', (req, res, next) => {
	const displayName = req.body.display_name;
	if (!displayName) {
		return next(errors.MISSING_PARAM('display_name'));
	}

	nexmo.createConversation(displayName)
		.then(result => res.json(result))
		.catch(next);
});

router.put('/conversations', (req, res, next) => {
	const { conversation_id, user_id, action } = req.body;

	if (!conversation_id) {
		return next(errors.MISSING_PARAM('conversation_id'));
	}

	if (!user_id) {
		return next(errors.MISSING_PARAM('user_id'));
	}

	if (!action) {
		return next(errors.MISSING_PARAM('action'));
	}

	nexmo.updateConversation({ conversation_id, user_id, action })
		.then(result => res.json(result))
		.catch(next);
});

router.get('/nexmo-jwt', (req, res, next) => {
	const { identity } = req.query;
	if (!identity) {
		return next(errors.MISSING_IDENTITY());
	}
	const jwt = nexmo.generateJwt(identity);
	res.json({ jwt });
});

router.get('/virgil-jwt', (req, res, next) => {
	const { identity } = req.query;
	if (!identity) {
		return next(errors.MISSING_IDENTITY());
	}
	const jwt = virgil.generateJwt(identity);
	res.json({ jwt: jwt.toString() });
});
