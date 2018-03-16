[![Build Status](https://travis-ci.org/advanced-rest-client/oauth-authorization.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/oauth-authorization)

## undefined component
Tag: `<oauth2-authorization>`

### Installation
Using bower:
```
bower install --save advanced-rest-client/oauth2-authorization
```

The `<outh2-authorization>` performs an OAuth2 requests to get a token for given settings.

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

```
<outh2-authorization></outh2-authorization>
```
```
var settings = {
  type: 'implicit',
  clientId: 'CLIENT ID',
  redirectUrl: 'https://example.com/auth-popup.html',
  authorizationUrl: 'https://auth.example.com/token'
  scopes: ['email'],
  state: 'Optional string'
};
var factory = document.querySelector('outh2-authorization');
factory.authorize(settings)

// or event based
var event = new CustomEvent('oauth2-token-requested', { 'detail': settings, bubbles: true });
document.dispatchEvent(event);
```

There is one difference for from using event based approach. When the token has been received
this will set `tokenValue` property on the target of the event.
The event will be canceled one it reach this element so other elements will not double the action.

An element or app that requesting the token should observe the `oauth2-token-response` and
`oauth2-error` events to get back the response.

## Popup in authorization flow

This element conatin a `oauth-popup.html` that can be used to exchange token / code data with
hosting page. Other page can be used as well. But in must `window.postMessage` back to the
`window.opener`. The structure of the message if the parsed query or has string to the map
of parameters. Furthermore it must camel case the parameters. Example script is source code
of the `oauth-popup.html` page.
Popup should be served over the SSL.

## The state parameter and security

This element is intened to be used in debug applications where confidentialy is already
compromised because users may be asked to provide client secret parameter (depending on the flow).
*It should not be used in client applications** that don't serve debugging purposes.
Client secret should never be used on the client side.

To have at least minimum of protection (in already compromised environment) this library generates
a `state` parameter as a series of alphanumeric characters and append them to the request.
It is expected to return the same string in the response (as defined in rfc6749). Though this
parameter is optional, it will reject the response if the `state` parameter is not the same as the
one generated before the request.

The state parameter is generated automatically by the element if non provided in
settings. It is a good idea to use this property to check if the event response
(either token or error) are comming from your request for token. The app can
support different oauth clients so you can check later with the token response if
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
to determine cause of unsuccesful request.

### Example

```
var settings = {
  interactive: false,
  type: 'implicit',
  clientId: 'CLIENT ID',
  redirectUrl: 'https://example.com/auth-popup.html',
  authorizationUrl: 'https://auth.example.com/token'
  state: '1234'
};
var event = new CustomEvent('oauth2-token-requested', { 'detail': settings, bubbles: true });
document.dispatchEvent(event);

document.body.addEventListener('oauth2-token-response', (e) => {
  let info = e.detail;
  if (info.state !== '1234') {
    return;
  }
  if (info.interactive === false && info.code) {
    // unsuccesful request
    return;
  }
  let token = info.accessToken;
});
```

## Demo
See `auth-methods` > `auth-method-oauth2` element for the demo.

## API
### Component properties (attributes)

#### tokenInfo
- Type: `Object`
- Read only property
A full data returned by the authorization endpoint.


### Component methods

#### clear
- Return type: `undefined`

#### authorize
- Return type: `undefined`
Authorize the user using provided settings.
See `auth-methods/auth-method-oauth2` element for more information about settings.
#### randomString
- Return type: `undefined`
http://stackoverflow.com/a/10727155/1127848

## undefined component
Tag: `<oauth1-authorization>`

### Installation
Using bower:
```
bower install --save advanced-rest-client/oauth1-authorization
```

An element to perform OAuth1 authorization and to sign auth requests.

Note that the OAuth1 authorization wasn't designed for browser. Most existing
OAuth1 implementation deisallow browsers to perform the authorization by
not allowing POST requests to authorization server. Therefore receiving token
may not be possible without using browser extensions to alter HTTP request to
enable CORS.
If the server disallow obtaining authorization token and secret from clients
then your application has to listen for `oauth1-token-requested` custom event
and perform authorization on the server side.

When auth token and secret is available and the user is to perform a HTTP request,
the request panel sends `before-request` cutom event. This element handles the event
and apllies authorization header with generated signature to the request.

## OAuth 1 configuration object

Both authorization or request signing requires detailed configuration object.
This is handled by the request panel. It sets OAuth1 configuration in the `request.auth`
property.

| Property | Type | Description |
| ----------------|-------------|---------- |
| `signatureMethod` | `String` | One of `PLAINTEXT`, `HMAC-SHA1`, `RSA-SHA1` |
| `requestTokenUrl` | `String` | Token request URI. Optional for before request. Required for authorization |
| `accessTokenUrl` | `String` | Access token request URI. Optional for before request. Required for authorization |
| `authorizationUrl` | `String` | User dialog URL. |
| `consumerKey` | `String` | Consumer key to be used to generate the signature. Optional for before request. |
| `consumerSecret` | `String` | Consumer secret to be used to generate the signature. Optional for before request. |
| `redirectUrl` | `String` | Redirect URI for the authorization. Optional for before request. |
| `authParamsLocation` | `String` | Optional. Location of the authorization parameters. Default to `authorization` meaning it creates an authorization header. Any other value means query parameters |
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

## API
### Component properties (attributes)

#### tokenInfo
- Type: `Object`
- Read only property
A full data returned by the authorization endpoint.

#### proxy
- Type: `string`
If set, requests made by this element to authorization endpoint will be
prefixed with the proxy value.

#### lastIssuedToken
- Type: `Object`
Latest valid token exchanged with the authorization endpoint.

#### requestTokenUrl
- Type: `string`
OAuth 1 token authorization endpoint.

#### accessTokenUrl
- Type: `string`
Oauth 1 token exchange endpoint

#### consumerKey
- Type: `string`
Oauth 1 consumer key to use with auth request

#### consumerSecret
- Type: `string`
Oauth 1 consumer secret to be used to generate the signature.

#### signatureMethod
- Type: `string`
- Default: `"HMAC-SHA1"`
A signature generation method.
Once of: `PLAINTEXT`, `HMAC-SHA1` or `RSA-SHA1`

#### authParamsLocation
- Type: `string`
- Default: `"authorization"`
Location of the OAuth authorization parameters.
It can be either `authorization` meaning as a header and
`querystring` to put OAuth parameters to the URL.

#### nonceChars
- Type: `Function`



### Component methods

#### authorize
- Return type: `undefined`
Performs a request to authorization server.
#### getTimestamp
- Return type: `Number`
Returns current timestamp.
#### encodeData
- Return type: `String`
URL encodes the string.
#### decodeData
- Return type: `String`
URL decodes data.
Also replaces `+` with ` ` (space).
#### getSignature
- Return type: `String`
Computes signature for the request.
#### createSignatureBase
- Return type: `String`
Creates a signature base as defined in
https://tools.ietf.org/html/rfc5849#section-3.4.1
#### createSignatureKey
- Return type: `String`
Creates a signature key to compute the signature as described in
https://tools.ietf.org/html/rfc5849#section-3.4.2
#### hex2b64
- Return type: `String`
Found at http://jsfiddle.net/ARTsinn/6XaUL/
#### encodeUriParams
- Return type: `undefined`
Encodes parameters in the map.
#### signRequestObject
- Return type: `Object`
Creates OAuth1 signature for a `request` object.
The request object must contain:
- `url` - String
- `method` - String
- `headers` - String
It also may contain the `body` property.

It alters the request object by applying OAuth1 parameters to a set
location (qurey parameters, authorization header, body). This is
controlled by `this.authParamsLocation` property. By default the
parameters are applied to authorization header.
#### getOAuthAccessToken
- Return type: `undefined`
Exchanges temporary authorization token for authorized token.
When ready this function fires `oauth1-token-response`
#### clearRequestVariables
- Return type: `undefined`
Clears variables set for current request after signature has been
generated and token obtained.
#### getOAuthRequestToken
- Return type: `Promise`
Requests the authorization server for temporarty authorization token.
This token should be passed to `authorizationUri` as a `oauth_token`
parameter.
#### request
- Return type: `Promise`
Makes a HTTP request.
Before making the request it sends `auth-request-proxy` custom event
with the URL and init object in event's detail object.
If the event is cancelled then it will use detail's `result` value to
return from this function. The `result` must be a Promise that will
resolve to a `Response` object.
Otherwise it will use internall `fetch` implementation.
#### parseMapKeys
- Return type: `undefined`
Adds camel case keys to a map of parameters.
It adds new keys to the object tranformed from `oauth_token`
to `oauthToken`
#### getContentType
- Return type: `String`
Get the Content-Type value from the headers.

