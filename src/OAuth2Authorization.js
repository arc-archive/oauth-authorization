/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import { sanityCheck, randomString, camel, generateCodeChallenge } from './Utils.js';
import { applyCustomSettingsQuery, applyCustomSettingsBody, applyCustomSettingsHeaders } from './CustomParameters.js';
import { AuthorizationError, CodeError } from './AuthorizationError.js';
import { IframeAuthorization } from './lib/IframeAuthorization.js';
import { PopupAuthorization } from './lib/PopupAuthorization.js';

/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Settings */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.TokenInfo} TokenInfo */
/** @typedef {import('./types').ProcessingOptions} ProcessingOptions */

export const resolveFunction = Symbol('resolveFunction');
export const rejectFunction = Symbol('rejectFunction');
export const settingsValue = Symbol('settingsValue');
export const optionsValue = Symbol('optionsValue');
export const prepareSettings = Symbol('prepareSettings');
export const prepareOptions = Symbol('prepareOptions');
export const authorize = Symbol('authorize');
export const stateValue = Symbol('stateValue');
export const authorizeImplicitCode = Symbol('authorizeImplicitCode');
export const authorizeClientCredentials = Symbol('authorizeClientCredentials');
export const authorizePassword = Symbol('authorizePassword');
export const authorizeCustomGrant = Symbol('authorizeCustomGrant');
export const popupValue = Symbol('popupValue');
export const popupUnloadHandler = Symbol('popupUnloadHandler');
export const tokenResponse = Symbol('tokenResponse');
export const messageHandler = Symbol('messageHandler');
export const iframeValue = Symbol('iframeValue');
export const processPopupRawData = Symbol('processPopupRawData');
export const processTokenResponse = Symbol('processTokenResponse');
export const handleTokenInfo = Symbol('handleTokenInfo');
export const computeTokenInfoScopes = Symbol('computeTokenInfoScopes');
export const computeExpires = Symbol('computeExpires');
export const codeValue = Symbol('codeValue');
export const frameTimeoutHandler = Symbol('frameTimeoutHandler');
export const reportOAuthError = Symbol('reportOAuthError');
export const authorizePopup = Symbol('authorizePopup');
export const authorizeTokenNonInteractive = Symbol('authorizeTokenNonInteractive');
export const createTokenResponseError = Symbol('createTokenResponseError');
export const createErrorParams = Symbol('createErrorParams');
export const tokenInfoFromParams = Symbol('tokenInfoFromParams');
export const processCodeResponse = Symbol('processCodeResponse');
export const handleTokenCodeError = Symbol('handleTokenCodeError');
export const codeVerifierValue = Symbol('codeVerifierValue');

/**
 * A library that performs OAuth 2 authorization.
 * 
 * It is build for API components ecosystem and the configuration is defined in `@advanced-rest-client/arc-types`
 * so all components use the same configuration.
 */
export class OAuth2Authorization {
  /**
   * @returns {OAuth2Settings} The authorization settings used to initialize this class.
   */
  get settings() {
    return this[settingsValue];
  }

  /**
   * @returns {ProcessingOptions} The processing options used to initialize this object.
   */
  get options() {
    return this[optionsValue];
  }

  /**
   * @returns {string} The request state parameter. If the state is not passed with the configuration one is generated.
   */
  get state() {
    if (!this[stateValue]) {
      this[stateValue] = this.settings.state || randomString();
    }
    return this[stateValue];
  }

  /**
   * @param {OAuth2Settings} settings The authorization configuration.
   * @param {ProcessingOptions=} options Additional processing options to configure the behavior of this library.
   */
  constructor(settings, options={}) {
    if (!settings) {
      throw new TypeError('Expected one argument.');
    }
    /**
     * @type {Function} The main resolve function
     */
    this[resolveFunction] = undefined;
    /**
     * @type {Function} The main reject function
     */
    this[rejectFunction] = undefined;
    /**
     * @type {OAuth2Settings} The authorization settings
     */
    this[settingsValue] = this[prepareSettings](settings);
    /**
     * @type {ProcessingOptions} The processing options.
     */
    this[optionsValue] = this[prepareOptions](options);

    this[messageHandler] = this[messageHandler].bind(this);
    this[frameTimeoutHandler] = this[frameTimeoutHandler].bind(this);
    this[popupUnloadHandler] = this[popupUnloadHandler].bind(this);
  }

  /**
   * @param {OAuth2Settings} settings
   * @returns {OAuth2Settings} Processed settings
   */
  [prepareSettings](settings) {
    const copy = { ...settings };
    Object.freeze(copy);
    return copy;
  }

  /**
   * @param {ProcessingOptions} options
   * @returns {ProcessingOptions} Processed options
   */
  [prepareOptions](options) {
    const copy = { 
      popupPullTimeout: 50,
      messageTarget: window,
      ...options,
    };
    Object.freeze(copy);
    return copy;
  }

  /**
   * A function that should be called before the authorization.
   * It checks configuration integrity, and performs some sanity checks 
   * like proper values of the request URIs.
   */
  checkConfig() {
    // @todo(pawel): perform settings integrity tests.
    sanityCheck(this.settings);
  }

  /**
   * Performs the authorization.
   * @returns {Promise<TokenInfo>} Promise resolved to the token info.
   */
  authorize() {
    return new Promise((resolve, reject) => {
      this[resolveFunction] = resolve;
      this[rejectFunction] = reject;
      this[authorize]();
    });
  }

  /**
   * Reports authorization error back to the application.
   *
   * This operation clears the promise object.
   *
   * @param {string} message The message to report
   * @param {string} code Error code
   */
  [reportOAuthError](message, code) {
    this.clearObservers();
    if (!this[rejectFunction]) {
      return;
    }
    const interactive = typeof this.settings.interactive === 'boolean' ? this.settings.interactive : true;
    const e = new AuthorizationError(
      message,
      code,
      this.state,
      interactive,
    );
    this[rejectFunction](e);
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Starts the authorization process.
   */
  [authorize]() {
    const { settings } = this;
    switch (settings.grantType) {
      case 'implicit':
      case 'authorization_code':
        this[authorizeImplicitCode]();
        break;
      case 'client_credentials':
        this[authorizeClientCredentials]();
        break;
      case 'password':
        this[authorizePassword]();
        break;
      default:
        this[authorizeCustomGrant]();
    }
  }

  /**
   * Starts the authorization flow for the `implicit` and `authorization_code` flows.
   * If the `interactive` flag is configured it  then it chooses between showing the UI (popup)
   * or non-interactive iframe.
   */
  async [authorizeImplicitCode]() {
    const { settings } = this;
    const url = await this.constructPopupUrl();
    try {
      if (settings.interactive === false) {
        this[authorizeTokenNonInteractive](url);
      } else {
        this[authorizePopup](url);
      }
      this.options.messageTarget.addEventListener('message', this[messageHandler]);
    } catch (e) {
      this[rejectFunction](e);
      this[rejectFunction] = undefined;
      this[resolveFunction] = undefined;
    }
  }

  /**
   * Constructs the popup/iframe URL for the `implicit` or `authorization_code` grant types.
   * @return {Promise<string>} Full URL for the endpoint.
   */
  async constructPopupUrl() {
    const { settings } = this;
    const mapping = {
      implicit: 'token',
      authorization_code: 'code',
    };
    const type = mapping[settings.grantType];
    if (!type) {
      return null;
    }
    const url = new URL(settings.authorizationUri);
    url.searchParams.set('response_type', type);
    url.searchParams.set('client_id', settings.clientId);
    if (settings.clientSecret) {
      url.searchParams.set('client_secret', settings.clientSecret);
    }
    url.searchParams.set('state', this.state);
    if (settings.redirectUri) {
      url.searchParams.set('redirect_uri', settings.redirectUri);
    }
    const { scopes } = settings;
    if (Array.isArray(scopes) && scopes.length) {
      url.searchParams.set('scope', scopes.join(' '));
    }
    if (settings.includeGrantedScopes) {
      // this is Google specific
      url.searchParams.set('include_granted_scopes', 'true');
    }
    if (settings.loginHint) {
      // this is Google specific
      url.searchParams.set('login_hint', settings.loginHint);
    }
    if (settings.interactive === false) {
      // this is Google specific
      url.searchParams.set('prompt', 'none');
    }
    if (settings.pkce && type === 'code') {
      this[codeVerifierValue] = randomString();
      const challenge = await generateCodeChallenge(this[codeVerifierValue]);
      url.searchParams.set('code_challenge', challenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    // custom query parameters from the `api-authorization-method` component
    if (settings.customData) {
      const cs = settings.customData.auth;
      if (cs) {
        applyCustomSettingsQuery(url, cs);
      }
    }
    return url.toString();
  }

  /**
   * Opens a popup to request authorization from the user.
   * @param {string} url The URL to open.
   */
  [authorizePopup](url) {
    const popup = new PopupAuthorization(this.options.popupPullTimeout);
    try {
      popup.load(url);
    } catch (e) {
      throw new AuthorizationError(
        e.message,
        'popup_blocked',
        this.state,
        this.settings.interactive,
      );
    }
    popup.addEventListener('close', this[popupUnloadHandler]);
    this[popupValue] = popup;
  }

  /**
   * Tries to authorize the user in a non interactive way (iframe rather than a popup).
   * 
   * This method always result in a success response. When there's an error or
   * user is not logged in then the response won't contain auth token info.
   *
   * @param {string} url Complete authorization url
   */
  [authorizeTokenNonInteractive](url) {
    const iframe = new IframeAuthorization(this.options.iframeTimeout);
    iframe.addEventListener('timeout', this[frameTimeoutHandler]);
    iframe.load(url);
    this[iframeValue] = iframe;
  }

  /**
   * Event handler for the the iframe timeout event.
   * If there's the reject function then it is called with the error details.
   */
  [frameTimeoutHandler]() {
    if (!this[rejectFunction]) {
      return;
    }
    const e = new AuthorizationError(
      'Non-interactive authorization failed.',
      'iframe_load_error',
      this.state,
      false,
    );
    this[rejectFunction](e);
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Clears all registered observers:
   * - popup/iframe message listeners
   * - popup info pull interval
   */
  clearObservers() {
    this.options.messageTarget.removeEventListener('message', this[messageHandler]);
    if (this[popupValue]) {
      this[popupValue].cleanUp();
      this[popupValue] = undefined;
    }
    if (this[iframeValue]) {
      this[iframeValue].cancel();
      this[iframeValue].cleanUp();
      this[iframeValue] = undefined;
    }
  }

  /**
   * This is called when the popup info pull interval detects that the window was closed.
   * It checks whether the token info has been set by the redirect page and if not then it reports an error.
   */
  [popupUnloadHandler]() {
    if (this[tokenResponse] || (this.settings.grantType === 'authorization_code' && this[codeValue])) {
      // everything seems to be ok.
      return;
    }
    if (!this[rejectFunction]) {
      // someone already called it.
      return;
    }
    this[reportOAuthError]('No response has been recorded.', 'no_response');
  }

  /**
   * A handler for the `message` event registered when performing authorization that involves the popup
   * of the iframe.
   * @param {MessageEvent} e
   */
  [messageHandler](e) {
    const popup = this[popupValue];
    const iframe = this[iframeValue];
    if (!popup && !iframe) {
      return;
    }
    this[processPopupRawData](e.data);
  }

  /**
   * @param {any} raw The data from the `MessageEvent`. Might not be the data returned by the auth popup/iframe.
   */
  [processPopupRawData](raw) {
    if (!raw) {
      return;
    }
    let params;
    try {
      params = new URLSearchParams(raw);
    } catch (e) {
      this[reportOAuthError]('Invalid response from the redirect page');
      return;
    }
    if (params.has('error') || params.has('access_token') || params.has('code')) {
      this[processTokenResponse](params);
    }
  }

  /**
   * Processes the response returned by the popup or the iframe.
   * @param {URLSearchParams} oauthParams
   */
  async [processTokenResponse](oauthParams) {
    this.clearObservers();
    const state = oauthParams.get('state');
    if (!state) {
      this[reportOAuthError]('Server did not return the state parameter.', 'no_state');
      return;
    }
    if (state !== this.state) {
      // @todo(@jarrodek): Can it happen to have more than a single token request (opened popups) at the same time?
      this[reportOAuthError]('The state value returned by the authorization server is invalid.', 'invalid_state');
      return;
    }
    if (oauthParams.has('error')) {
      this[reportOAuthError](...this[createTokenResponseError](oauthParams));
      return;
    }
    const { grantType } = this.settings;
    if (grantType === 'implicit') {
      this[handleTokenInfo](this[tokenInfoFromParams](oauthParams));
      return;
    }
    if (grantType === 'authorization_code') {
      const code = oauthParams.get('code');
      if (!code) {
        this[reportOAuthError]('The authorization server did not returned the authorization code.', 'no_code');
        return;
      }
      this[codeValue] = code;
      let tokenInfo;
      try {
        tokenInfo = await this.exchangeCode(code);
      } catch (e) {
        this[handleTokenCodeError](e);
        return;
      }
      this[handleTokenInfo](tokenInfo);
      return;
    }

    this[reportOAuthError]('The authorization process has an invalid state. This should never happen.', 'unknown_state');
  }

  /**
   * Processes the response returned by the popup or the iframe.
   * @param {URLSearchParams} oauthParams
   * @returns {string[]} Parameters for the [reportOAuthError]() function
   */
  [createTokenResponseError](oauthParams) {
    const code = oauthParams.get('error');
    const message = oauthParams.get('error_description');
    return this[createErrorParams](code, message);
  }

  /**
   * Creates arguments for the error function from error response
   * @param {string} code Returned from the authorization server error code
   * @param {string=} description Returned from the authorization server error description
   * @returns {string[]} Parameters for the [reportOAuthError]() function
   */
  [createErrorParams](code, description) {
    let message;
    if (description) {
      message = description;
    } else {
      switch (code) {
        case 'interaction_required':
          message = 'The request requires user interaction.';
          break;
        case 'invalid_request':
          message = 'The request is missing a required parameter.';
          break;
        case 'invalid_client':
          message = 'Client authentication failed.';
          break;
        case 'invalid_grant':
          message = 'The provided authorization grant or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.';
          break;
        case 'unauthorized_client':
          message = 'The authenticated client is not authorized to use this authorization grant type.';
          break;
        case 'unsupported_grant_type':
          message = 'The authorization grant type is not supported by the authorization server.';
          break;
        case 'invalid_scope':
          message = 'The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.';
          break;
        default: 
          message = 'Unknown error';
      }
    }
    return [message, code];
  }

  /**
   * Creates a token info object from query parameters
   * @param {URLSearchParams} oauthParams
   * @return {TokenInfo}
   */
  [tokenInfoFromParams](oauthParams) {
    const accessToken = oauthParams.get('access_token');
    const refreshToken = oauthParams.get('refresh_token');
    const tokenType = oauthParams.get('token_type');
    const expiresIn = Number(oauthParams.get('expires_in'));
    const scope = this[computeTokenInfoScopes](oauthParams.get('scope'));
    const tokenInfo = /** @type TokenInfo */ ({
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
      state: oauthParams.get('state'),
      scope,
      expiresAt: undefined,
      expiresAssumed: false,
    });
    return this[computeExpires](tokenInfo);
  }

  /**
   * Processes token info object when it's ready.
   *
   * @param {TokenInfo} info Token info returned from the server.
   */
  [handleTokenInfo](info) {
    this[tokenResponse] = info;
    if (this[resolveFunction]) {
      this[resolveFunction](info);
    }
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Computes token expiration time.
   * It sets `expires_at` property on the token info object which is the time
   * in the future when when the token expires.
   *
   * @param {TokenInfo} tokenInfo Token info object
   * @returns {TokenInfo} A copy with updated properties.
   */
  [computeExpires](tokenInfo) {
    const copy = { ...tokenInfo };
    let { expiresIn } = copy;
    if (!expiresIn || Number.isNaN(expiresIn)) {
      expiresIn = 3600;
      copy.expiresAssumed = true;
    }
    copy.expiresIn = expiresIn;
    const expiresAt = Date.now() + (expiresIn * 1000);
    copy.expiresAt = expiresAt;
    return copy;
  }

  /**
   * Computes the final list of granted scopes.
   * It is a list of scopes received in the response or the list of requested scopes.
   * Because the user may change the list of scopes during the authorization process
   * the received list of scopes can be different than the one requested by the user.
   *
   * @param {string} scope The `scope` parameter received with the response. It's null safe.
   * @return {string[]} The list of scopes for the token.
   */
  [computeTokenInfoScopes](scope) {
    const requestedScopes = this.settings.scopes;
    if (!scope && requestedScopes) {
      return requestedScopes;
    }
    let listScopes = [];
    if (scope) {
      listScopes = scope.split(' ');
    }
    return listScopes;
  }

  /**
   * Exchanges the authorization code for authorization token.
   *
   * @param {string} code Returned code from the authorization endpoint.
   * @returns {Promise<TokenInfo>} The token info when the request was a success.
   */
  async exchangeCode(code) {
    const body = this.getCodeRequestBody(code);
    const url = this.settings.accessTokenUri;
    return this.requestToken(url, body);
  }

  /**
   * Returns a body value for the code exchange request.
   * @param {string} code Authorization code value returned by the authorization server.
   * @return {string} Request body.
   */
  getCodeRequestBody(code) {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('client_id', settings.clientId);
    if (settings.redirectUri) {
      params.set('redirect_uri', settings.redirectUri);
    }
    params.set('code', code);
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    } else {
      params.set('client_secret', '');
    }
    if (settings.pkce) {
      params.set('code_verifier', this[codeVerifierValue]);
    }
    return params.toString();
  }

  /**
   * Requests for token from the authorization server for `code`, `password`, `client_credentials` and custom grant types.
   *
   * @param {String} url Base URI of the endpoint. Custom properties will be applied to the final URL.
   * @param {String} body Generated body for given type. Custom properties will be applied to the final body.
   * @return {Promise<TokenInfo>} Promise resolved to the response string.
   */
  async requestToken(url, body) {
    const urlInstance = new URL(url);
    const { settings } = this;
    let headers = {
      'content-type': 'application/x-www-form-urlencoded',
    };
    if (settings.customData) {
      if (settings.customData.token) {
        applyCustomSettingsQuery(urlInstance, settings.customData.token);
      }
      body = applyCustomSettingsBody(body, settings.customData);
      headers = applyCustomSettingsHeaders(headers, settings.customData);
    }
    const init = /** @type RequestInit */ ({
      headers,
      body,
      method: 'POST',
      cache: 'no-cache',
    });
    const response = await fetch(urlInstance.toString(), init);
    const { status } = response;
    let responseBody;
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = 'No response has been recorded';
    }
    if (status === 404) {
      throw new Error('Authorization URI is invalid. Received status 404.');
    }
    if (status >= 400 && status < 500) {
      throw new Error(`Client error: ${responseBody}`)
    }
    if (status >= 500) {
      throw new Error(`Authorization server error. Response code is: ${status}`)
    }
    return this[processCodeResponse](responseBody, response.headers.get('content-type'));
  }

  /**
   * Processes code response body and produces map of values.
   *
   * @param {string} body Body received in the response.
   * @param {string} mime Response content type.
   * @return {TokenInfo} Response as an object.
   * @throws {Error} Exception when the body is invalid.
   */
  [processCodeResponse](body, mime) {
    if (!body) {
      throw new Error('Code response body is empty.');
    }
    let tokenInfo = {};
    if (mime.includes('json')) {
      const info = JSON.parse(body);
      Object.keys(info).forEach((name) => {
        if (name.includes('_') || name.includes('-')) {
          name = camel(name);
        }
        tokenInfo[name] = info[name];
      });
    } else {
      tokenInfo = {};
      const params = new URLSearchParams(body);
      params.forEach((value, key) => {
        let name = key;
        if (key.includes('_') || key.includes('-')) {
          name = camel(key);
        }
        tokenInfo[name] = value;
      });
    }
    if (tokenInfo.error) {
      throw new CodeError(tokenInfo.error, tokenInfo.errorDescription);
    }
    const expiresIn = Number(tokenInfo.expiresIn);
    const scope = this[computeTokenInfoScopes](tokenInfo.scope);
    const result = /** @type TokenInfo */ ({
      ...tokenInfo,
      expiresIn,
      scope,
      expiresAt: undefined,
      expiresAssumed: false,
    });
    return this[computeExpires](result);
  }

  /**
   * A handler for the error that happened during code exchange.
   * @param {Error} e
   */
  [handleTokenCodeError](e) {
    if (e instanceof CodeError) {
      this[reportOAuthError](...this[createErrorParams](e.message, e.code));
    } else {
      this[reportOAuthError](`Couldn't connect to the server. ${e.message}`, 'request_error');
    }
  }

  /**
   * Requests a token for `client_credentials` request type.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return {Promise<void>} Promise resolved to a token info object.
   */
  async [authorizeClientCredentials]() {
    const { settings } = this;
    const url = settings.accessTokenUri;
    const body = this.getClientCredentialsBody();
    try {
      const tokenInfo = await this.requestToken(url, body);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause);
    }
  }

  /**
   * Generates a payload message for client credentials.
   *
   * @return {string} Message body as defined in OAuth2 spec.
   */
  getClientCredentialsBody() {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', 'client_credentials');
    if (settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    return params.toString();
  }

  /**
   * Requests a token for `client_credentials` request type.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return {Promise<void>} Promise resolved to a token info object.
   */
  async [authorizePassword]() {
    const { settings } = this;
    const url = settings.accessTokenUri;
    const body = this.getPasswordBody();
    try {
      const tokenInfo = await this.requestToken(url, body);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause);
    }
  }

  /**
   * Generates a payload message for password authorization.
   *
   * @return {string} Message body as defined in OAuth2 spec.
   */
  getPasswordBody() {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', 'password');
    params.set('username', settings.username);
    params.set('password', settings.password);
    if (settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    return params.toString();
  }

  /**
   * Performs authorization on custom grant type.
   * This extension is described in OAuth 2.0 spec.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return {Promise<void>} Promise resolved when the request finish.
   */
  async [authorizeCustomGrant]() {
    const { settings } = this;
    const url = settings.accessTokenUri;
    const body = this.getCustomGrantBody();
    try {
      const tokenInfo = await this.requestToken(url, body);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause);
    }
  }

  /**
   * Generates a payload message for the custom grant.
   *
   * @return {string} Message body as defined in OAuth2 spec.
   */
  getCustomGrantBody() {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', settings.grantType);
    if (settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    if (settings.redirectUri) {
      params.set('redirect_uri', settings.redirectUri);
    }
    if (settings.username) {
      params.set('username', settings.username);
    }
    if (settings.password) {
      params.set('password', settings.password);
    }
    return params.toString();
  }
}