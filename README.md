[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/oauth-authorization.svg)](https://www.npmjs.com/package/@advanced-rest-client/oauth-authorization)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/oauth-authorization)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/oauth-authorization)


# OAuth authorization

Provides components to authorize the user using OAuth 1 and OAuth 2 standards.

## OAuth 2

There are 4 basic token requests flows:
- Authorization Code for apps running on a web server (`authorization_code` type)
- Implicit for browser-based or mobile apps (`implicit` type)
- Password for logging in with a username and password (`password` type)
- Client credentials for application access (`client_credentials` type)

This element uses them all.

Main function is the `authorize()` function that can be also used via event system.
This function accepts different set of parameters depending on request type. However it will
not perform a validation on the settings. It will try to perform the request for given set of
parameters. If it fails, than it fail on the server side.

### Example

```html
<outh2-authorization></outh2-authorization>
```

```javascript
const settings = {
  type: 'implicit',
  clientId: 'CLIENT ID',
  redirectUri: 'https://example.com/auth-popup.html',
  authorizationUri: 'https://auth.example.com/token'
  scopes: ['email'],
  state: 'Optional string'
};
const factory = document.querySelector('outh2-authorization');
factory.authorize(settings)

// or event based
const event = new CustomEvent('oauth2-token-requested', { 'detail': settings, bubbles: true });
document.dispatchEvent(event);
```

There is one difference for from using event based approach. When the token has been received
this will set `tokenValue` property on the target of the event.
The event will be cancelled one it reach this element so other elements will not double the action.

An element or app that requesting the token should observe the `oauth2-token-response` and
`oauth2-error` events to get back the response.

## Popup in authorization flow

This element contain a `oauth-popup.html` that can be used to exchange token / code data with
hosting page. Other page can be used as well. But in must `window.postMessage` back to the
`window.opener`. The structure of the message if the parsed query or has string to the map
of parameters. Furthermore it must camel case the parameters. Example script is source code
of the `oauth-popup.html` page.
Popup should be served over the SSL.

## The state parameter and security

This element is intened to be used in debug applications where confidentialy is already
compromised because users may be asked to provide client secret parameter (depending on the flow).
**It should not be used in client applications** that don't serve debugging purposes.
Client secret should never be used on the client side.

To have at least minimum of protection (in already compromised environment) this library generates
a `state` parameter as a series of alphanumeric characters and append them to the request.
It is expected to return the same string in the response (as defined in rfc6749). Though this
parameter is optional, it will reject the response if the `state` parameter is not the same as the
one generated before the request.

The state parameter is generated automatically by the element if non provided in
settings. It is a good idea to use this property to check if the event response
(either token or error) are coming from your request for token. The app can
support different OAuth clients so you can check later with the token response if
this is a response for the same client.

## Non-interactive authorization (experimental)

For `implicit` and `code` token requests you can set `interactive` property
of the settings object to `false` to request the token in the background without
displaying any UI related to authorization to the user.
It can be used to request an access token after the user authorized the application.
Server should return the token which will be passed back to the application.

When using `interactive = false` mode then the response event is always
`oauth2-token-response`, even when there was authorization error or user never
authorized the application. In this case the response object will not carry
`accessToken` property and always have `interactive` set to `false` and `code`
to determine cause of unsuccessful request.

### Example

```javascript
const settings = {
  interactive: false,
  type: 'implicit',
  clientId: 'CLIENT ID',
  redirectUri: 'https://example.com/auth-popup.html',
  authorizationUri: 'https://auth.example.com/token'
  state: '1234'
};
const event = new CustomEvent('oauth2-token-requested', { 'detail': settings, bubbles: true });
document.dispatchEvent(event);

document.body.addEventListener('oauth2-token-response', (e) => {
  let info = e.detail;
  if (info.state !== '1234') {
    return;
  }
  if (info.interactive === false && info.code) {
    // unsuccessful request
    return;
  }
  let token = info.accessToken;
});
```

## OAuth 1
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

## OAuth 1 configuration object

Both authorization or request signing requires detailed configuration object.
This is handled by the request panel. It sets OAuth1 configuration in the `request.auth`
property.

| Property | Type | Description |
| ----------------|-------------|---------- |
| `signatureMethod` | `String` | One of `PLAINTEXT`, `HMAC-SHA1`, `RSA-SHA1` |
| `requestTokenUrl` | `String` | Token request URI. Optional for before request. Required for authorization |
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

## Error codes

-  `params-error` Oauth1 parameters are invalid
-  `oauth1-error` OAuth popup is blocked.
-  `token-request-error` HTTP request to the authorization server failed
-  `no-response` No response recorded.

## Acknowledgements

- This element uses [jsrsasign](https://github.com/kjur/jsrsasign) library distributed
under MIT licence.
- This element uses [crypto-js](https://code.google.com/archive/p/crypto-js/) library
distributed under BSD license.

## Usage

### Installation

```
npm install --save @advanced-rest-client/oauth-authorization
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/advanced-rest-client/oauth-authorization.js';
    </script>
  </head>
  <body>
    <oauth-authorization></oauth-authorization>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/advanced-rest-client/oauth-authorization.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <oauth-authorization content-type="application/json" value="{{body}}"></oauth-authorization>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/oauth-authorization
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
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
