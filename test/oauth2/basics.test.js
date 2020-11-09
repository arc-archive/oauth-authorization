/* eslint-disable import/no-unresolved */
/* eslint-disable no-script-url */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { 
  OAuth2Authorization, 
  authorize, 
  reportOAuthError, 
  rejectFunction, 
  resolveFunction,
  createErrorParams,
  computeExpires,
  popupUnloadHandler,
  tokenResponse,
  codeValue,
  processTokenResponse,
  processPopupRawData,
} from '../../src/OAuth2Authorization.js';

describe('OAuth2', () => {
  describe('Basic tests', () => {
    describe('constructor()', () => {
      it('throws when no settings', () => {
        let thrown = false;
        try {
          // eslint-disable-next-line no-new
          new OAuth2Authorization(undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('sets the settings object', () => {
        const settings = { clientId: 'test' };
        const auth = new OAuth2Authorization(settings);
        assert.deepEqual(auth.settings, settings);
      });

      it('sets default processing options', () => {
        const settings = { clientId: 'test' };
        const auth = new OAuth2Authorization(settings);
        assert.equal(auth.options.popupPullTimeout, 50, 'popupPullTimeout is set');
        assert.isTrue(auth.options.messageTarget === window, 'messageTarget is set');
      });

      it('sets passed options', () => {
        const target = document.createElement('div');
        const settings = { clientId: 'test' };
        const options = { popupPullTimeout: 100, messageTarget: target };

        const auth = new OAuth2Authorization(settings, options);
        assert.deepEqual(auth.options, options);
      });
    });

    describe('checkConfig()', () => {
      // The check sanity is tested with the utils class tests,
      // this only checks whether the tests are called.
      it('throws when accessTokenUri is invalid', () => {
        const settings = { accessTokenUri: 'javascript://' };
        const auth = new OAuth2Authorization(settings);
        assert.throws(() => {
          auth.checkConfig();
        });
      });
    });
  
    describe('[reportOAuthError]()', () => {
      it('rejects the main promise', async () => {
        const auth = new OAuth2Authorization({});
        auth[authorize] = () => {};
        const promise = auth.authorize();
        auth[reportOAuthError]('test-message', 'test-code');
        let err;
        try {
          await promise;
        } catch (e) {
          err = e;
        }
        assert.ok(err, 'error is thrown');
        assert.equal(err.message, 'test-message', 'message');
        assert.equal(err.code, 'test-code', 'code is set');
        assert.typeOf(err.state, 'string', 'state is set');
        assert.isTrue(err.interactive, 'interactive is set');
      });

      it('calls clearObservers()', async () => {
        const auth = new OAuth2Authorization({});
        auth[authorize] = () => {};
        const promise = auth.authorize();
        const spy = sinon.spy(auth, 'clearObservers');
        auth[reportOAuthError]('test-message', 'test-code');
        try {
          await promise;
        } catch (e) {
          // ...
        }
        assert.isTrue(spy.called)
      });

      it('does nothing when no reject function', async () => {
        const auth = new OAuth2Authorization({});
        auth[resolveFunction] = () => {};
        auth[reportOAuthError]('test-message', 'test-code');
        assert.ok(auth[resolveFunction]);
      });

      it('clears the [resolveFunction]', async () => {
        const auth = new OAuth2Authorization({});
        auth[resolveFunction] = () => {};
        auth[rejectFunction] = () => {};
        auth[reportOAuthError]('test-message', 'test-code');
        assert.isUndefined(auth[resolveFunction]);
      });

      it('clears the [rejectFunction]', async () => {
        const auth = new OAuth2Authorization({});
        auth[resolveFunction] = () => {};
        auth[rejectFunction] = () => {};
        auth[reportOAuthError]('test-message', 'test-code');
        assert.isUndefined(auth[rejectFunction]);
      });
    });
  
    describe('constructPopupUrl()', () => {
      const baseSettings = {
        authorizationUri: 'http://test.com/auth',
        clientId: 'test client id',
        redirectUri: 'http://test.com/redirect',
        scopes: ['one', 'two'],
        includeGrantedScopes: true,
        loginHint: 'email@domain.com',
        interactive: false
      };
      const responseType = 'implicit';

      it('uses the authorization url', () => {
        const cnf = { ...baseSettings, responseType };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.isTrue(result.startsWith('http://test.com/auth?'));
      });
  
      it('sets the response_type property', () => {
        const cnf = { ...baseSettings, responseType };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.isTrue(result.includes('response_type=token&'));
      });
  
      it('sets the client_id property', () => {
        const cnf = { ...baseSettings, responseType };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.isTrue(result.includes('client_id=test%20client%20id&'));
      });
  
      it('sets the redirect_uri property', () => {
        const cnf = { ...baseSettings, responseType };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.isTrue(result.includes('redirect_uri=http%3A%2F%2Ftest.com%2Fredirect'));
      });
  
      it('sets the scopes property', () => {
        const cnf = { ...baseSettings, responseType };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.notEqual(result.indexOf('scope=one%20two'), -1);
      });
  
      it('sets state property', () => {
        const cnf = { ...baseSettings, responseType, state: 'test state' };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.notEqual(result.indexOf('state=test%20state'), -1);
      });
  
      it('sets Google OAuth 2 properties.', () => {
        const cnf = { ...baseSettings, responseType };
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.notEqual(result.indexOf('include_granted_scopes=true'), -1);
        assert.notEqual(result.indexOf('prompt=none'), -1);
        assert.notEqual(result.indexOf('login_hint=email%40domain.com'), -1);
      });
  
      it('skips the redirect_uri if not set', () => {
        const cnf = { ...baseSettings, responseType };
        cnf.redirectUri = undefined;
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.equal(result.indexOf('redirect_uri='), -1);
      });
  
      it('skips the scope if not set', () => {
        const cnf = { ...baseSettings, responseType };
        cnf.scopes = undefined;
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.equal(result.indexOf('scope='), -1);
      });
  
      it('skips the include_granted_scopes if not set', () => {
        const cnf = { ...baseSettings, responseType };
        cnf.includeGrantedScopes = undefined;
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.equal(result.indexOf('include_granted_scopes='), -1);
      });
  
      it('skips the prompt if not set', () => {
        const cnf = { ...baseSettings, responseType };
        cnf.interactive = undefined;
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.equal(result.indexOf('prompt='), -1);
      });
  
      it('skips the login_hint if not set', () => {
        const cnf = { ...baseSettings, responseType };
        cnf.loginHint = undefined;
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.equal(result.indexOf('login_hint='), -1);
      });
  
      it('do not inserts "?" when auth url already contains it', () => {
        const cnf = { ...baseSettings, responseType };
        cnf.authorizationUri = 'http://test.com/auth?custom=value';
        const auth = new OAuth2Authorization(cnf);
        const result = auth.constructPopupUrl();
        assert.equal(result.indexOf('http://test.com/auth?custom=value&response_type'), 0);
      });
    });
  
    describe('getCodeRequestBody()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
        redirectUri: 'https://auth.api.com/oauth',
        clientSecret: 'client secret',
      });
      const code = 'my code';

      it('has the grant_type', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCodeRequestBody(code);
        assert.include(result, 'grant_type=authorization_code&');
      });

      it('has the client_id', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCodeRequestBody(code);
        assert.include(result, 'client_id=test+client+id&');
      });

      it('has the redirect_uri', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCodeRequestBody(code);
        assert.include(result, 'redirect_uri=https%3A%2F%2Fauth.api.com%2Foauth&');
      });

      it('has the code', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCodeRequestBody(code);
        assert.include(result, 'code=my+code&');
      });

      it('has the client_secret', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCodeRequestBody(code);
        assert.include(result, 'client_secret=client+secret');
      });

      it('ignores the redirect_uri when not set', () => {
        const config = { ...baseSettings };
        delete config.redirectUri;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCodeRequestBody(code);
        assert.isFalse(result.includes('redirect_uri'));
      });

      it('sets empty client_secret when not set', () => {
        const config = { ...baseSettings };
        delete config.clientSecret;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCodeRequestBody(code);
        assert.isTrue(result.endsWith('client_secret='));
      });
    });

    describe('getClientCredentialsBody()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
        scopes: ['scope1', 'scope2'],
        clientSecret: 'client secret',
      });

      it('has the grant_type', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getClientCredentialsBody();
        assert.include(result, 'grant_type=client_credentials&');
      });

      it('has the client_id', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getClientCredentialsBody();
        assert.include(result, 'client_id=test+client+id&');
      });

      it('has the client_secret', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getClientCredentialsBody();
        assert.include(result, 'client_secret=client+secret');
      });

      it('has the scope', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getClientCredentialsBody();
        assert.include(result, 'scope=scope1+scope2');
      });

      it('ignores the client_secret when not set', () => {
        const config = { ...baseSettings };
        delete config.clientSecret;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getClientCredentialsBody();
        assert.isFalse(result.includes('client_secret'));
      });

      it('ignores the scope when not set', () => {
        const config = { ...baseSettings };
        delete config.scopes;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getClientCredentialsBody();
        assert.isFalse(result.includes('scope='));
      });
    });

    describe('getPasswordBody()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
        scopes: ['scope1', 'scope2'],
        username: 'uname',
        password: 'passwd',
      });

      it('has the grant_type', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getPasswordBody();
        assert.include(result, 'grant_type=password&');
      });

      it('has the username', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getPasswordBody();
        assert.include(result, 'username=uname');
      });

      it('has the password', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getPasswordBody();
        assert.include(result, 'password=passwd');
      });

      it('has the client_id', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getPasswordBody();
        assert.include(result, 'client_id=test+client+id&');
      });

      it('has the scope', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getPasswordBody();
        assert.include(result, 'scope=scope1+scope2');
      });

      it('ignores the client_id when not set', () => {
        const config = { ...baseSettings };
        delete config.clientId;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getPasswordBody();
        assert.isFalse(result.includes('client_id'));
      });

      it('ignores the scope when not set', () => {
        const config = { ...baseSettings };
        delete config.scopes;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getPasswordBody();
        assert.isFalse(result.includes('scope='));
      });
    });

    describe('getCustomGrantBody()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
        scopes: ['scope1', 'scope2'],
        username: 'uname',
        password: 'passwd',
        clientSecret: 'client secret',
        redirectUri: 'https://auth.api.com/oauth',
        responseType: 'custom',
      });

      it('has the grant_type', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'grant_type=custom&');
      });

      it('has the username', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'username=uname');
      });

      it('ignores the username when not set', () => {
        const config = { ...baseSettings };
        delete config.username;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCustomGrantBody();
        assert.isFalse(result.includes('username'));
      });

      it('has the password', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'password=passwd');
      });

      it('ignores the password when not set', () => {
        const config = { ...baseSettings };
        delete config.password;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCustomGrantBody();
        assert.isFalse(result.includes('password'));
      });

      it('has the client_id', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'client_id=test+client+id&');
      });

      it('ignores the client_id when not set', () => {
        const config = { ...baseSettings };
        delete config.clientId;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCustomGrantBody();
        assert.isFalse(result.includes('client_id'));
      });

      it('has the scope', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'scope=scope1+scope2');
      });

      it('ignores the scope when not set', () => {
        const config = { ...baseSettings };
        delete config.scopes;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCustomGrantBody();
        assert.isFalse(result.includes('scope='));
      });

      it('has the redirect_uri', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'redirect_uri=https%3A%2F%2Fauth.api.com%2Foauth&');
      });

      it('ignores the redirect_uri when not set', () => {
        const config = { ...baseSettings };
        delete config.redirectUri;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCustomGrantBody();
        assert.isFalse(result.includes('redirect_uri'));
      });
    
      it('has the client_secret', () => {
        const auth  = new OAuth2Authorization(baseSettings);
        const result = auth.getCustomGrantBody();
        assert.include(result, 'client_secret=client+secret');
      });

      it('ignores the client_secret when not set', () => {
        const config = { ...baseSettings };
        delete config.clientSecret;
        const auth  = new OAuth2Authorization(config);
        const result = auth.getCustomGrantBody();
        assert.isFalse(result.includes('client_secret'));
      });
    });
  
    describe('[createErrorParams]()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
      });

      let client = /** @type OAuth2Authorization */ (null);
      beforeEach(() => {
        client = new OAuth2Authorization(baseSettings)
      });

      it('returns passed code', () => {
        const result = client[createErrorParams]('my-code');
        assert.equal(result[1], 'my-code');
      });

      it('returns default message', () => {
        const result = client[createErrorParams]('my-code');
        assert.equal(result[0], 'Unknown error');
      });

      it('returns passed message', () => {
        const result = client[createErrorParams]('my-code', 'a message');
        assert.equal(result[0], 'a message');
      });

      [
        ['interaction_required', 'The request requires user interaction.'],
        ['invalid_request', 'The request is missing a required parameter.'],
        ['invalid_client', 'Client authentication failed.'],
        ['invalid_grant', 'The provided authorization grant or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.'],
        ['unauthorized_client', 'The authenticated client is not authorized to use this authorization grant type.'],
        ['unsupported_grant_type', 'The authorization grant type is not supported by the authorization server.'],
        ['invalid_scope', 'The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.'],
      ].forEach(([code, message]) => {
        it(`returns message for the ${code} code`, () => {
          const result = client[createErrorParams](code);
          assert.equal(result[0], message);
        });
      });
    });

    describe('[computeExpires]()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
      });

      const baseToken = Object.freeze({
        accessToken: 'abc',
        tokenType: 'bearer',
        expiresIn: 12,
        expiresAt: undefined,
        expiresAssumed: false,
        state: '123',
      });

      let client = /** @type OAuth2Authorization */ (null);
      beforeEach(() => {
        client = new OAuth2Authorization(baseSettings)
      });

      it('returns a copy', () => {
        const result = client[computeExpires](baseToken);
        assert.isFalse(result === baseToken);
      });

      it('sets expiresAt', () => {
        const result = client[computeExpires](baseToken);
        assert.typeOf(result.expiresAt, 'number');
      });

      it('adds default expiresIn', () => {
        const info = { ...baseToken };
        delete info.expiresIn;
        const result = client[computeExpires](info);
        assert.equal(result.expiresIn, 3600);
      });

      it('fixes NaN expiresIn', () => {
        const info = { ...baseToken };
        info.expiresIn = Number('nan');
        const result = client[computeExpires](info);
        assert.equal(result.expiresIn, 3600);
      });
    });
  
    describe('[popupUnloadHandler]()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
        responseType: 'authorization_code',
      });

      it('reports the error', () => {
        const cnf = { ...baseSettings };
        cnf.responseType = 'implicit';
        const client = new OAuth2Authorization(cnf);
        client[rejectFunction] = () => {};
        const spy = sinon.spy(client, reportOAuthError);
        client[popupUnloadHandler]();
        assert.isTrue(spy.called);
      });

      it('ignores when there is [tokenResponse]', () => {
        const client = new OAuth2Authorization(baseSettings);
        client[rejectFunction] = () => {};
        // @ts-ignore
        client[tokenResponse] = {};
        const spy = sinon.spy(client, reportOAuthError);
        client[popupUnloadHandler]();
        assert.isFalse(spy.called);
      });

      it('ignores when grant type is code and has [codeValue]', () => {
        const client = new OAuth2Authorization(baseSettings);
        client[rejectFunction] = () => {};
        client[codeValue] = 'test';
        const spy = sinon.spy(client, reportOAuthError);
        client[popupUnloadHandler]();
        assert.isFalse(spy.called);
      });

      it('ignores when the promise is already resolved', () => {
        const client = new OAuth2Authorization(baseSettings);
        const spy = sinon.spy(client, reportOAuthError);
        client[popupUnloadHandler]();
        assert.isFalse(spy.called);
      });
    });

    describe('[processPopupRawData]()', () => {
      const baseSettings = Object.freeze({
        clientId: 'test client id',
      });

      it('calls [processTokenResponse]', () => {
        const client = new OAuth2Authorization(baseSettings);
        client[rejectFunction] = () => {};
        const spy = sinon.spy(client, processTokenResponse);
        client[processPopupRawData]('access_token=b');
        assert.isTrue(spy.called);
      });

      it('ignores when no parameters', () => {
        const client = new OAuth2Authorization(baseSettings);
        client[rejectFunction] = () => {};
        const spy = sinon.spy(client, processTokenResponse);
        client[processPopupRawData]('');
        assert.isFalse(spy.called);
      });
    });
  });
});