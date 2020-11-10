// import { CodeServerMock } from './test/oauth2/ServerMock.js';
import pkg from './test/oauth2/ServerMock.js';

const { CodeServerMock } = pkg;

export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  plugins: [
    {
      name: 'mock-api',
      serve(context) {
        if (context.path === '/oauth2/auth-code') {
          return CodeServerMock.authRequest(context.request);
        }
        if (context.path === '/oauth2/token') {
          return CodeServerMock.tokenRequest(context);
        }
        if (context.path === '/oauth2/auth-code-custom') {
          return CodeServerMock.authRequestCustom(context.request);
        }
        if (context.path === '/oauth2/token-custom') {
          return CodeServerMock.tokenRequestCustom(context);
        }
        if (context.path === '/oauth2/password') {
          return CodeServerMock.tokenPassword(context);
        }
        if (context.path === '/oauth2/client-credentials') {
          return CodeServerMock.tokenClientCredentials(context);
        }
        if (context.path === '/oauth2/custom-grant') {
          return CodeServerMock.tokenCustomGrant(context);
        }
        if (context.path === '/empty-response') {
          return '';
        }
        return undefined;
      },
    },
  ],

  middleware: [
    function implicitAuth(context, next) {
      if (context.path === '/oauth2/auth-implicit') {
        return CodeServerMock.authRequestImplicit(context);
      }
      if (context.path === '/oauth2/auth-implicit-custom') {
        return CodeServerMock.authRequestImplicitCustom(context);
      }
      if (context.path === '/oauth2/auth-implicit-invalid-state') {
        return CodeServerMock.authRequestImplicitStateError(context);
      }
      return next();
    }
  ]
};