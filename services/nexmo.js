const Nexmo = require('nexmo');
const config = require('../config');

const nexmo = new Nexmo(config.nexmo);
const USER_ACL = {
	"paths": {
		"/v1/sessions/**": {
			"methods": ["GET"]
		},
		"/v1/users/*": {
			"methods": ["GET"]
		},
		"/v1/conversations/*": {
			"methods": ["GET", "POST", "PUT"]
		}
	}
};
const JWT_TTL = 86400;

module.exports = {
	createUser(username) {
		return new Promise((resolve, reject) => {
			nexmo.users.create({ name: username }, (err, user) => {
				if (err) {
					return reject(err);
				}

				resolve(user);
			});
		});

	},

	createConversation(displayName) {
		return new Promise((resolve, reject) => {
			nexmo.conversations.create({ display_name: displayName }, (err, conversation) => {
				if (err) {
					return reject(err);
				}

				resolve(conversation);
			})
		});
	},

	updateConversation({ conversationId, userId, action }) {
		return new Promise((resolve, reject) => {
			nexmo.conversations.members.add(
				conversationId,
				{
					action,
					user_id: userId,
					channel: {
						type: 'app'
					}
				},
				(err, conversation) => {
					if (err) {
						return reject(err);
					}

					resolve(conversation);
				}
			)
		})
	},

	listUsers() {
		return new Promise((resolve, reject) => {
			nexmo.users.get({}, (err, users) => {
				if (err) {
					return reject(err);
				}

				resolve(users);
			})
		});
	},

	generateJwt(username) {
		return nexmo.generateJwt({
			sub: username,
			exp: Date.now() + JWT_TTL,
			acl: USER_ACL
		});
	}
};