import { fixture, assert, aTimeout } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../oauth2-authorization.js';

describe('<oauth2-authorization>', () => {
  async function basicFixture() {
    return await fixture(`<oauth2-authorization></oauth2-authorization>`);
  }

  let popupUrl = location.href.substr(0, location.href.lastIndexOf('/'));
  popupUrl += '/base/oauth-popup.html';

  const testState = 'test-state';
  let popupsBlocked = false;
  function noop() {}

  describe('Implicit token', () => {
    describe('Popup', () => {
      describe('Error response', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
          element._type = 'implicit';
          element._state = testState;
          element._popup = { close: noop };
          await aTimeout(1000);
        });

        it('Dispatches oauth2-error for error response', (done) => {
          const eCode = 'test_error';
          const eMessage = 'test message';
          let url = popupUrl + '#state=' + testState + '&error=' + eCode + '&';
          url += 'error_description=' + encodeURIComponent(eMessage);
          let errorFn;
          let responseFn;
          errorFn = function(e) {
            element.removeEventListener('oauth2-error', errorFn);
            element.removeEventListener('oauth2-token-response', responseFn);
            if (e.detail.code === 'popup_blocked') {
              popupsBlocked = true;
              done();
              return;
            }
            assert.equal(e.detail.code, eCode);
            assert.equal(e.detail.state, testState);
            assert.equal(e.detail.message, eMessage);
            done();
          };
          responseFn = () => {
            element.removeEventListener('oauth2-error', errorFn);
            element.removeEventListener('oauth2-token-response', responseFn);
            done(new Error('oauth2-token-response should not be dispatched'));
          };
          element.addEventListener('oauth2-token-response', responseFn);
          element.addEventListener('oauth2-error', errorFn);
          element._authorize(url, {});
        });

        it('Dispatches oauth2-error for state mismatch', (done) => {
          if (popupsBlocked) {
            done();
            return;
          }
          const url = popupUrl + '#state=invalid&error=&error_message=';
          let errorFn;
          let responseFn;
          errorFn = function(e) {
            element.removeEventListener('oauth2-error', errorFn);
            element.removeEventListener('oauth2-token-response', responseFn);
            assert.equal(e.detail.code, 'invalid_state');
            assert.equal(e.detail.state, testState);
            assert.equal(e.detail.message, 'Invalid state returned by the OAuth server.');
            done();
          };
          responseFn = () => {
            element.removeEventListener('oauth2-error', errorFn);
            element.removeEventListener('oauth2-token-response', responseFn);
            done(new Error('oauth2-token-response should not be dispatched'));
          };
          element.addEventListener('oauth2-error', errorFn);
          element.addEventListener('oauth2-token-response', responseFn);
          element._authorize(url, {});
        });
      });

      describe('Token response', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
          element._type = 'implicit';
          element._state = testState;
          element._popup = { close: noop };
        });

        it('Dispatches oauth2-token-response', (done) => {
          if (popupsBlocked) {
            done();
            return;
          }
          const token = 'token1234';
          const expiresIn = 1234;
          let url = popupUrl + '#state=' + testState + '&access_token=';
          url += token + '&expires_in=' + expiresIn;
          let errorFn;
          let responseFn;
          errorFn = () => {
            element.removeEventListener('oauth2-error', errorFn);
            element.removeEventListener('oauth2-token-response', responseFn);
            done(new Error('oauth2-error should not be dispatched'));
          };

          responseFn = function(e) {
            element.removeEventListener('oauth2-error', errorFn);
            element.removeEventListener('oauth2-token-response', responseFn);
            assert.isUndefined(e.detail.code, 'code is undefined');
            assert.equal(e.detail.accessToken, token, 'Camel case accessToken is set');
            assert.equal(e.detail.access_token, token, 'access_token is set');
            assert.equal(e.detail.expiresIn, expiresIn, 'Camel case expiresIn is set');
            assert.equal(e.detail.expires_in, expiresIn, 'expires_in is set');
            done();
          };
          element.addEventListener('oauth2-error', responseFn);
          element.addEventListener('oauth2-token-response', responseFn);
          element._authorize(url, {});
        });
      });
    });

    describe('non interactive', () => {
      const settings = {
        interactive: false
      };

      describe('Error response', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
          element._type = 'implicit';
          element._state = testState;
        });

        it('Dispatches oauth2-error for error response', (done) => {
          if (popupsBlocked) {
            done();
            return;
          }
          const eCode = 'test_error';
          const eMessage = 'test message error no2';
          let url = popupUrl + '#state=' + testState + '&error=' + eCode + '&';
          url += 'error_description=' + encodeURIComponent(eMessage);
          element._authorize(url, settings);
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            if (e.detail.code === 'popup_blocked') {
              popupsBlocked = true;
              done();
              return;
            }
            assert.equal(e.detail.code, eCode);
            assert.equal(e.detail.state, testState);
            assert.equal(e.detail.message, eMessage);
            assert.isFalse(e.detail.interactive);
            done();
          });
        });

        it('Do not dispatches oauth2-token-response event for error response', (done) => {
          if (popupsBlocked) {
            done();
            return;
          }
          const eCode = 'test_error';
          const eMessage = 'test message error no3';
          let url = popupUrl + '#state=' + testState + '&error=' + eCode + '&';
          url += 'error_description=' + encodeURIComponent(eMessage);
          element._authorize(url, settings);
          const spy = sinon.spy();
          element.addEventListener('oauth2-token-response', spy);
          element.addEventListener('oauth2-error', function clb() {
            element.removeEventListener('oauth2-error', clb);
            assert.isFalse(spy.called);
            done();
          });
        });

        it('Dispatches oauth2-error for state mismatch', (done) => {
          const eMessage = 'test message error no4';
          let url = popupUrl + '#state=invalid&error=&';
          url += 'error_message=' + encodeURIComponent(eMessage);
          element.addEventListener('oauth2-error', function clb(e) {
            element.removeEventListener('oauth2-error', clb);
            assert.equal(e.detail.code, 'invalid_state');
            assert.equal(e.detail.state, testState);
            assert.isFalse(e.detail.interactive);
            done();
          });
          element._authorize(url, settings);
        });

        // it('Does not dispatches oauth2-token-response event for state mismatch', (done) => {
        //   if (popupsBlocked) {
        //     done();
        //     return;
        //   }
        //   let url = popupUrl + '#state=invalid&error=&error_message=';
        //   let spy = sinon.spy();
        //   element.addEventListener('oauth2-token-response', spy);
        //   setTimeout(() => {
        //     assert.isFalse(spy.called);
        //     done();
        //   }, 800);
        //   element._authorize(url, settings);
        // });

        it('Dispatches oauth2-token-response for lack of response', (done) => {
          if (popupsBlocked) {
            done();
            return;
          }
          // main docs page
          element._authorize(popupUrl.replace('oauth-popup.html', 'test/empty-popup.html'), settings);
          element.addEventListener('oauth2-token-response', function clb(e) {
            element.removeEventListener('oauth2-token-response', clb);
            assert.equal(e.detail.code, 'not_authorized');
            assert.equal(e.detail.state, testState);
            assert.isFalse(e.detail.interactive);
            done();
          });
        });
      });

      describe('Token response', () => {
        let element;
        beforeEach(async () => {
          element = await basicFixture();
          element._type = 'implicit';
          element._state = testState;
        });

        it('Dispatches oauth2-token-response', (done) => {
          const token = 'token1234';
          const expiresIn = 1234;
          let url = popupUrl + '#state=' + testState + '&access_token=';
          url += token + '&expires_in=' + expiresIn;
          element.addEventListener('oauth2-token-response', function clb(e) {
            element.removeEventListener('oauth2-token-response', clb);
            assert.isUndefined(e.detail.code, 'code is undefined');
            assert.equal(e.detail.accessToken, token, 'Camel case accessToken is set');
            assert.equal(e.detail.access_token, token, 'access_token is set');
            assert.equal(e.detail.expiresIn, expiresIn, 'Camel case expiresIn is set');
            assert.equal(e.detail.expires_in, expiresIn, 'expires_in is set');
            done();
          });
          element._authorize(url, settings);
        });
      });
    });
  });
});
