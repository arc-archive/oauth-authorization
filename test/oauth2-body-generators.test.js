import { fixture, assert } from '@open-wc/testing';
import '../oauth2-authorization.js';

describe('<oauth2-authorization>', () => {
  async function basicFixture() {
    return await fixture(`<oauth2-authorization></oauth2-authorization>`);
  }

  describe('Request body generators', () => {
    const params = {
      type: 'custom_grant',
      clientId: 'test client id',
      clientSecret: 'test client secret',
      authorizationUri: 'https://auth.domain.com',
      username: 'test username',
      password: 'test password',
      scopes: ['one', 'two']
    };

    let element;
    before(async () => {
      element = await basicFixture();
    });

    describe('_getCodeEchangeBody()', () => {
      it('Applies params to the body', () => {
        const result = element._getCodeEchangeBody(params, 'test code');
        let compare = 'grant_type=authorization_code&client_id=test%20client%20id';
        compare += '&code=test%20code&client_secret=test%20client%20secret';
        assert.equal(result, compare);
      });
    });

    describe('_getClientCredentialsBody()', () => {
      it('grant_type is set', () => {
        const result = element._getClientCredentialsBody({});
        assert.equal(result.indexOf('grant_type=client_credentials'), 0);
      });

      it('Skips client_id is not set', () => {
        const result = element._getClientCredentialsBody({});
        assert.equal(result.indexOf('client_id='), -1);
      });

      it('Skips client_secret is not set', () => {
        const result = element._getClientCredentialsBody({});
        assert.equal(result.indexOf('client_secret='), -1);
      });

      it('Skips scope is not set', () => {
        const result = element._getClientCredentialsBody({});
        assert.equal(result.indexOf('scope='), -1);
      });

      it('client_id is set', () => {
        const result = element._getClientCredentialsBody(params);
        assert.notEqual(result.indexOf('&client_id=test%20client%20id'), -1);
      });

      it('client_secret is set', () => {
        const result = element._getClientCredentialsBody(params);
        assert.notEqual(result.indexOf('&client_secret=test%20client%20secret'), -1);
      });

      it('scope is set', () => {
        const result = element._getClientCredentialsBody(params);
        assert.notEqual(result.indexOf('&scope=one%20two'), -1);
      });
    });

    describe('_getPasswordBody()', () => {
      it('grant_type is set', () => {
        const result = element._getPasswordBody(params);
        assert.equal(result.indexOf('grant_type=password'), 0);
      });

      it('username is set', () => {
        const result = element._getPasswordBody(params);
        assert.notEqual(result.indexOf('&username=test%20username'), -1);
      });

      it('password is set', () => {
        const result = element._getPasswordBody(params);
        assert.notEqual(result.indexOf('&password=test%20password'), -1);
      });

      it('Skips client_id is not set', () => {
        const copy = Object.assign({}, params);
        delete copy.clientId;
        const result = element._getPasswordBody(copy);
        assert.equal(result.indexOf('client_id='), -1);
      });

      it('Skips scope is not set', () => {
        const copy = Object.assign({}, params);
        delete copy.scopes;
        const result = element._getPasswordBody(copy);
        assert.equal(result.indexOf('scope='), -1);
      });

      it('client_id is set', () => {
        const result = element._getPasswordBody(params);
        assert.notEqual(result.indexOf('&client_id=test%20client%20id'), -1);
      });

      it('scope is set', () => {
        const result = element._getPasswordBody(params);
        assert.notEqual(result.indexOf('&scope=one%20two'), -1);
      });
    });
  });
});
