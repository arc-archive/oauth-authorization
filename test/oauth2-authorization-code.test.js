import { fixture, assert } from '@open-wc/testing';
import { ClientCredentialsServer } from './auth-server.js';
import '../oauth2-authorization.js';

describe('<oauth2-authorization>', () => {
  async function basicFixture() {
    return await fixture(`<oauth2-authorization></oauth2-authorization>`);
  }

  describe('Password request', () => {
    const params = {
      type: 'authorization_code',
      clientId: 'test client id',
      clientSecret: 'test client secret',
      accessTokenUri: 'https://auth.domain.com/token',
      authorizationUri: 'https://auth.domain.com/auth',
      redirectUri: 'https://domain.com/redirect',
      interactive: true,
      scopes: ['one', 'two'],
      customData: {
        token: {
          parameters: [{
            name: 'customParam',
            value: 'paramValue'
          }],
          headers: [{
            name: 'x-custom-header',
            value: 'header value'
          }],
          body: [{
            name: 'custom_body_param',
            value: 'custom value'
          }]
        }
      }
    };
    const code = 'test code';
    beforeEach(() => {
      ClientCredentialsServer.createServer('authorization_code');
    });

    afterEach(() => {
      ClientCredentialsServer.restore();
    });

    describe('_exchangeCode()', () => {
      it('Returns a Promise', async () => {
        const element = await basicFixture();
        element._settings = params;
        const result = element._exchangeCode(code);
        assert.typeOf(result.then, 'function');
        await result;
      });

      describe('JSON response', () => {
        it('Gets token info', async () => {
          ClientCredentialsServer.responseType = 'json';
          const element = await basicFixture();
          element._settings = params;

          const info = await element._exchangeCode(code);
          assert.equal(info.accessToken, 'server-token');
          assert.equal(info.access_token, 'server-token');
          assert.equal(info.tokenType, 'bearer');
          assert.equal(info.token_type, 'bearer');
          assert.equal(info.expiresIn, 3600);
          assert.equal(info.expires_in, 3600);
          assert.isTrue(info.interactive);
        });

        it('Gets error info', async () => {
          ClientCredentialsServer.responseType = 'json';
          const element = await basicFixture();
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/clienterror';
          element._settings = clone;

          const info = await element._exchangeCode(code);
          assert.equal(info.error, 'test-error');
          assert.equal(info.error_description, 'test-description');
          assert.equal(info.errorDescription, 'test-description');
          assert.isTrue(info.interactive);
        });
      });

      describe('URL encoded response', () => {
        it('Gets token info', async () => {
          ClientCredentialsServer.responseType = 'urlencoded';
          const element = await basicFixture();
          element._settings = params;
          const info = await element._exchangeCode(code);
          assert.equal(info.accessToken, 'server-token');
          assert.equal(info.access_token, 'server-token');
          assert.equal(info.tokenType, 'bearer');
          assert.equal(info.token_type, 'bearer');
          assert.equal(info.expiresIn, 3600);
          assert.equal(info.expires_in, 3600);
          assert.isTrue(info.interactive);
        });

        it('Gets error info', async () => {
          ClientCredentialsServer.responseType = 'urlencoded';
          const element = await basicFixture();
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/clienterror';
          element._settings = clone;
          const info = await element._exchangeCode(code);
          assert.equal(info.error, 'test-error');
          assert.equal(info.error_description, 'test-description');
          assert.equal(info.errorDescription, 'test-description');
          assert.isTrue(info.interactive);
        });
      });

      describe('Error responses', () => {
        it('Handles 404 response', async () => {
          const element = await basicFixture();
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server404error';
          element._settings = clone;
          try {
            await element._exchangeCode(code);
            throw new Error('should-not-resolve');
          } catch (cause) {
            assert.notEqual(cause.message, 'should-not-resolve');
          }
        });

        it('Handles 40x response', async () => {
          const element = await basicFixture();
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server400error';
          element._settings = clone;

          try {
            await element._exchangeCode(code);
            throw new Error('should-not-resolve');
          } catch (cause) {
            assert.notEqual(cause.message, 'should-not-resolve');
          }
        });

        it('Handles 50x response', async () => {
          const element = await basicFixture();
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server500error';
          element._settings = clone;

          try {
            await element._exchangeCode(code);
            throw new Error('should-not-resolve');
          } catch (cause) {
            assert.notEqual(cause.message, 'should-not-resolve');
          }
        });
      });

      describe('Events', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
        });

        it('Dispatches success event for correct response', (done) => {
          element.addEventListener('oauth2-token-response', function clb(e) {
            element.removeEventListener('oauth2-token-response', clb);
            assert.equal(e.detail.accessToken, 'server-token');
            assert.equal(e.detail.access_token, 'server-token');
            assert.equal(e.detail.tokenType, 'bearer');
            assert.equal(e.detail.token_type, 'bearer');
            assert.equal(e.detail.expiresIn, 3600);
            assert.equal(e.detail.expires_in, 3600);
            assert.isTrue(e.detail.interactive);
            done();
          });
          element._settings = params;
          element._exchangeCode(code);
        });

        it('Dispatches error event when oauth error', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'test-error');
            assert.equal(e.detail.message, 'test-description');
            assert.equal(e.detail.state, 'test-state');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/clienterror';
          element._settings = clone;
          element._state = 'test-state';
          element._exchangeCode(code)
          .catch(() => {});
        });

        it('Dispatches error event when 404', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'request_error');
            assert.typeOf(e.detail.message, 'string');
            assert.equal(e.detail.state, 'test-state');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server404error';
          element._settings = clone;
          element._state = 'test-state';
          element._exchangeCode(code)
          .catch(() => {});
        });

        it('Dispatches error event when 40x', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'request_error');
            assert.typeOf(e.detail.message, 'string');
            assert.equal(e.detail.state, 'test-state');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server400error';
          element._settings = clone;
          element._state = 'test-state';
          element._exchangeCode(code)
          .catch(() => {});
        });

        it('Dispatches error event when 50x', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'request_error');
            assert.typeOf(e.detail.message, 'string');
            assert.equal(e.detail.state, 'test-state');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server500error';
          element._settings = clone;
          element._state = 'test-state';
          element._exchangeCode(code)
          .catch(() => {});
        });
      });
    });
  });
});
