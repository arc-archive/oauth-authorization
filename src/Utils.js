/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Settings */

/**
 * Checks if the URL has valid scheme for OAuth flow.
 * 
 * @param {string} url The url value to test
 * @throws {TypeError} When passed value is not set, empty, or not a string
 * @throws {Error} When passed value is not a valid URL for OAuth 2 flow
 */
export function checkUrl(url) {
  if (!url) {
    throw new TypeError('the value is missing');
  }
  if (typeof url !== 'string') {
    throw new TypeError('the value is not a string');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('the value has invalid scheme');
  }
}

/**
 * Checks if basic configuration of the OAuth 2 request is valid an can proceed
 * with authentication.
 * @param {OAuth2Settings} settings authorization settings
 * @throws {Error} When settings are not valid
 */
export function sanityCheck(settings) {
  if (['implicit', 'authorization_code'].includes(settings.grantType)) {
    try {
      checkUrl(settings.authorizationUri);
    } catch (e) {
      throw new Error(`authorizationUri: ${e.message}`);
    }
    if (settings.accessTokenUri) {
      try {
        checkUrl(settings.accessTokenUri);
      } catch (e) {
        throw new Error(`accessTokenUri: ${e.message}`);
      }
    }
  } else if (settings.accessTokenUri) {
    try {
      checkUrl(settings.accessTokenUri);
    } catch (e) {
      throw new Error(`accessTokenUri: ${e.message}`);
    }
  }
}

/**
 * Generates a random string of characters.
 * 
 * @returns {string} A random string.
 */
export function randomString() {
  const array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => (`0${dec.toString(16)}`).substr(-2)).join('');
}

/**
 * Replaces `-` or `_` with camel case.
 * @param {string} name The string to process
 * @return {String|undefined} Camel cased string or `undefined` if not transformed.
 */
export function camel(name) {
  let i = 0;
  let l;
  let changed = false;
  // eslint-disable-next-line no-cond-assign
  while ((l = name[i])) {
    if ((l === '_' || l === '-') && i + 1 < name.length) {
      // eslint-disable-next-line no-param-reassign
      name = name.substr(0, i) + name[i + 1].toUpperCase() + name.substr(i + 2);
      changed = true;
    }
    // eslint-disable-next-line no-plusplus
    i++;
  }
  return changed ? name : undefined;
}

/**
 * Computes the SHA256 hash ogf the given input.
 * @param {string} value The value to encode.
 * @returns {Promise<ArrayBuffer>}
 */
export async function sha256(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return window.crypto.subtle.digest('SHA-256', data);
}

/**
 * Encoded the array buffer to a base64 string value.
 * @param {ArrayBuffer} buffer
 * @returns
 */
export function base64Buffer(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer))); // .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates code challenge for the PKCE extension to the OAuth2 specification.
 * @param {string} verifier The generated code verifier.
 * @returns {Promise<string>} The code challenge string
 */
export async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64Buffer(hashed);
}