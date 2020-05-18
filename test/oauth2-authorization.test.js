import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import '../oauth2-authorization.js';

describe('<oauth2-authorization>', () => {
  async function basicFixture() {
    return await fixture(`<oauth2-authorization></oauth2-authorization>`);
  }

  function noop() {}
  function nooPromise() {
    return Promise.resolve();
  }
  let popupsAllowed = true;

  describe('Basic', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('tokenInfo is undefined', () => {
      assert.isUndefined(element.tokenInfo);
    });

    it('_popup is undefined', () => {
      assert.isUndefined(element._popup);
    });

    it('_state is undefined', () => {
      assert.isUndefined(element._state);
    });
  });

  describe('_tokenRequestedHandler()', () => {
    let element;
    const ev = {
      detail: {
        a: 'test'
      },
      target: document.createElement('div'),
      preventDefault: () => {},
      stopPropagation: () => {},
      stopImmediatePropagation: () => {}
    };

    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Cancels the event', () => {
      element.authorize = noop;
      const copy = Object.assign({}, ev);
      const stub1 = sinon.stub(copy, 'preventDefault');
      const stub2 = sinon.stub(copy, 'stopPropagation');
      const stub3 = sinon.stub(copy, 'stopImmediatePropagation');
      element._tokenRequestedHandler(copy);
      assert.isTrue(stub1.called);
      assert.isTrue(stub2.called);
      assert.isTrue(stub3.called);
    });

    it('Calls authorize function', () => {
      const copy = Object.assign({}, ev);
      const stub = sinon.stub(element, 'authorize');
      element._tokenRequestedHandler(copy);
      assert.isTrue(stub.called);
    });

    it('Calls authorize() with event detail', (done) => {
      const copy = Object.assign({}, ev);
      element.authorize = function(detail) {
        assert.typeOf(detail, 'object');
        assert.isTrue(detail === copy.detail);
        done();
      };
      element._tokenRequestedHandler(copy);
    });
  });

  describe('authorize()', () => {
    /* jshint -W107 */
    let element;
    describe('implicit type', () => {
      const baseSettings = {
        state: 'test-state',
        type: 'implicit',
        authorizationUri: 'https://domain.com'
      };

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Sets properties', () => {
        element._constructPopupUrl = noop;
        element._authorize = noop;
        element.authorize(baseSettings);
        assert.equal(element._type, 'implicit');
        assert.equal(element._state, 'test-state');
      });

      it('Generates state if empty', () => {
        const copy = Object.assign({}, baseSettings);
        delete copy.state;
        element._constructPopupUrl = noop;
        element._authorize = noop;
        element.authorize(copy);
        assert.typeOf(element._state, 'string');
      });

      it('Clears tokenInfo', () => {
        element._tokenInfo = ('TEST');
        element._constructPopupUrl = noop;
        element._authorize = noop;
        element.authorize(baseSettings);
        assert.isUndefined(element.tokenInfo);
      });

      it('Calls _constructPopupUrl()', (done) => {
        element._authorize = noop;
        element._constructPopupUrl = function(detail, type) {
          assert.isTrue(detail === baseSettings);
          assert.equal(type, 'token');
          done();
        };
        element.authorize(baseSettings);
      });

      it('Calls _authorize()', (done) => {
        element._constructPopupUrl = () => {
          return 'TEST';
        };
        element._authorize = function(url, detail) {
          assert.isTrue(detail === baseSettings);
          assert.equal(url, 'TEST');
          done();
        };
        element.authorize(baseSettings);
      });

      it('Throws when authorizationUri is invalid', () => {
        const settings = Object.assign({}, baseSettings);
        settings.authorizationUri = 'javascript://';
        assert.throws(() => {
          element.authorize(settings);
        });
      });

      it('Dispatches error when authorizationUri is invalid', () => {
        const settings = Object.assign({}, baseSettings);
        settings.authorizationUri = 'javascript://';
        settings.interactive = true;
        let data;
        element.ontokenerror = (e) => {
          data = e.detail;
        };
        try {
          element.authorize(settings);
        } catch (_) {
          noop();
        }
        assert.equal(data.code, 'oauth_error');
        assert.equal(data.message, 'authorizationUri: the value has invalid scheme');
        assert.equal(data.state, 'test-state');
        assert.isTrue(data.interactive);
      });
    });

    describe('authorization_code type', () => {
      const baseSettings = {
        state: 'test-state',
        type: 'authorization_code',
        authorizationUri: 'https://domain.com'
      };

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Clears tokenInfo', () => {
        element._tokenInfo = ('TEST');
        element._constructPopupUrl = noop;
        element._authorize = noop;
        element.authorize(baseSettings);
        assert.isUndefined(element.tokenInfo);
      });

      it('Sets properties', () => {
        element._constructPopupUrl = noop;
        element._authorize = noop;
        element.authorize(baseSettings);
        assert.equal(element._type, 'authorization_code');
        assert.equal(element._state, 'test-state');
      });

      it('Generates state if empty', () => {
        const copy = Object.assign({}, baseSettings);
        delete copy.state;
        element._constructPopupUrl = noop;
        element._authorize = noop;
        element.authorize(copy);
        assert.typeOf(element._state, 'string');
      });

      it('Calls _constructPopupUrl()', (done) => {
        element._authorize = noop;
        element._constructPopupUrl = function(detail, type) {
          assert.isTrue(detail === baseSettings);
          assert.equal(type, 'code');
          done();
        };
        element.authorize(baseSettings);
      });

      it('Calls _authorize()', (done) => {
        element._constructPopupUrl = () => {
          return 'TEST';
        };
        element._authorize = function(url, detail) {
          assert.isTrue(detail === baseSettings);
          assert.equal(url, 'TEST');
          done();
        };
        element.authorize(baseSettings);
      });

      it('Throws when authorizationUri is invalid', () => {
        const settings = Object.assign({}, baseSettings);
        settings.authorizationUri = 'javascript://';
        assert.throws(() => {
          element.authorize(settings);
        });
      });

      it('Dispatches error when authorizationUri is invalid', () => {
        const settings = Object.assign({}, baseSettings);
        settings.authorizationUri = 'javascript://';
        settings.interactive = true;
        let data;
        element.ontokenerror = (e) => {
          data = e.detail;
        };
        try {
          element.authorize(settings);
        } catch (_) {
          noop();
        }
        assert.equal(data.code, 'oauth_error');
        assert.equal(data.message, 'authorizationUri: the value has invalid scheme');
        assert.equal(data.state, 'test-state');
        assert.isTrue(data.interactive);
      });
    });

    describe('client_credentials type', () => {
      const baseSettings = {
        state: 'test-state',
        type: 'client_credentials'
      };

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Clears tokenInfo', () => {
        element._tokenInfo = ('TEST');
        element._authorizeClientCredential = noop;
        element.authorize(baseSettings);
        assert.isUndefined(element.tokenInfo);
      });

      it('Sets properties', () => {
        element._authorizeClientCredential = noop;
        element.authorize(baseSettings);
        assert.equal(element._type, 'client_credentials');
        assert.equal(element._state, 'test-state');
      });

      it('Generates state if empty', () => {
        const copy = Object.assign({}, baseSettings);
        delete copy.state;
        element._authorizeClientCredential = noop;
        element.authorize(copy);
        assert.typeOf(element._state, 'string');
      });

      it('Calls authorizeClientCredentials()', (done) => {
        element.authorizeClientCredentials = function(detail) {
          assert.isTrue(detail === baseSettings);
          done();
        };
        element.authorize(baseSettings);
      });
    });

    describe('password type', () => {
      const baseSettings = {
        state: 'test-state',
        type: 'password'
      };

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Clears tokenInfo', () => {
        element._tokenInfo = ('TEST');
        element._authorizePassword = noop;
        element.authorize(baseSettings);
        assert.isUndefined(element.tokenInfo);
      });

      it('Sets properties', () => {
        element._authorizePassword = noop;
        element.authorize(baseSettings);
        assert.equal(element._type, 'password');
        assert.equal(element._state, 'test-state');
      });

      it('Generates state if empty', () => {
        const copy = Object.assign({}, baseSettings);
        delete copy.state;
        element._authorizePassword = noop;
        element.authorize(copy);
        assert.typeOf(element._state, 'string');
      });

      it('Calls authorizePassword()', (done) => {
        element.authorizePassword = function(detail) {
          assert.isTrue(detail === baseSettings);
          done();
        };
        element.authorize(baseSettings);
      });
    });
  });

  describe('_authorize()', () => {
    const baseSettings = {
      state: 'test-state',
      type: 'any'
    };
    const popupUrl = 'test-url';
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls _authorizePopup for interactive method', (done) => {
      element._authorizePopup = function(url) {
        assert.equal(url, popupUrl);
        done();
      };
      element._authorize(popupUrl, baseSettings);
    });

    it('Calls _authorizePopup when interactive is set', (done) => {
      const settings = Object.assign({
        interactive: true
      }, baseSettings);
      element._authorizePopup = function(url) {
        assert.equal(url, popupUrl);
        done();
      };
      element._authorize(popupUrl, settings);
    });

    it('Calls _authorizeTokenNonInteractive when interactive is false', (done) => {
      const settings = Object.assign({
        interactive: false
      }, baseSettings);
      element._authorizeTokenNonInteractive = function(url) {
        assert.equal(url, popupUrl);
        done();
      };
      element._authorize(popupUrl, settings);
    });
  });

  describe('_authorizePopup()', () => {
    let popupUrl = '';
    before(() => {
      popupUrl = location.href.substr(0, location.href.lastIndexOf('/'));
      popupUrl += '/base/test/demo-popup.html';
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(() => {
      if (element._popup && !element._popup.closed) {
        element._popup.close();
      }
      window.focus();
    });

    it('Sets popup property (checks for popup block)', () => {
      element._settings = {};
      element._authorizePopup(popupUrl);
      if (!element._popup) {
        popupsAllowed = false;
      }
    });

    it('Calls _beforePopupUnloadHandler when popup is closed', (done) => {
      if (!popupsAllowed) {
        done();
        return;
      }
      element._beforePopupUnloadHandler = () => {
        done();
      };
      element._state = 'test-state';
      element._settings = {};
      const url = popupUrl + '?autoClose=true';
      element._authorizePopup(url);
    });

    it('Calls _processPopupData() when popup send message', (done) => {
      if (!popupsAllowed) {
        done();
        return;
      }
      element._processPopupData = function(e) {
        assert.equal(e.data.param, 'value');
        done();
      };
      element._settings = {};
      const url = popupUrl + '?auto-close=true&param=value';
      element._authorizePopup(url);
    });
  });

  describe('_authorizeTokenNonInteractive()', () => {
    let element;
    let iframeUrl = '';

    before(() => {
      iframeUrl = location.href.substr(0, location.href.lastIndexOf('/'));
      iframeUrl += '/base/test/demo-popup.html';
    });

    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(() => {
      if (!element._iframe) {
        return;
      }
      const frame = document.body.querySelector('iframe[data-owner="arc-oauth-authorization"]');
      if (frame) {
        document.body.removeChild(frame);
      }
    });

    it('Sets _iframe property', () => {
      element._settings = {};
      element._authorizeTokenNonInteractive(iframeUrl);
      assert.ok(element._iframe);
    });

    it('Appends iframe to the body', () => {
      element._settings = {};
      element._authorizeTokenNonInteractive(iframeUrl);
      const frame = document.body.querySelector('iframe[data-owner="arc-oauth-authorization"]');
      assert.ok(frame);
    });

    it('dispatches response for load error', (done) => {
      element.addEventListener('oauth2-token-response', function clb(e) {
        element.removeEventListener('oauth2-token-response', clb);
        assert.isFalse(e.detail.interactive);
        assert.equal(e.detail.code, 'not_authorized');
        assert.equal(e.detail.state, 'test-state');
        done();
      });
      element._state = 'test-state';
      element._settings = {};
      element._authorizeTokenNonInteractive(iframeUrl + '/test');
    });
  });

  describe('_frameLoadErrorHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches response custom event', (done) => {
      element.addEventListener('oauth2-token-response', function clb(e) {
        element.removeEventListener('oauth2-token-response', clb);
        assert.isFalse(e.detail.interactive);
        assert.equal(e.detail.code, 'iframe_load_error');
        assert.equal(e.detail.state, 'test-state');
        done();
      });
      element._state = 'test-state';
      element._frameLoadErrorHandler();
    });
  });

  describe('_frameLoadHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches response custom event when token is not set', (done) => {
      element.addEventListener('oauth2-token-response', function clb(e) {
        element.removeEventListener('oauth2-token-response', clb);
        assert.isFalse(e.detail.interactive);
        assert.equal(e.detail.code, 'not_authorized');
        assert.equal(e.detail.state, 'test-state');
        done();
      });
      element._state = 'test-state';
      element._frameLoadHandler();
    });

    it('Do not dispatches response custom event when token is set', (done) => {
      const spy = sinon.spy();
      element.addEventListener('oauth2-token-response', spy);
      element._state = 'test-state';
      element._tokenInfo = ('info');
      element._frameLoadHandler();
      setTimeout(() => {
        assert.isFalse(spy.called);
        done();
      }, 800);
    });
  });

  describe('_observePopupState()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls _beforePopupUnloadHandler when popup is not set', (done) => {
      element._beforePopupUnloadHandler = () => {
        done();
      };
      element._observePopupState();
    });

    it('Calls _beforePopupUnloadHandler when popup is closed', (done) => {
      element._beforePopupUnloadHandler = () => {
        done();
      };
      element._popup = {
        closed: true
      };
      element._observePopupState();
    });

    it('Clears interval', (done) => {
      element._beforePopupUnloadHandler = () => {
        assert.isUndefined(element.__popupCheckInterval);
        done();
      };
      element._observePopupState();
    });
  });

  describe('_constructPopupUrl()', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });
    const baseSettings = {
      authorizationUri: 'http://test.com/auth',
      clientId: 'test client id',
      redirectUri: 'http://test.com/redirect',
      scopes: ['one', 'two'],
      includeGrantedScopes: true,
      loginHint: 'email@domain.com',
      interactive: false
    };
    const defaultType = 'token';

    it('Sets authorization url', () => {
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.equal(result.indexOf('http://test.com/auth?'), 0);
    });

    it('Sets response_type property', () => {
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.notEqual(result.indexOf('response_type=token&'), -1);
    });

    it('Sets client_id property', () => {
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.notEqual(result.indexOf('client_id=test%20client%20id&'), -1);
    });

    it('Sets redirect_uri property', () => {
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.notEqual(result.indexOf('redirect_uri=http%3A%2F%2Ftest.com%2Fredirect'), -1);
    });

    it('Sets scopes property', () => {
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.notEqual(result.indexOf('scope=one%20two'), -1);
    });

    it('Sets state property', () => {
      element._state = 'test state';
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.notEqual(result.indexOf('state=test%20state'), -1);
    });

    it('Sets Google Oauth properties.', () => {
      const result = element._constructPopupUrl(baseSettings, defaultType);
      assert.notEqual(result.indexOf('include_granted_scopes=true'), -1);
      assert.notEqual(result.indexOf('prompt=none'), -1);
      assert.notEqual(result.indexOf('login_hint=email%40domain.com'), -1);
    });

    it('Skips redirect_uri if not set', () => {
      const settings = Object.assign({}, baseSettings);
      settings.redirectUri = undefined;
      const result = element._constructPopupUrl(settings, defaultType);
      assert.equal(result.indexOf('redirect_uri='), -1);
    });

    it('Skips scope if not set', () => {
      const settings = Object.assign({}, baseSettings);
      settings.scopes = undefined;
      const result = element._constructPopupUrl(settings, defaultType);
      assert.equal(result.indexOf('scope='), -1);
    });

    it('Skips include_granted_scopes if not set', () => {
      const settings = Object.assign({}, baseSettings);
      settings.includeGrantedScopes = undefined;
      const result = element._constructPopupUrl(settings, defaultType);
      assert.equal(result.indexOf('include_granted_scopes='), -1);
    });

    it('Skips prompt if not set', () => {
      const settings = Object.assign({}, baseSettings);
      settings.interactive = undefined;
      const result = element._constructPopupUrl(settings, defaultType);
      assert.equal(result.indexOf('prompt='), -1);
    });

    it('Skips login_hint if not set', () => {
      const settings = Object.assign({}, baseSettings);
      settings.loginHint = undefined;
      const result = element._constructPopupUrl(settings, defaultType);
      assert.equal(result.indexOf('login_hint='), -1);
    });

    it('Do not inserts "?" when auth url already contains it', () => {
      const settings = Object.assign({}, baseSettings);
      settings.authorizationUri = 'http://test.com/auth?custom=value';
      const result = element._constructPopupUrl(settings, defaultType);
      assert.equal(result.indexOf('http://test.com/auth?custom=value&response_type'), 0);
    });
  });

  describe('randomString()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Generates string of given length', () => {
      let result = element.randomString(1);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 1);
      result = element.randomString(3);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 3);
      result = element.randomString(6);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 6);
      result = element.randomString(9);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 9);
    });
  });

  describe('_computeScope()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns empty stirng for no argument', () => {
      const result = element._computeScope();
      assert.strictEqual(result, '');
    });

    it('Returns value for single scope', () => {
      const result = element._computeScope(['one']);
      assert.strictEqual(result, 'one');
    });

    it('Returns value for multiple scopes', () => {
      const result = element._computeScope(['one', 'two']);
      assert.strictEqual(result, 'one%20two');
    });
  });

  describe('_beforePopupUnloadHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Dispatches error if popup is closed without token info', (done) => {
      element.addEventListener('oauth2-error', function clb(e) {
        element.removeEventListener('oauth2-error', clb);
        assert.equal(e.detail.code, 'no_response', 'Dispatches no_response code');
        assert.equal(e.detail.state, 'test-state', 'State is set');
        assert.typeOf(e.detail.message, 'string', 'Message is set');
        done();
      });
      element._state = 'test-state';
      element._settings = {};
      element._beforePopupUnloadHandler();
    });

    it('Do nothing if token info is set', () => {
      const spy = sinon.spy();
      element.addEventListener('oauth2-error', spy);
      element._state = 'test-state';
      element._settings = {};
      element._tokenInfo = ('test');
      element._beforePopupUnloadHandler();
      assert.isFalse(spy.called);
    });

    it('Do nothing auth type is token', () => {
      const spy = sinon.spy();
      element.addEventListener('oauth2-error', spy);
      element._state = 'test-state';
      element._tokenInfo = ('test');
      element._settings = {};
      element._beforePopupUnloadHandler();
      assert.isFalse(spy.called);
    });
  });

  describe('_popupMessageHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element._type = 'implicit';
      element._state = 'test-state';
      element._popup = {
        close: () => {},
        closed: false
      };
    });
    const eBase = {
      data: {
        tokenTime: 1234,
        oauth2response: true
      }
    };
    it('Reports error when state is invalid', (done) => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'invalid';
      element.addEventListener('oauth2-error', function clb(e) {
        element.removeEventListener('oauth2-error', clb);
        assert.equal(e.detail.code, 'invalid_state', 'Dispatches invalid_state code');
        assert.equal(e.detail.state, 'test-state', 'State is set');
        assert.equal(e.detail.serverState, 'invalid', 'Server state is set');
        assert.typeOf(e.detail.message, 'string', 'Message is set');
        done();
      });
      element._popupMessageHandler(e);
    });

    it('Reports error when error in response', (done) => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'test-state';
      e.data.error = 'test_error';
      e.data.errorDescription = 'test description';
      element.addEventListener('oauth2-error', function clb(ev) {
        element.removeEventListener('oauth2-error', clb);
        assert.equal(ev.detail.code, 'test_error', 'Code is set');
        assert.equal(ev.detail.state, 'test-state', 'State is set');
        assert.equal(ev.detail.message, e.data.errorDescription, 'Message is set');
        done();
      });
      element._popupMessageHandler(e);
    });

    it('Reports token data', (done) => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'test-state';
      e.data.accessToken = 'testToken';
      e.data.expiresIn = 3600;
      element.addEventListener('oauth2-token-response', function clb(ev) {
        element.removeEventListener('oauth2-token-response', clb);
        assert.equal(ev.detail.accessToken, e.data.accessToken);
        assert.equal(ev.detail.expiresIn, e.data.expiresIn);
        done();
      });
      element._popupMessageHandler(e);
    });

    it('Sets tokenInfo property', () => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'test-state';
      e.data.accessToken = 'testToken';
      e.data.expiresIn = 3600;
      element._popupMessageHandler(e);
      assert.equal(element.tokenInfo.accessToken, e.data.accessToken);
      assert.equal(element.tokenInfo.expiresIn, e.data.expiresIn);
    });

    it('Clears the popup', () => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'test-state';
      e.data.accessToken = 'testToken';
      let called;
      element._popup = {
        close: () => {
          called = true;
        }
      };
      element._popupMessageHandler(e);
      assert.isTrue(called);
      assert.isUndefined(element._popup);
    });

    it('Sets _exchangeCodeValue', () => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'test-state';
      e.data.code = 'testCode';
      element._type = 'authorization_code';
      element._exchangeCode = nooPromise;
      element._popupMessageHandler(e);
      assert.equal(element._exchangeCodeValue, e.data.code);
    });

    it('Calls _exchangeCode()', (done) => {
      const e = Object.assign({}, eBase);
      e.data = Object.assign({}, e.data);
      e.data.state = 'test-state';
      e.data.code = 'testCode';
      element._type = 'authorization_code';
      element._exchangeCode = function(code) {
        assert.equal(code, e.data.code);
        done();
      };
      element._popupMessageHandler(e);
    });
  });

  describe('_camel()', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Renturns undefined if not changed', () => {
      const result = element._camel('noop');
      assert.isUndefined(result);
    });

    it('Renturns camel cased wirh "-"', () => {
      const result = element._camel('property-name-item');
      assert.equal(result, 'propertyNameItem');
    });

    it('Renturns camel cased wirh "_"', () => {
      const result = element._camel('property_name_item');
      assert.equal(result, 'propertyNameItem');
    });
  });

  describe('Custom OAuth data', () => {
    let element;
    const params = {
      type: 'custom_grant',
      clientId: 'test',
      clientSecret: 'test',
      authorizationUri: 'https://auth.domain.com',
      username: 'user-test',
      password: 'pass-test' + Date.now(),
      customData: {
        auth: {
          parameters: [{
            name: 'aqp1',
            value: 'aqpv1'
          }]
        },
        token: {
          parameters: [{
            name: 'tqp1',
            value: 'tqpv1'
          }],
          headers: [{
            name: 'th1',
            value: 'thv1'
          }],
          body: [{
            name: 'tb1',
            value: 'tbv1'
          }]
        }
      }
    };

    before(async () => {
      element = await basicFixture();
      element._settting = params;
      element._state = 'test-state';
    });

    describe('_applyCustomSettingsQuery()', () => {
      it('returns a string', () => {
        const result = element._applyCustomSettingsQuery('', params.customData.auth);
        assert.typeOf(result, 'string');
      });

      it('returns the same string when no settings', () => {
        const result = element._applyCustomSettingsQuery('', {});
        assert.equal(result, '');
      });

      it('returns params in query string.', () => {
        const result = element._applyCustomSettingsQuery('', params.customData.auth);
        assert.equal(result, '?aqp1=aqpv1');
      });
    });

    describe('_constructPopupUrl()', () => {
      it('Applies params to the url for implicit type', () => {
        const result = element._constructPopupUrl(params, 'token');
        let compare = 'https://auth.domain.com?response_type=token&client_id=';
        compare += 'test&state=test-state&aqp1=aqpv1';
        assert.equal(result, compare);
      });
      it('Applies params to the url for authorization_code type', () => {
        const result = element._constructPopupUrl(params, 'code');
        let compare = 'https://auth.domain.com?response_type=code&client_id=';
        compare += 'test&state=test-state&tqp1=tqpv1';
        assert.equal(result, compare);
      });
    });

    describe('_applyCustomSettingsBody()', () => {
      it('returns a string', () => {
        const result = element._applyCustomSettingsBody('', params.customData);
        assert.typeOf(result, 'string');
      });

      it('returns the same string when no settings', () => {
        const result = element._applyCustomSettingsBody('', {});
        assert.equal(result, '');
      });

      it('returns params in query string.', () => {
        const result = element._applyCustomSettingsBody('', params.customData);
        assert.equal(result, '&tb1=tbv1');
      });
    });
  });

  describe('_sanityCheck()', () => {
    /* jshint -W107 */
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Thorws when accessTokenUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          accessTokenUri: 'javascript://'
        });
      });
    });

    it('implicit: thorws when accessTokenUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          authorizationUri: 'https://domain.com',
          accessTokenUri: 'javascript://',
          type: 'implicit'
        });
      });
    });

    it('implicit: thorws when authorizationUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          authorizationUri: 'javascript://',
          type: 'implicit'
        });
      });
    });

    it('implicit: thorws when redirectUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          authorizationUri: 'javascript://',
          type: 'implicit'
        });
      });
    });

    it('authorization_code: thorws when accessTokenUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          authorizationUri: 'https://domain.com',
          accessTokenUri: 'javascript://',
          type: 'authorization_code'
        });
      });
    });

    it('authorization_code: thorws when authorizationUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          authorizationUri: 'javascript://',
          type: 'authorization_code'
        });
      });
    });

    it('authorization_code: thorws when redirectUri is invalid', () => {
      assert.throws(() => {
        element._sanityCheck({
          authorizationUri: 'javascript://',
          type: 'authorization_code'
        });
      });
    });
  });

  describe('_checkUrl()', () => {
    /* jshint -W107 */
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Throws when no argument', () => {
      assert.throws(() => {
        element._checkUrl();
      }, 'the value is missing');
    });

    it('Throws when argument is not a string', () => {
      assert.throws(() => {
        element._checkUrl(100);
      }, 'the value is not a string');
    });

    it('Throws when argument does not start with http or https', () => {
      assert.throws(() => {
        element._checkUrl('javascript:http://%0Aalert(document.domain);//');
      }, 'the value has invalid scheme');
    });

    it('passes for valid http: scheme', () => {
      element._checkUrl('http://api.domain.com');
    });

    it('passes for valid https: scheme', () => {
      element._checkUrl('https://api.domain.com');
    });
  });

  describe('_getCustomGrantBody()', () => {
    let element;
    let base;
    beforeEach(async () => {
      element = await basicFixture();
      base = {
        type: 'test'
      };
    });

    it('sets grant_type', () => {
      const result = element._getCustomGrantBody(base);
      assert.equal(result, 'grant_type=test');
    });

    it('adds client_id', () => {
      base.clientId = 'client-id-123';
      const result = element._getCustomGrantBody(base);
      assert.equal(result, 'grant_type=test&client_id=client-id-123');
    });

    it('adds client_secret', () => {
      base.clientId = 'client-id-123';
      base.clientSecret = 'secret';
      const result = element._getCustomGrantBody(base);
      assert.equal(result, 'grant_type=test&client_id=client-id-123&client_secret=secret');
    });

    it('adds scopes', () => {
      base.scopes = ['s1', 's2'];
      const result = element._getCustomGrantBody(base);
      assert.equal(result, 'grant_type=test&scope=s1%20s2');
    });

    it('adds redirectUri', () => {
      base.scopes = ['s1', 's2'];
      base.redirectUri = 'https://domain.com';
      const result = element._getCustomGrantBody(base);
      assert.equal(result, 'grant_type=test&scope=s1%20s2&redirect_uri=https%3A%2F%2Fdomain.com');
    });

    it('adds username and password', () => {
      base.username = 'uname';
      base.password = 'passwd';
      const result = element._getCustomGrantBody(base);
      assert.equal(result, 'grant_type=test&username=uname&password=passwd');
    });
  });

  describe('ontokenresponse', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.ontokenresponse);
      const f = () => {};
      element.ontokenresponse = f;
      assert.isTrue(element.ontokenresponse === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.ontokenresponse = f;
      element._dispatchResponse({});
      element.ontokenresponse = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.ontokenresponse = f1;
      element.ontokenresponse = f2;
      element._dispatchResponse({});
      element.ontokenresponse = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('ontokenerror', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.ontokenerror);
      const f = () => {};
      element.ontokenerror = f;
      assert.isTrue(element.ontokenerror === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.ontokenerror = f;
      element._dispatchError({});
      element.ontokenerror = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.ontokenerror = f1;
      element.ontokenerror = f2;
      element._dispatchError({});
      element.ontokenerror = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('a11y', () => {
    it('is accessible', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });
  });
});
