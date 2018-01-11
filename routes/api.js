const express = require('express');
const router = express.Router();
const virgil = require('../services/virgil');
const nexmo = require('../services/nexmo');
const errors = require('../services/errors');

module.exports = router;

router.post('/users', (req, res, next) => {
	const csr = req.body.csr;

	if (!csr) {
		return next(errors.MISSING_CSR());
	}

	virgil.publishCard(csr)
		.then(card => {
			return nexmo.createUser(card.identity)
				.then(user => {
					const jwt = nexmo.generateJwt(card.identity);
					const response = Object.assign({}, {
						user: Object.assign(user, { virgilCard: virgil.serializeCard(card) }),
						jwt
					});
					res.json(response);
				});
		})
		.catch(next);
});

router.get('/users', authenticate, (req, res, next) => {
	nexmo.listUsers()
		.then(users => res.json(users))
		.catch(next);
});

router.post('/conversations', authenticate, (req, res, next) => {
	const { displayName } = req.body;
	if (!displayName) {
		return next(errors.MISSING_PARAM('displayName'));
	}

	nexmo.createConversation(displayName)
		.then(result => res.json(result))
		.catch(next);
});

router.put('/conversations', authenticate, (req, res, next) => {
	const { conversationId, userId, action } = req.body;

	if (!conversationId) {
		return next(errors.MISSING_PARAM('conversationId'));
	}

	if (!userId) {
		return next(errors.MISSING_PARAM('userId'));
	}

	if (!action) {
		return next(errors.MISSING_PARAM('action'));
	}

	nexmo.updateConversation({ conversationId, userId, action })
		.then(result => res.json(result))
		.catch(next);
});

router.get('/jwt', authenticate, fetchVirgilCard, (req, res) => {
	const { userCard } = req;
	const jwt = nexmo.generateJwt(userCard.identity);
	res.json({ jwt });
});

function authenticate(req, res, next) {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		return next(errors.MISSING_AUTHORIZATION());
	}

	virgil.verifyToken(authHeader.split(' ')[1])
		.then(userCardId => {
			if (userCardId === null) {
				return Promise.reject(errors.INVALID_ACCESS_TOKEN());
			}

			req.userCardId = userCardId;
			next();
		})
		.catch(next);
}

function fetchVirgilCard(req, res, next) {
	return virgil.getCard(req.userCardId)
		.then(card => {
			req.userCard = card;
			next();
		})
		.catch(next);
}
