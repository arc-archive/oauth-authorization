/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
function noop() {}
/**
The `<outh2-authorization>` performs an OAuth2 requests to get a token for given settings.

@customElement
@memberof LogicElements
*/
export class OAuth2Authorization extends HTMLElement {
  /**
   * @return {Object} A full data returned by the authorization endpoint.
   */
  get tokenInfo() {
    return this._tokenInfo;
  }

  constructor() {
    super();
    this._frameLoadErrorHandler = this._frameLoadErrorHandler.bind(this);
    this._frameLoadHandler = this._frameLoadHandler.bind(this);
    this._tokenRequestedHandler = this._tokenRequestedHandler.bind(this);
    this._popupMessageHandler = this._popupMessageHandler.bind(this);
    this._popupObserver = this._popupObserver.bind(this);
  }

  connectedCallback() {
    window.addEventListener('oauth2-token-requested', this._tokenRequestedHandler);
    window.addEventListener('message', this._popupMessageHandler);
    this.setAttribute('aria-hidden', 'true');
  }

  disconnectedCallback() {
    window.removeEventListener('oauth2-token-requested', this._tokenRequestedHandler);
    window.removeEventListener('message', this._popupMessageHandler);
  }
  /**
   * Clears the state of the element.
   */
  clear() {
    this._state = undefined;
    this._settings = undefined;
    this._cleanupFrame();
    this._cleanupPopup();
  }
  /**
   * Clean up popup reference and closes the window if not yet closed.
   */
  _cleanupPopup() {
    if (this._popup) {
      if (!this._popup.closed) {
        this._popup.close();
      }
      this._popup = undefined;
    }
  }
  /**
   * Handler for the `oauth2-token-requested` custom event.
   *
   * @param {CustomEvent} e
   */
  _tokenRequestedHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    this.authorize(e.detail);
  }
  /**
   * Authorize the user using provided settings.
   *
   * @param {Object<String, String>} settings Map of authorization settings.
   * - type {String} Authorization grant type. Can be `implicit`,
   * `authorization_code`, `client_credentials`, `password` or custom value
   * as OAuth 2.0 allows extensions to grant type.
   *
   * NOTE:
   * For authorization_code and any other grant type that may receive a code
   * and exchange it for an access token (e.g. refresh_token), the settings object may have a property
   * "overrideExchangeCodeFlow" with a boolean value (true/false).
   *
   * The "overrideExchangeCodeFlow" property is a flag indicating that the developer wants to handle
   * exchanging the code for the token instead of having the module do it.
   *
   * If "overrideExchangeCodeFlow" is set to true for the authorization_code and refresh_token grant types,
   * we dispatch an "oauth2-code-response" event with the auth code.
   *
   * The user of this module should listen for this event and exchange the token for an access token on their end.
   *
   * This allows client-side apps to exchange the auth code with their backend/server for an access token
   * since CORS isn't enabled for the /token endpoint.
   */
  authorize(settings) {
    this._tokenInfo = undefined;
    this._type = settings.type;
    this._state = settings.state || this.randomString(6);
    this._settings = settings;
    this._errored = false;
    this._overrideExchangeCodeFlow = settings.overrideExchangeCodeFlow;

    try {
      this._sanityCheck(settings);
    } catch (e) {
      this._dispatchError({
        message: e.message,
        code: 'oauth_error',
        state: this._state,
        interactive: settings.interactive
      });
      throw e;
    }

    switch (settings.type) {
      case 'implicit':
        this._authorize(this._constructPopupUrl(settings, 'token'), settings);
        break;
      case 'authorization_code':
        this._authorize(this._constructPopupUrl(settings, 'code'), settings);
        break;
      case 'refresh_token':
        this._authorize(this._constructPopupUrl(settings, 'code'), settings);
        break;
      case 'client_credentials':
        this.authorizeClientCredentials(settings).catch(() => {});
        break;
      case 'password':
        this.authorizePassword(settings).catch(() => {});
        break;
      default:
        this.authorizeCustomGrant(settings).catch(() => {});
    }
  }
  /**
   * Checks if basic configuration of the OAuth 2 request is valid an can proceed
   * with authentication.
   * @param {Object} settings authorization settings
   * @throws {Error} When setttings are not valid
   */
  _sanityCheck(settings) {
    if (settings.type === 'implicit' || settings.type === 'authorization_code') {
      try {
        this._checkUrl(settings.authorizationUri);
      } catch (e) {
        throw new Error(`authorizationUri: ${e.message}`);
      }
      if (settings.accessTokenUri) {
        try {
          this._checkUrl(settings.accessTokenUri);
        } catch (e) {
          throw new Error(`accessTokenUri: ${e.message}`);
        }
      }
    } else if (settings.accessTokenUri) {
      if (settings.accessTokenUri) {
        try {
          this._checkUrl(settings.accessTokenUri);
        } catch (e) {
          throw new Error(`accessTokenUri: ${e.message}`);
        }
      }
    }
  }
  /**
   * Checks if the URL has valid scheme for OAuth flow.
   * @param {String} url The url value to test
   * @throws {TypeError} When passed value is not set, empty, or not a string
   * @throws {Error} When passed value is not a valid URL for OAuth 2 flow
   */
  _checkUrl(url) {
    if (!url) {
      throw new TypeError('the value is missing');
    }
    if (typeof url !== 'string') {
      throw new TypeError('the value is not a string');
    }
    if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
      throw new Error('the value has invalid scheme');
    }
  }

  /**
   * Authorizes the user in the OAuth authorization endpoint.
   * By default it authorizes the user using a popup that displays
   * authorization screen. When `interactive` property is set to `false`
   * on the `settings` object then it will quietly create an iframe
   * and try to receive the token.
   *
   * @param {String} authUrl Complete authorization url
   * @param {Object} settings Passed user settings
   */
  _authorize(authUrl, settings) {
    this._settings = settings;
    this._errored = false;
    if (settings.interactive === false) {
      this._authorizeTokenNonInteractive(authUrl);
    } else {
      this._authorizePopup(authUrl);
    }
  }
  /**
   * Creates and opens auth popup.
   *
   * @param {String} url Complete authorization url
   */
  _authorizePopup(url) {
    const op = 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,width=800,height=600';
    this._popup = window.open(url, 'oauth-window', op);
    if (!this._popup) {
      // popup blocked.
      this._dispatchError({
        message: 'Authorization popup is being blocked.',
        code: 'popup_blocked',
        state: this._state,
        interactive: this._settings.interactive
      });
      return;
    }
    this._popup.window.focus();
    this._observePopupState();
  }
  /**
   * Tries to Authorize the user in a non interactive way.
   * This method always result in a success response. When there's an error or
   * user is not logged in then the response won't contain auth token info.
   *
   * @param {String} url Complete authorization url
   */
  _authorizeTokenNonInteractive(url) {
    const iframe = document.createElement('iframe');
    iframe.style.border = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.overflow = 'hidden';
    iframe.addEventListener('error', this._frameLoadErrorHandler);
    iframe.addEventListener('load', this._frameLoadHandler);
    iframe.id = 'oauth2-authorization-frame';
    iframe.setAttribute('data-owner', 'arc-oauth-authorization');
    document.body.appendChild(iframe);
    iframe.src = url;
    this._iframe = iframe;
  }
  /**
   * Removes the frame and any event listeners attached to it.
   */
  _cleanupFrame() {
    if (!this._iframe) {
      return;
    }
    this._iframe.removeEventListener('error', this._frameLoadErrorHandler);
    this._iframe.removeEventListener('load', this._frameLoadHandler);
    try {
      document.body.removeChild(this._iframe);
    } catch (_) {
      noop();
    }
    this._iframe = undefined;
  }
  /**
   * Handler for `error` event dispatched by oauth iframe.
   */
  _frameLoadErrorHandler() {
    if (this._errored) {
      return;
    }
    this._dispatchResponse({
      interactive: false,
      code: 'iframe_load_error',
      state: this._state
    });
    this.clear();
  }
  /**
   * Handler for iframe `load` event.
   */
  _frameLoadHandler() {
    if (this.__frameLoadInfo) {
      return;
    }
    this.__frameLoadInfo = true;
    this.__frameLoadTimeout = setTimeout(() => {
      if (!this.tokenInfo && !this._errored) {
        this._dispatchResponse({
          interactive: false,
          code: 'not_authorized',
          state: this._state
        });
      }
      this.clear();
      this.__frameLoadInfo = false;
    }, 700);
  }

  // Observer if the popup has been closed befor the data has been received.
  _observePopupState() {
    this.__popupCheckInterval = setInterval(this._popupObserver, 250);
  }
  /**
   * Function called in the interval.
   * Observer popup state and calls `_beforePopupUnloadHandler()`
   * when popup is no longer opened.
   */
  _popupObserver() {
    if (!this._popup || this._popup.closed) {
      clearInterval(this.__popupCheckInterval);
      this.__popupCheckInterval = undefined;
      this._beforePopupUnloadHandler();
    }
  }
  /**
   * Browser or server flow: open the initial popup.
   * @param {Object} settings Settings passed to the authorize function.
   * @param {String} type `token` or `code`
   * @return {String} Full URL for the endpoint.
   */
  _constructPopupUrl(settings, type) {
    let url = settings.authorizationUri;
    if (url.indexOf('?') === -1) {
      url += '?';
    } else {
      url += '&';
    }
    url += 'response_type=' + type;
    url += '&client_id=' + encodeURIComponent(settings.clientId || '');
    if (settings.redirectUri) {
      url += '&redirect_uri=' + encodeURIComponent(settings.redirectUri);
    }
    if (settings.scopes && settings.scopes.length) {
      url += '&scope=' + this._computeScope(settings.scopes);
    }
    url += '&state=' + encodeURIComponent(this._state);
    if (settings.includeGrantedScopes) {
      url += '&include_granted_scopes=true';
    }
    if (settings.loginHint) {
      url += '&login_hint=' + encodeURIComponent(settings.loginHint);
    }
    if (settings.interactive === false) {
      url += '&prompt=none';
    }
    // custom query parameters
    if (settings.customData) {
      const key = type === 'token' ? 'auth' : 'token';
      const cs = settings.customData[key];
      if (cs) {
        url = this._applyCustomSettingsQuery(url, cs);
      }
    }
    return url;
  }
  /**
   * Computes `scope` URL parameter from scopes array.
   *
   * @param {Array<String>} scopes List of scopes to use with the request.
   * @return {String} Computed scope value.
   */
  _computeScope(scopes) {
    if (!scopes) {
      return '';
    }
    const scope = scopes.join(' ');
    return encodeURIComponent(scope);
  }
  /**
   * Listens for a message from the popup.
   * @param {Event} e
   */
  _popupMessageHandler(e) {
    if (!this._popup && !this._iframe) {
      return;
    }
    this._processPopupData(e);
  }

  _processPopupData(e) {
    const tokenInfo = e.data;
    const dontProcess = !this._overrideExchangeCodeFlow && (!tokenInfo || !tokenInfo.oauth2response);
    if (dontProcess) {
      // Possibly a message in the authorization info, not the popup.
      return;
    }
    if (!this._settings) {
      this._settings = {};
    }
    if (tokenInfo.state !== this._state) {
      this._dispatchError({
        message: 'Invalid state returned by the OAuth server.',
        code: 'invalid_state',
        state: this._state,
        serverState: tokenInfo.state,
        interactive: this._settings.interactive
      });
      this._errored = true;
      this._clearIframeTimeout();
      this.clear();
    } else if ('error' in tokenInfo) {
      this._dispatchError({
        message: tokenInfo.errorDescription || 'The request is invalid.',
        code: tokenInfo.error || 'oauth_error',
        state: this._state,
        interactive: this._settings.interactive
      });
      this._errored = true;
      this._clearIframeTimeout();
      this.clear();
    } else if (this._type === 'implicit') {
      this._handleTokenInfo(tokenInfo);
      this.clear();
    } else if (this._type === 'authorization_code' || this._type === 'refresh_token') {
      /**
       * For the authorization_code flow, the developer (user of the oauth2-authorization lib)
       * can pass a setting to override the code exchange flow. In this scenario,
       * we dispatch an event with the auth code instead of exchanging the code for an access token.
       * See {@link authorize()} comment for more details.
       */
      if (this._overrideExchangeCodeFlow) {
        this._dispatchCodeResponse(tokenInfo);
      } else {
        this._exchangeCodeValue = tokenInfo.code;
        this._exchangeCode(tokenInfo.code).catch(() => {});
        this._clearIframeTimeout();
      }
    }
  }

  _clearIframeTimeout() {
    if (this.__frameLoadTimeout) {
      clearTimeout(this.__frameLoadTimeout);
      this.__frameLoadTimeout = undefined;
    }
  }
  // http://stackoverflow.com/a/10727155/1127848
  randomString(len) {
    return Math.round(Math.pow(36, len + 1) - Math.random() * Math.pow(36, len))
      .toString(36)
      .slice(1);
  }
  /**
   * Popup is closed by this element so if data is not yet set it means that the
   * user closed the window - probably some error.
   * The UI state is reset if needed.
   */
  _beforePopupUnloadHandler() {
    if (this.tokenInfo || (this._type === 'authorization_code' && this._exchangeCodeValue)) {
      return;
    }
    const settings = this._settings || {};
    this._dispatchError({
      message: 'No response has been recorded.',
      code: 'no_response',
      state: this._state,
      interactive: settings.interactive
    });
    this.clear();
  }
  /**
   * Exchange code for token.
   * One note here. This element is intened to use with applications that test endpoints.
   * It asks user to provide `client_secret` parameter and it is not a security concern to him.
   * However, this method **can't be used in regular web applications** because it is a
   * security risk and whole OAuth token exchange can be compromised. Secrets should never be
   * present on client side.
   *
   * @param {String} code Returned code from the authorization endpoint.
   * @return {Promise} Promise with token information.
   */
  async _exchangeCode(code) {
    const url = this._settings.accessTokenUri;
    const body = this._getCodeEchangeBody(this._settings, code);
    try {
      const tokenInfo = await this._requestToken(url, body, this._settings);
      const result = this._handleTokenInfo(tokenInfo);
      this.clear();
      return result;
    } catch (cause) {
      this._handleTokenCodeError(cause);
    }
  }
  /**
   * Returns a body value for the code exchange request.
   * @param {Object} settings Initial settings object.
   * @param {String} code Authorization code value returned by the authorization
   * server.
   * @return {String} Request body.
   */
  _getCodeEchangeBody(settings, code) {
    let url = 'grant_type=authorization_code';
    url += '&client_id=' + encodeURIComponent(settings.clientId);
    if (settings.redirectUri) {
      url += '&redirect_uri=' + encodeURIComponent(settings.redirectUri);
    }
    url += '&code=' + encodeURIComponent(code);
    if (settings.clientSecret) {
      url += '&client_secret=' + encodeURIComponent(settings.clientSecret);
    } else {
      url += '&client_secret=';
    }
    return url;
  }
  /**
   * Requests for token from the authorization server for `code`, `password`,
   * `client_credentials` and custom grant types.
   *
   * @param {String} url Base URI of the endpoint. Custom properties will be
   * applied to the final URL.
   * @param {String} body Generated body for given type. Custom properties will
   * be applied to the final body.
   * @param {Object} settings Settings object passed to the `authorize()` function
   * @return {Promise} Promise resolved to the response string.
   */
  _requestToken(url, body, settings) {
    if (settings.customData) {
      const cs = settings.customData.token;
      if (cs) {
        url = this._applyCustomSettingsQuery(url, cs);
      }
      body = this._applyCustomSettingsBody(body, settings.customData);
    }
    /* global Promise */
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('load', (e) => this._processTokenResponseHandler(e, resolve, reject));
      xhr.addEventListener('error', (e) => this._processTokenResponseErrorHandler(e, reject));
      xhr.open('POST', url);
      xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
      if (settings.customData) {
        this._applyCustomSettingsHeaders(xhr, settings.customData);
      }
      try {
        xhr.send(body);
      } catch (e) {
        reject(new Error('Client request error: ' + e.message));
      }
    });
  }
  /**
   * Handler for the code request load event.
   * Processes the response and either rejects the promise with an error
   * or resolves it to token info object.
   *
   * @param {Event} e XHR load event.
   * @param {Function} resolve Resolve function
   * @param {Function} reject Reject function
   */
  _processTokenResponseHandler(e, resolve, reject) {
    const status = e.target.status;
    const srvResponse = e.target.response;
    if (status === 404) {
      const message = 'Authorization URI is invalid. Received status 404.';
      reject(new Error(message));
      return;
    } else if (status >= 400 && status < 500) {
      const message = 'Client error: ' + srvResponse;
      reject(new Error(message));
      return;
    } else if (status >= 500) {
      const message = 'Authorization server error. Response code is ' + status;
      reject(new Error(message));
      return;
    }
    let tokenInfo;
    try {
      tokenInfo = this._processCodeResponse(srvResponse, e.target.getResponseHeader('content-type'));
    } catch (e) {
      reject(new Error(e.message));
      return;
    }
    resolve(tokenInfo);
  }
  /**
   * Handler for the code request error event.
   * Rejects the promise with error description.
   *
   * @param {Event} e XHR error event
   * @param {Function} reject Promise's reject function.
   */
  _processTokenResponseErrorHandler(e, reject) {
    const status = e.target.status;
    let message = 'The request to the authorization server failed.';
    if (status) {
      message += ' Response code is: ' + status;
    }
    reject(new Error(message));
  }
  /**
   * Processes token request body and produces map of values.
   *
   * @param {String} body Body received in the response.
   * @param {String} contentType Response content type.
   * @return {Object} Response as an object.
   * @throws {Error} Exception when body is invalid.
   */
  _processCodeResponse(body, contentType) {
    if (!body) {
      throw new Error('Code response body is empty.');
    }
    let tokenInfo;
    if (contentType.indexOf('json') !== -1) {
      tokenInfo = JSON.parse(body);
      Object.keys(tokenInfo).forEach((name) => {
        const camelName = this._camel(name);
        if (camelName) {
          tokenInfo[camelName] = tokenInfo[name];
        }
      });
    } else {
      tokenInfo = {};
      body.split('&').forEach((p) => {
        const item = p.split('=');
        const name = item[0];
        const camelName = this._camel(name);
        const value = decodeURIComponent(item[1]);
        tokenInfo[name] = value;
        tokenInfo[camelName] = value;
      });
    }
    return tokenInfo;
  }

  /**
   * Processes token info object when it's ready.
   * Sets `tokenInfo` property, notifies listeners about the response
   * and cleans up.
   *
   * @param {Object} tokenInfo Token info returned from the server.
   * @return {Object} The same tokenInfo, used for Promise return value.
   */
  _handleTokenInfo(tokenInfo) {
    this._tokenInfo = tokenInfo;
    tokenInfo.interactive = this._settings.interactive;
    if ('error' in tokenInfo) {
      this._dispatchError({
        message: tokenInfo.errorDescription || 'The request is invalid.',
        code: tokenInfo.error,
        state: this._state,
        interactive: this._settings.interactive
      });
    } else {
      this._dispatchResponse(tokenInfo);
    }
    if (this.__frameLoadTimeout) {
      clearTimeout(this.__frameLoadTimeout);
      this.__frameLoadTimeout = undefined;
    }
    this._settings = undefined;
    this._exchangeCodeValue = undefined;
    return tokenInfo;
  }
  /**
   * Handler fore an error that happened during code exchange.
   * @param {Error} e
   */
  _handleTokenCodeError(e) {
    this._dispatchError({
      message: "Couldn't connect to the server. " + e.message,
      code: 'request_error',
      state: this._state,
      interactive: this._settings.interactive
    });
    this.clear();
    throw e;
  }
  /**
   * Replaces `-` or `_` with camel case.
   * @param {String} name The string to process
   * @return {String|undefined} Camel cased string or `undefined` if not
   * transformed.
   */
  _camel(name) {
    let i = 0;
    let l;
    let changed = false;
    while ((l = name[i])) {
      if ((l === '_' || l === '-') && i + 1 < name.length) {
        name = name.substr(0, i) + name[i + 1].toUpperCase() + name.substr(i + 2);
        changed = true;
      }
      i++;
    }
    return changed ? name : undefined;
  }
  /**
   * Requests a token for `password` request type.
   *
   * @param {Object} settings The same settings as passed to `authorize()`
   * function.
   * @return {Promise} Promise resolved to token info.
   */
  async authorizePassword(settings) {
    this._settings = settings;
    const url = settings.accessTokenUri;
    const body = this._getPasswordBody(settings);
    try {
      const tokenInfo = await this._requestToken(url, body, settings);
      const result = this._handleTokenInfo(tokenInfo);
      this.clear();
      return result;
    } catch (cause) {
      this._handleTokenCodeError(cause);
    }
  }
  /**
   * Generates a payload message for password authorization.
   *
   * @param {Object} settings Settings object passed to the `authorize()`
   * function
   * @return {String} Message body as defined in OAuth2 spec.
   */
  _getPasswordBody(settings) {
    let url = 'grant_type=password';
    url += '&username=' + encodeURIComponent(settings.username);
    url += '&password=' + encodeURIComponent(settings.password);
    if (settings.clientId) {
      url += '&client_id=' + encodeURIComponent(settings.clientId);
    }
    if (settings.scopes && settings.scopes.length) {
      url += '&scope=' + encodeURIComponent(settings.scopes.join(' '));
    }
    return url;
  }
  /**
   * Requests a token for `client_credentials` request type.
   *
   * @param {Object} settings The same settings as passed to `authorize()`
   * function.
   * @return {Promise} Promise resolved to a token info object.
   */
  async authorizeClientCredentials(settings) {
    this._settings = settings;
    const url = settings.accessTokenUri;
    const body = this._getClientCredentialsBody(settings);
    try {
      const tokenInfo = await this._requestToken(url, body, settings);
      const result = this._handleTokenInfo(tokenInfo);
      this.clear();
      return result;
    } catch (cause) {
      this._handleTokenCodeError(cause);
    }
  }
  /**
   * Generates a payload message for client credentials.
   *
   * @param {Object} settings Settings object passed to the `authorize()`
   * function
   * @return {String} Message body as defined in OAuth2 spec.
   */
  _getClientCredentialsBody(settings) {
    let url = 'grant_type=client_credentials';
    if (settings.clientId) {
      url += '&client_id=' + encodeURIComponent(settings.clientId);
    }
    if (settings.clientSecret) {
      url += '&client_secret=' + encodeURIComponent(settings.clientSecret);
    }
    if (settings.scopes && settings.scopes.length) {
      url += '&scope=' + this._computeScope(settings.scopes);
    }
    return url;
  }
  /**
   * Performs authorization on custom grant type.
   * This extension is described in OAuth 2.0 spec.
   *
   * @param {Object} settings Settings object as for `authorize()` function.
   * @return {Promise} Promise resolved to a token info object.
   */
  async authorizeCustomGrant(settings) {
    this._settings = settings;
    const url = settings.accessTokenUri;
    const body = this._getCustomGrantBody(settings);
    try {
      const tokenInfo = await this._requestToken(url, body, settings);
      const result = this._handleTokenInfo(tokenInfo);
      this.clear();
      return result;
    } catch (cause) {
      this._handleTokenCodeError(cause);
    }
  }
  /**
   * Creates a body for custom gran type.
   * It does not assume any parameter to be required.
   * It applies all known OAuth 2.0 parameters and then custom parameters
   *
   * @param {Object} settings
   * @return {String} Request body.
   */
  _getCustomGrantBody(settings) {
    const parts = ['grant_type=' + encodeURIComponent(settings.type)];
    if (settings.clientId) {
      parts[parts.length] = 'client_id=' + encodeURIComponent(settings.clientId);
    }
    if (settings.clientSecret) {
      parts[parts.length] = 'client_secret=' + encodeURIComponent(settings.clientSecret);
    }
    if (settings.scopes && settings.scopes.length) {
      parts[parts.length] = 'scope=' + this._computeScope(settings.scopes);
    }
    if (settings.redirectUri) {
      parts[parts.length] = 'redirect_uri=' + encodeURIComponent(settings.redirectUri);
    }
    if (settings.username) {
      parts[parts.length] = 'username=' + encodeURIComponent(settings.username);
    }
    if (settings.password) {
      parts[parts.length] = 'password=' + encodeURIComponent(settings.password);
    }
    return parts.join('&');
  }
  /**
   * Applies custom properties defined in the OAuth settings object to the URL.
   *
   * @param {String} url Generated URL for an endpoint.
   * @param {?Object} data `customData.[type]` property from the settings object.
   * The type is either `auth` or `token`.
   * @return {String}
   */
  _applyCustomSettingsQuery(url, data) {
    if (!data || !data.parameters) {
      return url;
    }
    url += url.indexOf('?') === -1 ? '?' : '&';
    url += data.parameters
      .map((item) => {
        let value = item.value;
        if (value) {
          value = encodeURIComponent(value);
        }
        return encodeURIComponent(item.name) + '=' + value;
      })
      .join('&');
    return url;
  }
  /**
   * Applies custom headers from the settings object
   *
   * @param {XMLHttpRequest} xhr Instance of the request object.
   * @param {Object} data Value of settings' `customData` property
   */
  _applyCustomSettingsHeaders(xhr, data) {
    if (!data || !data.token || !data.token.headers) {
      return;
    }
    data.token.headers.forEach((item) => {
      try {
        xhr.setRequestHeader(item.name, item.value);
      } catch (e) {
        noop();
      }
    });
  }
  /**
   * Applies custom body properties from the settings to the body value.
   *
   * @param {String} body Already computed body for OAuth request. Custom
   * properties are appended at the end of OAuth string.
   * @param {Object} data Value of settings' `customData` property
   * @return {String} Request body
   */
  _applyCustomSettingsBody(body, data) {
    if (!data || !data.token || !data.token.body) {
      return body;
    }
    body +=
      '&' +
      data.token.body
        .map(function(item) {
          let value = item.value;
          if (value) {
            value = encodeURIComponent(value);
          }
          return encodeURIComponent(item.name) + '=' + value;
        })
        .join('&');
    return body;
  }
  /**
   * Dispatches an error event that propagates through the DOM.
   *
   * @param {Object} detail The detail object.
   */
  _dispatchError(detail) {
    const e = new CustomEvent('oauth2-error', {
      bubbles: true,
      composed: true,
      detail
    });
    this.dispatchEvent(e);
  }
  /**
   * Dispatches an event with the authorization code that propagates through the DOM.
   * Closes the popup once the authorization code has been dispatched.
   *
   * @param {Object} detail The detail object.
   */
  _dispatchCodeResponse(detail) {
    const e = new CustomEvent('oauth2-code-response', {
      bubbles: true,
      composed: true,
      detail
    });
    this.dispatchEvent(e);
    this.clear();
  }
  /**
   * Dispatches an event with the token (e.g. access token) that propagates through the DOM.
   *
   * @param {Object} detail The detail object.
   */
  _dispatchResponse(detail) {
    const e = new CustomEvent('oauth2-token-response', {
      bubbles: true,
      composed: true,
      detail
    });
    this.dispatchEvent(e);
  }
  /**
   * @return {Function} Previously registered handler for `oauth2-error` event
   */
  get ontokenerror() {
    return this['_onoauth2-error'];
  }
  /**
   * Registers a callback function for `oauth2-error` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set ontokenerror(value) {
    this._registerCallback('oauth2-error', value);
  }
  /**
   * @return {Function} Previously registered handler for `oauth2-token-response` event
   */
  get ontokenresponse() {
    return this['_onoauth2-token-response'];
  }
  /**
   * Registers a callback function for `oauth2-token-response` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set ontokenresponse(value) {
    this._registerCallback('oauth2-token-response', value);
  }
  /**
   * Registers an event handler for given type
   * @param {String} eventType Event type (name)
   * @param {Function} value The handler to register
   */
  _registerCallback(eventType, value) {
    const key = `_on${eventType}`;
    if (this[key]) {
      this.removeEventListener(eventType, this[key]);
    }
    if (typeof value !== 'function') {
      this[key] = null;
      return;
    }
    this[key] = value;
    this.addEventListener(eventType, value);
  }
  /**
   * Fired when OAuth2 token has been received.
   * Properties of the `detail` object will contain the response from the authentication server.
   * It will contain the original parameteres but also camel case of the parameters.
   *
   * So for example 'implicit' will be in the response as well as `accessToken` with the same
   * value. The puropse of this is to support JS application that has strict formatting rules
   * and disallow using '_' in property names. Like ARC.
   *
   * @event oauth2-token-response
   */
  /**
   * Fired wne error occurred.
   * An error may occure when `state` parameter of the OAuth2 response is different from
   * the requested one. Another example is when the popup window has been closed before it passed
   * response token. It may happen when the OAuth request was invalid.
   *
   * @event oauth2-error
   * @param {String} message A message that can be displayed to the user.
   * @param {String} code A message code: `invalid_state` - when `state` parameter is different;
   * `no_response` when the popup was closed before sendin token data; `response_parse` - when
   * the response from the code exchange can't be parsed; `request_error` when the request
   * errored by the transport library. Other status codes are defined in
   * [rfc6749](https://tools.ietf.org/html/rfc6749).
   * @param {String} state The `state` parameter either generated by this element
   * when requesting the token or passed to the element from other element.
   */
}
window.customElements.define('oauth2-authorization', OAuth2Authorization);
