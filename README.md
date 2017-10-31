[![Build Status](https://travis-ci.org/advanced-rest-client/oauth-authorization.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/oauth-authorization)  

# oauth2-authorization

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
  scopes: ['email']
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

## Demo
See `auth-methods` > `auth-method-oauth2` element for the demo.



### Events
| Name | Description | Params |
| --- | --- | --- |
| oauth2-error | Fired wne error occurred. An error may occure when `state` parameter of the OAuth2 response is different from the requested one. Another example is when the popup window has been closed before it passed response token. It may happen when the OAuth request was invalid. | message **String** - A message that can be displayed to the user. |
code **String** - A message code: `invalid_state` - when `state` parameter is different; `no_response` when the popup was closed before sendin token data; `response_parse` - when the response from the code exchange can't be parsed; `request_error` when the request errored by the transport library. Other status codes are defined in [rfc6749](https://tools.ietf.org/html/rfc6749). |
| oauth2-token-response | Fired when OAuth2 token has been received. Properties of the `detail` object will contain the response from the authentication server. It will contain the original parameteres but also camel case of the parameters.  So for example 'implicit' will be in the response as well as `accessToken` with the same value. The puropse of this is to support JS application that has strict formatting rules and disallow using '_' in property names. Like ARC. | __none__ |
# oauth1-authorization

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
| `oauth_token` | `String` | Required for signing requests. Received OAuth token |
| `oauth_token_secret` | `String` | Required for signing requests. Received OAuth token secret |

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



### Events
| Name | Description | Params |
| --- | --- | --- |
| oauth1-error | Fired when authorization is unsuccessful | message **String** - Human readable error message |
code **String** - Error code associated with the error. See description of the element fo code mening. |
| oauth1-token-response | Fired when the authorization is successful and token and secret are ready. | oauth_token **String** - Received OAuth1 token |
oauth_token_secret **String** - Received OAuth1 token secret |
