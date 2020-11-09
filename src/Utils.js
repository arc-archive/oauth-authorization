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
  if (['implicit', 'authorization_code'].includes(settings.responseType)) {
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
 * Generates a random string for the state parameter.
 * 
 * See: http://stackoverflow.com/a/10727155/1127848
 * 
 * @param {number} len The number of random characters to return.
 * @returns {string} A random string.
 */
export function randomString(len) {
  const p1 = 36 ** (len+1);
  const p2 = 36 ** len;
  return Math.round(p1 - Math.random() * p2).toString(36).slice(1);
}

/**
 * Computes `scope` URL parameter from scopes array.
 *
 * @param {string[]} scopes List of scopes to use with the request.
 * @return {string} Computed scope value.
 */
export function computeScope(scopes) {
  if (!scopes) {
    return '';
  }
  if (typeof scopes === 'string') {
    return scopes;
  }
  if (Array.isArray(scopes)) {
    const scope = scopes.join(' ');
    return encodeURIComponent(scope);
  }
  return '';
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