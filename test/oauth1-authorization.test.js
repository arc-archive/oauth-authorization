import { fixture, assert } from '@open-wc/testing';
import '../oauth1-authorization.js';

describe('<oauth1-authorization>', () => {
  async function basicFixture() {
    return await fixture(`<oauth1-authorization></oauth1-authorization>`);
  }

  function isTooOld() {
    return !Object.assign;
  }

  describe('_defaultHeaders()', () => {
    let element;
    let result;
    beforeEach(async () => {
      element = await basicFixture();
      result = element._defaultHeaders();
    });

    it('Returns a map', () => {
      assert.typeOf(result, 'object');
    });

    it('Contains 3 entries', () => {
      assert.lengthOf(Object.keys(result), 3);
    });
  });

  describe('_prepareOauth()', () => {
    let element;
    let settings;
    beforeEach(async () => {
      element = await basicFixture();
      settings = {
        signatureMethod: 'RSA-SHA1',
        requestTokenUri: 'http://request-token-url.com/',
        accessTokenUri: 'http://access-token-url.com/',
        consumerKey: 'test-consumer-key',
        consumerSecret: 'test-consumer-secret',
        redirectUri: 'http://redirect-url.com/',
        authParamsLocation: 'url',
        authTokenMethod: 'GET-test',
        version: '1.0a-test',
        nonceSize: 56,
        nonce: 'abcdefg',
        timestamp: 1234567,
        customHeaders: {'x-header': 'value'}
      };
    });

    it('Sets default values', () => {
      if (isTooOld()) {
        return;
      }
      const s = Object.assign({}, settings);
      delete s.authParamsLocation;
      delete s.authTokenMethod;
      delete s.version;
      delete s.nonceSize;
      delete s.customHeaders;
      element._prepareOauth(s);
      assert.equal(element.authParamsLocation, 'authorization', 'authParamsLocation is set');
      assert.equal(element.authTokenMethod, 'POST', 'authTokenMethod is set');
      assert.equal(element._version, '1.0', '_version is set');
      assert.equal(element._nonceSize, 32, '_nonceSize is set');
      assert.typeOf(element._headers, 'object', '_headers is set');
    });

    it('Sets values on the element', () => {
      element._prepareOauth(settings);
      assert.equal(element.signatureMethod, settings.signatureMethod, 'Signature method is set');
      assert.equal(element._privateKey, settings.consumerSecret, '_privateKey is set');
      assert.equal(element.requestTokenUri, settings.requestTokenUri, 'requestTokenUri is set');
      assert.equal(element.accessTokenUri, settings.accessTokenUri, 'accessTokenUri is set');
      assert.equal(element.consumerKey, settings.consumerKey, 'consumerKey is set');
      assert.equal(element.consumerSecret, settings.consumerSecret, 'consumerSecret is set');
      assert.equal(element._authorizeCallback, settings.redirectUri, '_authorizeCallback is set');
      assert.equal(element.authParamsLocation,
        settings.authParamsLocation, 'authParamsLocation is set');
      assert.equal(element.authTokenMethod, settings.authTokenMethod, 'authTokenMethod is set');
      assert.equal(element._nonceSize, settings.nonceSize, '_nonceSize is set');
      assert.equal(element._nonce, settings.nonce, '_nonce is set');
      assert.equal(element._version, settings.version, '_version is set');
      assert.deepEqual(element._headers, settings.customHeaders, '_headers is set');
      assert.equal(element._timestamp, settings.timestamp, '_timestamp is set');
      assert.equal(element._oauthParameterSeperator, ',', '_oauthParameterSeperator is set');
    });

    it('Throws an error when auth signature is not supported', () => {
      if (isTooOld()) {
        return;
      }
      assert.throws(() => {
        const s = Object.assign({}, settings);
        s.signatureMethod = 'test';
        element._prepareOauth(s);
      });
    });
  });
  describe('getTimestamp()', () => {
    let element;
    let result;
    beforeEach(async () => {
      element = await basicFixture();
      result = element.getTimestamp();
    });

    it('Returns a number', () => {
      assert.typeOf(result, 'number');
    });
  });

  describe('encodeData()', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Returns empty string if argument not set', () => {
      assert.equal(element.encodeData(), '');
    });

    it('Returns empty string if argument is falsy', () => {
      assert.equal(element.encodeData(false), '');
      assert.equal(element.encodeData(null), '');
      assert.equal(element.encodeData(''), '');
    });

    it('Encodes string', () => {
      const str = '(hello) \'world*';
      const compare = '%28hello%29%20%27world%2A';
      const encoded = element.encodeData(str);
      assert.equal(encoded, compare);
    });
  });

  describe('decodeData()', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Returns empty string if argument not set', () => {
      assert.equal(element.decodeData(), '');
    });

    it('Returns empty string if argument is falsy', () => {
      assert.equal(element.decodeData(false), '');
      assert.equal(element.decodeData(null), '');
      assert.equal(element.decodeData(''), '');
    });

    it('Encodes string', function() {
      const str = 'he%20llo+world';
      const compare = 'he llo world';
      const encoded = element.decodeData(str);
      assert.equal(encoded, compare);
    });
  });

  describe('_isParameterNameAnOAuthParameter()', () => {
    let element;
    beforeEach(async function() {
      element = await basicFixture();
    });

    it('Returns empty string if argument not set', () => {
      assert.equal(element.decodeData(), '');
    });

    it('Returns false for falsy argument', () => {
      assert.isFalse(element._isParameterNameAnOAuthParameter(false));
      assert.isFalse(element._isParameterNameAnOAuthParameter(null));
      assert.isFalse(element._isParameterNameAnOAuthParameter(''));
    });

    it('Returns false for any string', () => {
      assert.isFalse(element._isParameterNameAnOAuthParameter('oauth'));
      assert.isFalse(element._isParameterNameAnOAuthParameter('any'));
      assert.isFalse(element._isParameterNameAnOAuthParameter('string'));
    });

    it('Returns true for oauth parameter', () => {
      assert.isTrue(element._isParameterNameAnOAuthParameter('oauth_'));
      assert.isTrue(element._isParameterNameAnOAuthParameter('oauth_nonce'));
      assert.isTrue(element._isParameterNameAnOAuthParameter('oauth_token'));
    });
  });

  describe('_buildAuthorizationHeaders()', () => {
    let element;
    let oauthParams;
    let notOauthParams;
    beforeEach(async () => {
      element = await basicFixture();
      oauthParams = [['oauth_nonce', 'abcd'], ['oauth_timestamp', 1234567]];
      notOauthParams = [['test', true], ['value', 'test']];
      element._oauthParameterSeperator = ',';
    });

    it('Creates a string of params', () => {
      const result = element._buildAuthorizationHeaders(oauthParams);
      assert.typeOf(result, 'string');
    });

    it('Only accepts OAuth1 parameters', () => {
      const params = oauthParams.concat(notOauthParams);
      const result = element._buildAuthorizationHeaders(params);
      assert.isTrue(result.indexOf('test') === -1);
      assert.isTrue(result.indexOf('value') === -1);
    });

    it('Encodes parameters', () => {
      const params = [
        ['oauth_test_encode', '(hello) \'world*'],
        ['oauth_other', 'param']
      ];
      let compare = 'OAuth oauth_test_encode="%28hello%29%20%27world%2A", ';
      compare += 'oauth_other="param"';
      const result = element._buildAuthorizationHeaders(params);
      assert.equal(result, compare);
    });
  });
  describe('_buildFormDataParameters()', () => {
    let element;
    let oauthParams;
    let notOauthParams;
    beforeEach(async function() {
      element = await basicFixture();
      oauthParams = [['oauth_nonce', 'abcd'], ['oauth_timestamp', 1234567]];
      notOauthParams = [['test', true], ['value', 'test']];
    });

    it('Creates a string of params', () => {
      const result = element._buildFormDataParameters(oauthParams);
      assert.typeOf(result, 'string');
    });

    it('Only accepts OAuth1 parameters', () => {
      const params = oauthParams.concat(notOauthParams);
      const result = element._buildFormDataParameters(params);
      assert.isTrue(result.indexOf('test') === -1);
      assert.isTrue(result.indexOf('value') === -1);
    });

    it('Encodes parameters', () => {
      const params = [
        ['oauth_test_encode', '(hello) \'world*'],
        ['oauth_other', 'param']
      ];
      let compare = 'oauth_test_encode=%28hello%29%20%27world%2A&';
      compare += 'oauth_other=param';
      const result = element._buildFormDataParameters(params);
      assert.equal(result, compare);
    });
  });

  describe('_buildAuthorizationQueryStirng()', () => {
    let element;
    let oauthParams;
    const url = 'http://endpoint.domain.com/?test=true&other=test';
    before(async () => {
      element = await basicFixture();
      oauthParams = [['oauth_nonce', 'abcd'], ['oauth_timestamp', 1234567]];
    });

    it('Creates a string of params', () => {
      const result = element._buildAuthorizationQueryStirng(url, oauthParams);
      assert.typeOf(result, 'string');
    });

    it('Appends parameters', () => {
      const result = element._buildAuthorizationQueryStirng(url, oauthParams);
      const compare = url + '&oauth_nonce=abcd&oauth_timestamp=1234567';
      assert.equal(result, compare);
    });
  });

  describe('_makeArrayOfArgumentsHash()', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Computes simple object', () => {
      const data = {
        a: 'b',
        c: 123
      };
      const result = element._makeArrayOfArgumentsHash(data);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
    });

    it('Computes object with array', () => {
      const data = {
        a: 'b',
        c: ['a', 'b']
      };
      const result = element._makeArrayOfArgumentsHash(data);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 3);
    });
  });
});
