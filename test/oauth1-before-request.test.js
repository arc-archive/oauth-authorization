import { fixture, assert } from '@open-wc/testing';
import '../oauth1-authorization.js';

describe('<oauth1-authorization>', function() {
  async function basicFixture() {
    return await fixture(`<oauth1-authorization></oauth1-authorization>`);
  }

  describe('Before request - OAuth1', function() {
    let request;
    let auth;
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      request = {
        url: 'http://domain.com/endpoint/?param=value',
        headers: 'x-requested-with: xmlhttprequest',
        method: 'GET'
      };
      auth = {
        signatureMethod: 'HMAC-SHA1',
        requestTokenUri: 'https://echo.advancedrestclient.com/auth/oauth1/request_token',
        accessTokenUri: 'https://echo.advancedrestclient.com/auth/oauth1/access_token',
        authorizationUri: 'https://echo.advancedrestclient.com/auth/oauth1/dialog/authorize',
        consumerKey: 'key',
        consumerSecret: 'secret',
        redirectUri: 'http://127.0.0.1:8081/components/oauth-authorization/oauth-popup.html',
        authParamsLocation: 'authorization',
        authTokenMethod: 'POST',
        nonce: 'abcdefg',
        timestamp: 1509402152,
        token: 'tWfvyFw7anQYC0Fo',
        tokenSecret: 'kOZA2NjIVQ1c8pUZ6Ku2c2Rs16aGeYnJHlZL7Kg2jFAfmigL1uFSUHNO5zLkkIru',
        type: 'oauth 1'
      };
    });

    function fire() {
      const detail = Object.assign ? Object.assign({}, request) : request;
      detail.auth = {
        settings: auth,
        valid: true,
        type: 'oauth 1'
      };
      const event = new CustomEvent('before-request', {
        detail,
        bubbles: true,
        composed: true
      });
      document.body.dispatchEvent(event);
      return event;
    }

    it('Handles before-request event', () => {
      const e = fire();
      const { headers } = e.detail;
      assert.typeOf(headers, 'string');
      assert.isTrue(headers.toLowerCase().indexOf('authorization') !== -1);
    });

    it('ignores the event when ignoreBeforeRequest is set', () => {
      element.ignoreBeforeRequest = true;
      const e = fire();
      const { headers } = e.detail;
      assert.isTrue(headers.toLowerCase().indexOf('authorization') === -1);
    });

    it('Generates signature', () => {
      const event = fire();
      const headers = event.detail.headers;
      const index = headers.indexOf('authorization');
      const value = headers.substr(index + 15 + 6);
      const params = {};
      value.split(', ').forEach(function(line) {
        const parts = line.split('=');
        let _value = parts[1].substr(1);
        _value = _value.substr(0, _value.length - 1);
        params[parts[0]] = _value;
      });
      assert.equal(params.oauth_consumer_key, auth.consumerKey);
      assert.equal(params.oauth_nonce, auth.nonce);
      assert.equal(params.oauth_signature_method, auth.signatureMethod);
      assert.equal(params.oauth_timestamp, auth.timestamp);
      assert.equal(params.oauth_token, auth.token);
      assert.equal(params.oauth_version, '1.0');
      assert.equal(params.oauth_signature, '4huy8JcLkX8bch540ZTXiwH%2B4Vc%3D');
    });
  });
});
