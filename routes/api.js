const express = require('express');
const router = express.Router();
const virgil = require('../services/virgil');
const nexmo = require('../services/nexmo');
const errors = require('../services/errors');

module.exports = router;

router.post('/users', async (req, res, next) => {
	const rawCardStr = req.body.raw_card_string;

	if (!rawCardStr) {
		return next(errors.MISSING_RAW_CARD());
	}

	try {
		const card = await virgil.publishCard(rawCardStr);
		const user = await nexmo.createUser(card.identity);
		const jwt = nexmo.generateJwt(card.identity);
		const response = Object.assign({}, {
			user: Object.assign(user, { virgil_card: virgil.serializeCard(card) }),
			jwt
		});
		res.json(response);
	} catch (error) {
		next(error);
	}
});

router.get('/users', authenticate, (req, res, next) => {
	nexmo.listUsers()
		.then(users => res.json(users))
		.catch(next);
});

router.post('/conversations', authenticate, (req, res, next) => {
	const displayName = req.body.display_name;
	if (!displayName) {
		return next(errors.MISSING_PARAM('display_name'));
	}

	nexmo.createConversation(displayName)
		.then(result => res.json(result))
		.catch(next);
});

router.put('/conversations', authenticate, (req, res, next) => {
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

router.get('/jwt', authenticate, fetchVirgilCard, (req, res) => {
	const { userCard } = req;
	const jwt = nexmo.generateJwt(userCard.identity);
	res.json({ jwt });
});

async function authenticate(req, res, next) {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		return next(errors.MISSING_AUTHORIZATION());
	}

	try {
		const userCardId = await virgil.getUserCardId(authHeader.split(' ')[1]);
		if (userCardId === null) {
			return next(errors.INVALID_ACCESS_TOKEN());
		}

		req.userCardId = userCardId;
		next();
	} catch (error) {
		next(error);
	}
}

function fetchVirgilCard(req, res, next) {
	return virgil.getCard(req.userCardId)
		.then(card => {
			req.userCard = card;
			next();
		})
		.catch(next);
}
