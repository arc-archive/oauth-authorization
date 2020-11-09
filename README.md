# OAuth authorization

Contains a library and custom elements to perform OAuth2 authorization.
The main library is the `OAuth2Authorization` class that has the logic to perform OAuth 2 authorization. The `<oauth2-authorization>` element is used only to handle the DOM event to start the authorization flow.

## API change

In version 5.0.0 the API surface has changed. The custom element for OAuth 2 authorization only handles the authorization event and uns the authorize function on the `OAuth2Authorization` class.
Also configuration has been redefined and declared in its own TS declaration files.

## Types

Types are defined in the `@advanced-rest-client/arc-types` package.

## Usage

### Installation

```sh
npm install --save @advanced-rest-client/oauth-authorization
```

### Example

```javascript
import { OAuth2Authorization } from '@advanced-rest-client/oauth-authorization';

const settings = {
  responseType: 'implicit',
  clientId: 'CLIENT ID',
  redirectUri: 'https://example.com/auth-popup.html',
  authorizationUri: 'https://auth.example.com/token',
  scopes: ['email'],
  state: 'Optional string',
};

const factory = new OAuth2Authorization(settings);
const tokenInfo = await factory.authorize(settings)
```

### Popup in authorization flow

This package contains the `oauth-popup.html` that can be used to exchange token / code data with hosting page. Other page can be used as well.
The popup page must use the `window.postMessage()` to report back to the library the parameters returned by the authorization server. It expect to return the part of the URL that contains the authorization result.
For example, for the popup url having values like this: `https://redirect.domain.com/popup.html#code=1234&state=5678` the popup window should post message with `code=1234&state=5678`.

### The state parameter and security

This element is intend to be used in debug applications where confidentially is already compromised because users may be asked to provide client secret parameter (depending on the flow).
**It should not be used in client applications** that don't serve debugging purposes. Client secret should never be used on the client side.

To have at least minimum of protection (in already compromised environment) this library generates a `state` parameter as a series of alphanumeric characters and append them to the request.
It is expected to return the same string in the response (as defined in rfc6749). Though this parameter is optional, it will reject the response if the `state` parameter is not the same as the one generated before the request.

The state parameter is generated automatically by the element if non provided in settings. It is a good idea to use this property to check if the event response (either token or error) are coming from your request for token. The app can
support different OAuth clients so you can check later with the token response if this is a response for the same client.

### Non-interactive authorization

For `implicit` and `authorization_code` token requests you can set the `interactive` configuration property to `false` to request the token in the background without rendering any UI related to authorization to the user.
It can be used to request an access token after the user authorized the application. Server should return the token which will be passed back to the application.

### OAuth 1

The OAuth1 element is deprecated and no longer maintained. The tests for the element has been removed. After consulting with other teams at MuleSoft this element will be removed.

An element to perform OAuth1 authorization and to sign auth requests.

Note that the OAuth1 authorization wasn't designed for browser. Most existing
OAuth1 implementation disallow browsers to perform the authorization by
not allowing POST requests to authorization server. Therefore receiving token
may not be possible without using browser extensions to alter HTTP request to
enable CORS.
If the server disallow obtaining authorization token and secret from clients
then your application has to listen for `oauth1-token-requested` custom event
and perform authorization on the server side.

When auth token and secret is available and the user is to perform a HTTP request,
the request panel sends `before-request` custom event. This element handles the event
and applies authorization header with generated signature to the request.

### OAuth 1 configuration object

Both authorization or request signing requires detailed configuration object.
This is handled by the request panel. It sets OAuth1 configuration in the `request.auth`
property.

| Property | Type | Description |
| ----------------|-------------|---------- |
| `signatureMethod` | `String` | One of `PLAINTEXT`, `HMAC-SHA1`, `RSA-SHA1` |
| `requestTokenUri` | `String` | Token request URI. Optional for before request. Required for authorization |
| `accessTokenUri` | `String` | Access token request URI. Optional for before request. Required for authorization |
| `authorizationUri` | `String` | User dialog URL. |
| `consumerKey` | `String` | Consumer key to be used to generate the signature. Optional for before request. |
| `consumerSecret` | `String` | Consumer secret to be used to generate the signature. Optional for before request. |
| `redirectUri` | `String` | Redirect URI for the authorization. Optional for before request. |
| `authParamsLocation` | `String` | Location of the authorization parameters. Default to `authorization` header |
| `authTokenMethod` | `String` | Token request HTTP method. Default to `POST`. Optional for before request. |
| `version` | `String` | Oauth1 protocol version. Default to `1.0` |
| `nonceSize` | `Number` | Size of the nonce word to generate. Default to 32. Unused if `nonce` is set. |
| `nonce` | `String` | Nonce to be used to generate signature. |
| `timestamp` | `Number` | Request timestamp. If not set it sets current timestamp |
| `customHeaders` | `Object` | Map of custom headers to set with authorization request |
| `type` | `String` | Must be set to `oauth1` or during before-request this object will be ignored. |
| `token` | `String` | Required for signing requests. Received OAuth token |
| `tokenSecret` | `String` | Required for signing requests. Received OAuth token secret |

### Error codes

- `params-error` Oauth1 parameters are invalid
- `oauth1-error` OAuth popup is blocked.
- `token-request-error` HTTP request to the authorization server failed
- `no-response` No response recorded.

### Acknowledgements

- This element uses [jsrsasign](https://github.com/kjur/jsrsasign) library distributed under MIT licence.
- This element uses [crypto-js](https://code.google.com/archive/p/crypto-js/) library distributed under BSD license.

## Development

```sh
git clone https://github.com/advanced-rest-client/oauth-authorization
cd oauth-authorization
npm install
```

### Running the tests

```sh
npm test
```

## Required dependencies

The `CryptoJS` and `RSAKey` libraries are not included into the element sources.
If your project do not use this libraries already include it into your project.

```sh
npm i cryptojslib jsrsasign
```

```html
<script src="../../../cryptojslib/components/core.js"></script>
<script src="../../../cryptojslib/rollups/sha1.js"></script>
<script src="../../../cryptojslib/components/enc-base64-min.js"></script>
<script src="../../../cryptojslib/rollups/md5.js"></script>
<script src="../../../cryptojslib/rollups/hmac-sha1.js"></script>
<script src="../../../jsrsasign/lib/jsrsasign-rsa-min.js"></script>
```

Also OAuth1 element uses `URL` class with `searchParams` properties. If targeting old browsers include polyfill for this too.
