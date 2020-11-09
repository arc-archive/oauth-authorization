/* eslint-disable no-script-url */
// eslint-disable-next-line import/no-unresolved
import { assert } from '@esm-bundle/chai';
import * as Utils from '../src/Utils.js';

describe('Utils', () => {
  describe('checkUrl()', () => {
    it('throws when no argument', () => {
      assert.throws(() => {
        Utils.checkUrl(undefined);
      }, 'the value is missing');
    });

    it('throws when argument is not a string', () => {
      assert.throws(() => {
        // @ts-ignore
        Utils.checkUrl(100);
      }, 'the value is not a string');
    });

    it('throws when argument does not start with http or https', () => {
      assert.throws(() => {
        Utils.checkUrl('javascript:http://%0Aalert(document.domain);//');
      }, 'the value has invalid scheme');
    });

    it('passes for valid http: scheme', () => {
      Utils.checkUrl('http://api.domain.com');
    });

    it('passes for valid https: scheme', () => {
      Utils.checkUrl('https://api.domain.com');
    });
  });

  describe('sanityCheck()', () => {
    it('throws when accessTokenUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          accessTokenUri: 'javascript://'
        });
      });
    });

    it('implicit: throws when accessTokenUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          authorizationUri: 'https://domain.com',
          accessTokenUri: 'javascript://',
          responseType: 'implicit'
        });
      });
    });

    it('implicit: throws when authorizationUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          authorizationUri: 'javascript://',
          responseType: 'implicit'
        });
      });
    });

    it('implicit: throws when redirectUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          authorizationUri: 'javascript://',
          responseType: 'implicit'
        });
      });
    });

    it('authorization_code: throws when accessTokenUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          authorizationUri: 'https://domain.com',
          accessTokenUri: 'javascript://',
          responseType: 'authorization_code'
        });
      });
    });

    it('authorization_code: throws when authorizationUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          authorizationUri: 'javascript://',
          responseType: 'authorization_code'
        });
      });
    });

    it('authorization_code: throws when redirectUri is invalid', () => {
      assert.throws(() => {
        Utils.sanityCheck({
          authorizationUri: 'javascript://',
          responseType: 'authorization_code'
        });
      });
    });
  });

  describe('randomString()', () => {
    it('Generates string of given length', () => {
      let result = Utils.randomString(1);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 1);
      result = Utils.randomString(3);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 3);
      result = Utils.randomString(6);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 6);
      result = Utils.randomString(9);
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 9);
    });
  });

  describe('computeScope()', () => {
    it('returns empty string for no argument', () => {
      const result = Utils.computeScope(undefined);
      assert.strictEqual(result, '');
    });

    it('returns value for single scope', () => {
      const result = Utils.computeScope(['one']);
      assert.strictEqual(result, 'one');
    });

    it('returns value for multiple scopes', () => {
      const result = Utils.computeScope(['one', 'two']);
      assert.strictEqual(result, 'one%20two');
    });

    it('returns empty string for invalid value', () => {
      // @ts-ignore
      const result = Utils.computeScope(true);
      assert.strictEqual(result, '');
    });

    it('returns the same string', () => {
      // @ts-ignore
      const result = Utils.computeScope('test');
      assert.strictEqual(result, 'test');
    });
  });

  describe('camel()', () => {
    it('returns undefined if not changed', () => {
      const result = Utils.camel('noop');
      assert.isUndefined(result);
    });

    it('returns camel cased with "-"', () => {
      const result = Utils.camel('property-name-item');
      assert.equal(result, 'propertyNameItem');
    });

    it('returns camel cased with "_"', () => {
      const result = Utils.camel('property_name_item');
      assert.equal(result, 'propertyNameItem');
    });
  });
});