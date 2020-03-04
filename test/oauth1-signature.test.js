import { fixture, assert } from '@open-wc/testing';
import '../oauth1-authorization.js';

describe('<oauth1-authorization>', function() {
  async function basicFixture() {
    return await fixture(`<oauth1-authorization></oauth1-authorization>`);
  }

  describe('Signature generator', function() {
    describe('_listQueryParameters()', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      [
        {
          url: 'http://domain.com',
          result: []
        },
        {
          url: 'http://domain.com/path/file.html',
          result: []
        },
        {
          url: 'http://domain.com/path/file.html?',
          result: []
        },
        {
          url: 'http://domain.com/path/file.html?param=value',
          result: [['param', 'value']]
        },
        {
          url: 'http://domain.com/path/file.html?param=value&a',
          result: [
            ['param', 'value'],
            ['a', '']
          ]
        },
        {
          url: 'http://domain.com/path/file.html?param=value&a=&test#123',
          result: [
            ['param', 'value'],
            ['a', ''],
            ['test', '']
          ]
        }
      ].forEach(function(item) {
        it('Parses ' + item.url, function() {
          const params = element._listQueryParameters(item.url);
          assert.lengthOf(params, item.result.length, 'Length is OK');
          assert.deepEqual(params, item.result, 'Result is OK');
        });
      });
    });

    describe('_makeArrayOfArgumentsHash()', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      const simpleMap = {
        param: 'value',
        number: 123,
        boolean: true
      };

      const mapWithArray = {
        param: 'value',
        number: 123,
        boolean: true,
        array: ['one', 'two', 'tree']
      };

      it('Transforms simple map to array', function() {
        const params = element._makeArrayOfArgumentsHash(simpleMap);
        assert.typeOf(params, 'array');
      });

      it('Simple map to array has 3 elements', function() {
        const params = element._makeArrayOfArgumentsHash(simpleMap);
        assert.lengthOf(params, Object.keys(simpleMap).length);
      });

      it('Preserves order in array', function() {
        const params = element._makeArrayOfArgumentsHash(simpleMap);
        assert.equal(params[0][0], 'param');
        assert.equal(params[1][0], 'number');
        assert.equal(params[2][0], 'boolean');
      });

      it('Sets values in array', function() {
        const params = element._makeArrayOfArgumentsHash(simpleMap);
        assert.equal(params[0][1], 'value');
        assert.equal(params[1][1], 123);
        assert.equal(params[2][1], true);
      });

      it('Transforms map with array to array', function() {
        const params = element._makeArrayOfArgumentsHash(mapWithArray);
        assert.typeOf(params, 'array');
      });

      it('Map with array has 6 elements', function() {
        const params = element._makeArrayOfArgumentsHash(mapWithArray);
        assert.lengthOf(params, 6);
      });

      it('Preservers array items order', function() {
        const params = element._makeArrayOfArgumentsHash(mapWithArray);
        assert.equal(params[3][1], 'one');
        assert.equal(params[4][1], 'two');
        assert.equal(params[5][1], 'tree');
      });
    });

    describe('_normalizeUrl()', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      const urlDefaultPort = 'http://EXAMPLE.COM:80/r%20v/X?id=123#123';
      const urlNonDefaultPort = 'https://www.example.net:8080/?q=1';
      const urlPortMissmatch = 'http://www.example.net:443/';

      it('Removes query string, port and lowercase the URL', function() {
        const url = element._normalizeUrl(urlDefaultPort);
        assert.strictEqual(url, 'http://example.com/r%20v/X');
      });

      it('Removes query string, preserves port', function() {
        const url = element._normalizeUrl(urlNonDefaultPort);
        assert.strictEqual(url, 'https://www.example.net:8080/');
      });

      it('Preserves port', function() {
        const url = element._normalizeUrl(urlPortMissmatch);
        assert.strictEqual(url, 'http://www.example.net:443/');
      });
    });

    describe('_sortParamsFunction()', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      // https://tools.ietf.org/html/rfc5849#section-3.4.1.3.2
      it('Sorts an array by first parameter', function() {
        const array = [
          ['b5', '%3D%253D'],
          ['a3', 'a'],
          ['c%40', ''],
          ['a2', 'r%20b'],
          ['oauth_consumer_key', '9djdj82h48djs9d2'],
          ['oauth_token', 'kkk9d7dh3k39sjv7'],
          ['oauth_signature_method', 'HMAC-SHA1'],
          ['oauth_timestamp', 137131201],
          ['oauth_nonce', '7d8f3e4a'],
          ['c2', ''],
          ['a3', '2%20q']
        ];
        const compare = [
          ['a2', 'r%20b'],
          ['a3', '2%20q'],
          ['a3', 'a'],
          ['b5', '%3D%253D'],
          ['c%40', ''],
          ['c2', ''],
          ['oauth_consumer_key', '9djdj82h48djs9d2'],
          ['oauth_nonce', '7d8f3e4a'],
          ['oauth_signature_method', 'HMAC-SHA1'],
          ['oauth_timestamp', 137131201],
          ['oauth_token', 'kkk9d7dh3k39sjv7']
        ];
        array.sort(element._sortParamsFunction);
        assert.deepEqual(array, compare);
      });
    });

    describe('_normaliseRequestParams()', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      // https://tools.ietf.org/html/rfc5849#section-3.4.1.3.2
      it('Normalises params', function() {
        const array = [
          ['b5', '=%3D'],
          ['a3', 'a'],
          ['c@', ''],
          ['a2', 'r b'],
          ['oauth_consumer_key', '9djdj82h48djs9d2'],
          ['oauth_token', 'kkk9d7dh3k39sjv7'],
          ['oauth_signature_method', 'HMAC-SHA1'],
          ['oauth_timestamp', 137131201],
          ['oauth_nonce', '7d8f3e4a'],
          ['c2', ''],
          ['a3', '2 q']
        ];
        let compare = 'a2=r%20b&a3=2%20q&a3=a&b5=%3D%253D&c%40=&c2=&';
        compare += 'oauth_consumer_key=9djdj82h48djs9d2&';
        compare += 'oauth_nonce=7d8f3e4a&oauth_signature_method=HMAC-SHA1&';
        compare += 'oauth_timestamp=137131201&oauth_token=kkk9d7dh3k39sjv7';
        const normalised = element._normaliseRequestParams(array);
        assert.equal(normalised, compare);
      });
    });

    describe('_formUrlEncodedToParams()', function() {
      const body = 'c2&a3=2+q&key=';
      let params;
      beforeEach(async function() {
        const element = await basicFixture();
        params = element._formUrlEncodedToParams(body);
      });

      it('Creates array from form URL encoded body', function() {
        assert.typeOf(params, 'array');
      });

      it('Array has 3 elements', function() {
        assert.lengthOf(params, 3);
      });

      it('Preserves order', function() {
        assert.equal(params[0][0], 'c2');
        assert.equal(params[1][0], 'a3');
        assert.equal(params[2][0], 'key');
      });

      it('Decodes parameters', function() {
        assert.equal(params[1][1], '2 q');
      });
    });

    describe('createSignatureBase()', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      const oauthParams = {
        oauth_consumer_key: '9djdj82h48djs9d2',
        oauth_token: 'kkk9d7dh3k39sjv7',
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: 137131201,
        oauth_nonce: '7d8f3e4a'
      };

      const url = 'http://example.com/request?b5=%3D%253D&a3=a&c%40=&a2=r%20b';
      const body = 'c2&a3=2+q';
      const method = 'POST';

      // https://tools.ietf.org/html/rfc5849#section-3.4.1.1
      it('Computes signature base without body', function() {
        let compare = 'POST&http%3A%2F%2Fexample.com%2Frequest&a2%3Dr%2520b%26';
        compare += 'a3%3Da%26b5%3D%253D%253D%26c%2540%3D';
        compare += '%26oauth_consumer_key%3D9djdj82h48djs9d2%26oauth_nonce';
        compare += '%3D7d8f3e4a%26oauth_signature_method%3DHMAC-SHA1%26oauth_';
        compare += 'timestamp%3D137131201%26oauth_token%3Dkkk9d7dh3k39sjv7';

        const normalised = element.createSignatureBase(method, url, oauthParams);
        assert.equal(normalised, compare);
      });

      it('Computes signature base without body', function() {
        let compare = 'POST&http%3A%2F%2Fexample.com%2Frequest&a2%3Dr%2520b%26';
        compare += 'a3%3D2%2520q%26a3%3Da%26b5%3D%253D%253D%26c%2540%3D%26c2';
        compare += '%3D%26oauth_consumer_key%3D9djdj82h48djs9d2%26oauth_nonce';
        compare += '%3D7d8f3e4a%26oauth_signature_method%3DHMAC-SHA1%26oauth_';
        compare += 'timestamp%3D137131201%26oauth_token%3Dkkk9d7dh3k39sjv7';

        const normalised = element.createSignatureBase(method, url, oauthParams, body);
        assert.equal(normalised, compare);
      });
    });

    // http://lti.tools/oauth/
    describe('createSignatureBase() 2', function() {
      let element;
      beforeEach(async function() {
        element = await basicFixture();
      });

      const oauthParams = {
        oauth_consumer_key: '9djdj82h48djs9d2',
        oauth_token: 'kkk9d7dh3k39sjv7',
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: 137131201,
        oauth_nonce: '7d8f3e4a'
      };
      const url = 'http://example.com/request?param=value';
      const method = 'POST';
      it('Computes base string', function() {
        const base = element.createSignatureBase(method, url, oauthParams);
        let compare = 'POST&http%3A%2F%2Fexample.com%2Frequest&oauth_consumer_';
        compare += 'key%3D9djdj82h48djs9d2%26oauth_nonce%3D7d8f3e4a%26oauth_si';
        compare += 'gnature_method%3DHMAC-SHA1%26oauth_timestamp%3D137131201%2';
        compare += '6oauth_token%3Dkkk9d7dh3k39sjv7%26param%3Dvalue';
        assert.equal(base, compare);
      });

      it('Computes base string with body', function() {
        const body = 'bodyParam=bodyValue';
        const base = element.createSignatureBase('GET', url, oauthParams, body);
        let compare = 'GET&http%3A%2F%2Fexample.com%2Frequest&bodyParam%3Dbody';
        compare += 'Value%26oauth_consumer_key%3D9djdj82h48djs9d2%26oauth_nonc';
        compare += 'e%3D7d8f3e4a%26oauth_signature_method%3DHMAC-SHA1%26oauth_';
        compare += 'timestamp%3D137131201%26oauth_token%3Dkkk9d7dh3k39sjv7%26p';
        compare += 'aram%3Dvalue';
        assert.equal(base, compare);
      });

      it('Computes base string with callback parameter', function() {
        const oauthParams = {
          oauth_consumer_key: 'key',
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: 1500143520,
          oauth_nonce: 'KoirwhdQhaHOuviMm1YydjVlcOZxJvOr',
          oauth_version: '1.0',
          oauth_callback: 'http://192.168.1.16:8081/components/auth-methods/demo/oauth1.html'
        };
        const url = 'http://term.ie/oauth/example/request_token.php';
        const base = element.createSignatureBase('POST', url, oauthParams);
        const compare =
          'POST&http%3A%2F%2Fterm.ie%2Foauth%2Fexample%2Frequest_' +
          'token.php&oauth_callback%3Dhttp%253A%252F%252F192.168.1.16%253A808' +
          '1%252Fcomponents%252Fauth-methods%252Fdemo%252Foauth1.html%26oauth' +
          '_consumer_key%3Dkey%26oauth_nonce%3DKoirwhdQhaHOuviMm1YydjVlcOZxJv' +
          'Or%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D150014' +
          '3520%26oauth_version%3D1.0';
        assert.equal(base, compare);
      });
    });

    // http://lti.tools/oauth/
    describe('createSignatureKey()', function() {
      let element;
      const consumerSecret = 'W4yfjeCMLVgKmHhJAw3brNDqSeuJdddAoh0I7dkfMoy8nhEOV7';
      beforeEach(async function() {
        element = await basicFixture();
      });

      it('Computes key for consumer secret only', function() {
        const base = element.createSignatureKey(consumerSecret);
        const compare = 'W4yfjeCMLVgKmHhJAw3brNDqSeuJdddAoh0I7dkfMoy8nhEOV7&';
        assert.equal(base, compare);
      });

      it('Computes key for consumer secret and toekn secret', function() {
        const base = element.createSignatureKey(consumerSecret, 'test123');
        const compare = 'W4yfjeCMLVgKmHhJAw3brNDqSeuJdddAoh0I7dkfMoy8nhEOV7&test123';
        assert.equal(base, compare);
      });
    });

    // http://lti.tools/oauth/
    describe('getSignature()', function() {
      describe('HMAC-SHA1', function() {
        let element;
        const signatureMethod = 'HMAC-SHA1';
        beforeEach(async function() {
          element = await basicFixture();
          element.consumerSecret = 'secret';
        });

        const oauthParams = {
          oauth_consumer_key: 'key',
          oauth_token: 'token',
          oauth_signature_method: signatureMethod,
          oauth_timestamp: 137131201,
          oauth_nonce: '7d8f3e4a'
        };
        const url = 'http://example.com/request?param=value';

        it('Computes signature for POST', function() {
          const base = element.getSignature(signatureMethod, 'POST', url, oauthParams);
          const compare = '8CeIhnDtQl2somp1zcGwfKhfvkw=';
          assert.equal(base, compare);
        });

        it('Computes signature for GET', function() {
          const base = element.getSignature(signatureMethod, 'GET', url, oauthParams);
          const compare = 'Iwn2ka3vOpamW4o2JhDYCBPLw8Q=';
          assert.equal(base, compare);
        });

        it('Computes signature with body', function() {
          const body = 'bodyParam=bodyValue';
          const base = element.getSignature(signatureMethod, 'POST', url, oauthParams, undefined, body);
          const compare = 'nBi6dBdbHDK2YUMh3Z/LgqnGF8E=';
          assert.equal(base, compare);
        });

        it('Computes base string with callback parameter', function() {
          const oauthParams = {
            oauth_consumer_key: 'key',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: 1500143520,
            oauth_nonce: 'KoirwhdQhaHOuviMm1YydjVlcOZxJvOr',
            oauth_version: '1.0',
            oauth_callback: 'http://192.168.1.16:8081/components/auth-methods/demo/oauth1.html'
          };
          const url = 'http://term.ie/oauth/example/request_token.php';
          const base = element.getSignature(signatureMethod, 'POST', url, oauthParams);
          const compare = 'GR6Bkw3yD6luxFOC9emEFltYzNc=';
          assert.equal(base, compare);
        });
      });

      describe('PLAINTEXT', function() {
        let element;
        const signatureMethod = 'PLAINTEXT';
        beforeEach(async function() {
          element = await basicFixture();
          element.consumerSecret = 'secret';
        });

        const oauthParams = {
          oauth_consumer_key: 'key',
          oauth_token: 'token',
          oauth_signature_method: 'PLAINTEXT',
          oauth_timestamp: 137131201,
          oauth_nonce: '7d8f3e4a'
        };
        const url = 'http://example.com/request?param=value';

        it('Computes signature for POST', function() {
          const base = element.getSignature(signatureMethod, 'POST', url, oauthParams);
          assert.equal(base, 'secret&');
        });

        it('Computes signature for GET', function() {
          const base = element.getSignature(signatureMethod, 'GET', url, oauthParams);
          assert.equal(base, 'secret&');
        });
      });
    });
  });

  describe('signRequestObject()', () => {
    let element;
    before(async function() {
      element = await basicFixture();
    });

    const token = 'abc';
    const tokenSecret = 'xyz';

    it('returns the same object when no request method', () => {
      const request = {
        url: 'http://domain.com/path/file.html?param=value'
      };
      const result = element.signRequestObject({ ...request }, token, tokenSecret);
      assert.deepEqual(result, request);
    });

    it('returns the same object when no url', () => {
      const request = {
        method: 'GET'
      };
      const result = element.signRequestObject({ ...request }, token, tokenSecret);
      assert.deepEqual(result, request);
    });

    it('signs GET request', () => {
      const request = {
        method: 'GET',
        url: 'http://domain.com/path/file.html?param=value',
        headers: ''
      };
      const result = element.signRequestObject({ ...request }, token, tokenSecret);
      assert.include(result.headers, 'oauth_token="abc"');
    });

    it('signs POST request with payload', () => {
      const request = {
        method: 'GET',
        url: 'http://domain.com/path/file.html?param=value',
        headers: 'content-type: text/plain',
        payload: 'test'
      };
      const result = element.signRequestObject({ ...request }, token, tokenSecret);
      assert.include(result.headers, 'oauth_token="abc"');
    });
  });

  describe('signRequest()', () => {
    let element;
    before(async function() {
      element = await basicFixture();
    });

    const token = 'abc';
    const tokenSecret = 'xyz';

    function createAuthorization() {
      return {
        valid: true,
        type: 'oauth 1',
        settings: {
          signatureMethod: 'PLAINTEXT',
          requestTokenUri: 'https://domain.com/token',
          accessTokenUri: 'https://domain.com/access',
          consumerKey: 'ckey',
          consumerSecret: 'csecret',
          redirectUri: 'https://rdr.com',
          token,
          tokenSecret
        }
      };
    }

    it('returns the same object when no request method', () => {
      const auth = createAuthorization();
      const request = {
        url: 'http://domain.com/path/file.html?param=value'
      };
      const result = element.signRequest({ ...request }, auth);
      assert.deepEqual(result, request);
    });

    it('returns the same object when no url', () => {
      const auth = createAuthorization();
      const request = {
        method: 'GET'
      };
      const result = element.signRequest({ ...request }, auth);
      assert.deepEqual(result, request);
    });

    it('signs GET request', () => {
      const auth = createAuthorization();
      const request = {
        method: 'GET',
        url: 'http://domain.com/path/file.html?param=value',
        headers: ''
      };
      const result = element.signRequest({ ...request }, auth);
      const { headers } = result;
      assert.include(headers, 'authorization: OAuth ', 'has "authorization" value');
      assert.include(headers, 'oauth_consumer_key="ckey",', 'has "consumer_key"');
      // value is generated so not testing for it
      assert.include(headers, 'oauth_nonce="', 'has "nonce"');
      assert.include(headers, 'oauth_signature_method="PLAINTEXT",', 'has "signature_method"');
      // value is time dependent so not testing for it
      assert.include(headers, 'oauth_timestamp="', 'has "timestamp"');
      assert.include(headers, 'oauth_token="abc",', 'has "token"');
      assert.include(headers, 'oauth_version="1.0",', 'has "version"');
      assert.include(headers, 'oauth_signature="csecret%26xyz"', 'has "signature"');
    });

    it('signs POST request', () => {
      const auth = createAuthorization();
      const request = {
        method: 'POST',
        url: 'http://domain.com/path/file.html?param=value',
        headers: 'content-type: text/plain',
        payload: 'test'
      };
      const result = element.signRequest({ ...request }, auth);
      const { headers } = result;
      assert.include(headers, 'authorization: OAuth ', 'has "authorization" value');
      assert.include(headers, 'oauth_consumer_key="ckey",', 'has "consumer_key"');
      // value is generated so not testing for it
      assert.include(headers, 'oauth_nonce="', 'has "nonce"');
      assert.include(headers, 'oauth_signature_method="PLAINTEXT",', 'has "signature_method"');
      // value is time dependent so not testing for it
      assert.include(headers, 'oauth_timestamp="', 'has "timestamp"');
      assert.include(headers, 'oauth_token="abc",', 'has "token"');
      assert.include(headers, 'oauth_version="1.0",', 'has "version"');
      assert.include(headers, 'oauth_signature="csecret%26xyz"', 'has "signature"');
    });

    it('accepts array argument', () => {
      const auth = createAuthorization();
      const request = {
        method: 'GET',
        url: 'http://domain.com/path/file.html?param=value',
        headers: ''
      };
      const result = element.signRequest({ ...request }, [auth]);
      const { headers } = result;
      assert.include(headers, 'authorization: OAuth ', 'has "authorization" value');
    });
  });
});
