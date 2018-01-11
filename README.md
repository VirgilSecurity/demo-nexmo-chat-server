# Virgil Nexmo Demo Chat API v1

Application API server for the Virgil Nexmo Demo Messaging app. Its primary purpose is to register users' Virgil Cards on 
Virgil Cards service and generate JWT for users to access Nexmo APIs. Uses ad hoc [Virgil Auth](https://github.com/VirgilSecurity/virgil-services-auth) 
service to authenticate users without passwords.


 ## Contents
 * [Endpoints](#endpoints)
    * [POST /users](#post-users)
    * [GET /users](#get-users)
    * [POST /conversations](#post-conversations)
    * [PUT /conversations](#put-conversations)
    * [GET /jwt](#get-jwt)
 * [Authorization](#authorization)
 * [Errors](#errors)
    
 
 ## Endpoints
 
 ### POST /users
 
 An endpoint to register new user. Expects a _Card Signing Request_ as its only parameter. The CSR must satisfy 
 the following requirements:
 
 * `scope` must be `"application"`.
 * `identity` must be unique. Attempt to register a card with duplicate identity will result in `400 BadRequest` error.
 
 **Request**
 ```json
{
	"csr": "eyJjb250ZW50X3NuYXBzaG90IjoiZXlKcFpHVnVkR2...k9In19fQ=="
}
```

**Response**

If request is successful, an object representing a [Nexmo user](https://ea.developer.nexmo.com/api/conversation#create-a-user) 
is returned along with the string representation of the user's Virgil Card and a JWT for access to Nexmo APIs:

> Request must include `Content-Type: "application/json"` header 
 
```json
{
	"user": {
		"id": "USR-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
		"href": "http://conversation.local/v1/users/USR-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
		"virgil_card": "eyJjb250ZW50X3NuYXBzaG90IjoiZXlKcFpHVnVkR2...k9In19fQ=="
	},
	"jwt": "xxxxx.yyyyy.zzzzz"   
}
```
You can then use virgil sdk to `import` a Virgil Card object from this string. The `jwt` can be used to initialize the 
Nexmo API client.

### GET /users

An endpoint to retrieve a list of users.

> This endpoint requires [authorization](#authorization).

**Response**

```json
[
	{
		"name": "Dillon",
		"id": "USR-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
		"href": "http://conversation.local/v1/users/USR-aaaaaaaa-bbbb-cccc-dddd-0123456789ab"
	}
]
```

### POST /conversations

An endpoint to create a new [Nexmo Conversation](https://ea.developer.nexmo.com/api/conversation)

> This endpoint requires [authorization](#authorization).

**Request**

```json
{
	"displayName": "My new conversation" 
}
```

**Response**

```json
{
	"id": "CON-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
	"href": "http://conversation.local/v1/conversations/CON-aaaaaaaa-bbbb-cccc-dddd-0123456789ab"
}
```
   
### PUT /conversations

An endpoint to add a user to a conversation.

> This endpoint requires [authorization](#authorization).

**Request**

```json
{
	"conversationId": "CON-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
	"userId": "USR-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
	"action": "join"
}
```

Parameter action must be "join" to add the user to the conversation. Other types of actions - TBD.

**Response**

```json
{
	"user_id": "USR-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
	"name": "MEM-aaaaaaaa-bbbb-cccc-dddd-0123456789ab",
	"user_name": "Dillon",
	"state": "JOINED"
}
```

### GET /jwt

An endpoint to obtain an access token for the Twilio API.
 
> This endpoint requires [authorization](#authorization).

**Response**
```json
{
	"jwt": "xxxxx.yyyyy.zzzzz"
}
```


## Authorization

To authorize the request, the client app must [obtain an access token](https://github.com/VirgilSecurity/virgil-services-auth#post-v4authorizationactionsobtain-access-token) 
from the Virgil Auth service and include it in the `Authorization` header of the request:

```
Authorization: Bearer eyJhbGciOiJ2aXJnaWwiLCJ0eXA...i8m2asGQM
```

## Errors

Application uses standard HTTP response codes:

```
200 - Success
401 - Authentication failed
400 - Request error
500 - Server error
```

Additional information about the error is returned in response body as JSON object:
```json
{
	"status": {numeric_http_status},
	"errorCode": {numeric_error_code},
	"message": "Message containing error details"
}
```
