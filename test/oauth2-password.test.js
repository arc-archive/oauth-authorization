import { fixture, assert } from '@open-wc/testing';
import { ClientCredentialsServer } from './auth-server.js';
import '../oauth2-authorization.js';

describe('<oauth2-authorization>', () => {
  async function basicFixture() {
    return await fixture(`<oauth2-authorization></oauth2-authorization>`);
  }

  describe('Password request', () => {
    const params = {
      type: 'password',
      clientId: 'test client id',
      username: 'user name',
      password: 'user password ' + Date.now(),
      accessTokenUri: 'https://auth.domain.com/token',
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

    before(() => {
      ClientCredentialsServer.createServer('password');
    });

    after(() => {
      ClientCredentialsServer.restore();
    });

    describe('authorizePassword()', () => {
      it('Returns a Promise', async () => {
        const element = await basicFixture();
        const result = element.authorizePassword(params);
        assert.typeOf(result.then, 'function');
        await result;
      });

      describe('JSON response', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
        });

        it('Gets token info', () => {
          ClientCredentialsServer.responseType = 'json';
          return element.authorizePassword(params)
          .then((info) => {
            assert.equal(info.accessToken, 'server-token');
            assert.equal(info.access_token, 'server-token');
            assert.equal(info.tokenType, 'bearer');
            assert.equal(info.token_type, 'bearer');
            assert.equal(info.expiresIn, 3600);
            assert.equal(info.expires_in, 3600);
            assert.isTrue(info.interactive);
          });
        });

        it('Gets error info', () => {
          ClientCredentialsServer.responseType = 'json';
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/clienterror';
          return element.authorizePassword(clone)
          .then((info) => {
            assert.equal(info.error, 'test-error');
            assert.equal(info.error_description, 'test-description');
            assert.equal(info.errorDescription, 'test-description');
            assert.isTrue(info.interactive);
          });
        });
      });

      describe('URL encoded response', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
        });

        it('Gets token info', () => {
          ClientCredentialsServer.responseType = 'urlencoded';
          return element.authorizePassword(params)
          .then((info) => {
            assert.equal(info.accessToken, 'server-token');
            assert.equal(info.access_token, 'server-token');
            assert.equal(info.tokenType, 'bearer');
            assert.equal(info.token_type, 'bearer');
            assert.equal(info.expiresIn, 3600);
            assert.equal(info.expires_in, 3600);
            assert.isTrue(info.interactive);
          });
        });

        it('Gets error info', () => {
          ClientCredentialsServer.responseType = 'urlencoded';
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/clienterror';
          return element.authorizePassword(clone)
          .then((info) => {
            assert.equal(info.error, 'test-error');
            assert.equal(info.error_description, 'test-description');
            assert.equal(info.errorDescription, 'test-description');
            assert.isTrue(info.interactive);
          });
        });
      });

      describe('Error responses', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
        });

        it('Handles 404 response', () => {
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server404error';
          return element.authorizePassword(clone)
          .then(() => {
            throw new Error('test-was-success');
          })
          .catch((cause) => {
            assert.notEqual(cause.message, 'test-was-success');
          });
        });

        it('Handles 40x response', () => {
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server400error';
          return element.authorizePassword(clone)
          .then(() => {
            throw new Error('test-was-success');
          })
          .catch((cause) => {
            assert.notEqual(cause.message, 'test-was-success');
          });
        });

        it('Handles 50x response', () => {
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server500error';
          return element.authorizePassword(clone)
          .then(() => {
            throw new Error('test-was-success');
          })
          .catch((cause) => {
            assert.notEqual(cause.message, 'test-was-success');
          });
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
          element.authorize(params);
        });

        it('Dispatches error event when oauth error', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'test-error');
            assert.equal(e.detail.message, 'test-description');
            assert.typeOf(e.detail.state, 'string');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/clienterror';
          element.authorize(clone);
        });

        it('Dispatches error event when 404', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'request_error');
            assert.typeOf(e.detail.message, 'string');
            assert.typeOf(e.detail.state, 'string');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server404error';
          element.authorize(clone);
        });

        it('Dispatches error event when 40x', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'request_error');
            assert.typeOf(e.detail.message, 'string');
            assert.typeOf(e.detail.state, 'string');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server400error';
          element.authorize(clone);
        });

        it('Dispatches error event when 50x', (done) => {
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'request_error');
            assert.typeOf(e.detail.message, 'string');
            assert.typeOf(e.detail.state, 'string');
            assert.isTrue(e.detail.interactive);
            done();
          });
          const clone = Object.assign({}, params);
          clone.accessTokenUri = 'https://auth.domain.com/server500error';
          element.authorize(clone);
        });
      });
    });
  });
});
