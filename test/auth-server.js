/* global sinon */

const ClientCredentialsServer = {
  responseType: 'json',
  createServer: function(type) {
    this.type = type;
    this.srv = sinon.fakeServer.create({
      autoRespond: true
    });
    this.mock();
  },

  createJsonTokenInfo() {
    const result = {
      access_token: 'server-token',
      token_type: 'bearer',
      expires_in: 3600
    };
    return JSON.stringify(result);
  },

  createUrlTokenInfo() {
    let result = 'access_token=server-token&token_type=bearer';
    result += '&expires_in=3600';
    return result;
  },

  validate: function(request) {
    ClientCredentialsServer.validateBody(request.requestBody);
    ClientCredentialsServer.validateHeaders(request.requestHeaders);
    ClientCredentialsServer.validateUrl(request.url);
  },

  validateUrl: function(url) {
    const paramsStr = url.substr(url.indexOf('?') + 1);
    const params = {};
    paramsStr.split('&')
    .forEach((part) => {
      const data = part.split('=');
      if (data[0] in params) {
        throw new Error('Repeated query parameter value: ' + data[0]);
      }
      params[data[0]] = data[1];
    });
    if (params.customParam !== 'paramValue') {
      throw new Error('Required x-custom-header is missing');
    }
  },

  validateHeaders: function(headers) {
    if (headers['content-type']
      .indexOf('application/x-www-form-urlencoded') === -1) {
      throw new Error('Required content-type is missing');
    }
    if (headers['x-custom-header'] !== 'header value') {
      throw new Error('Required x-custom-header is missing');
    }
  },

  validateBody: function(body) {
    const params = {};
    body.split('&')
    .forEach((part) => {
      const data = part.split('=');
      if (data[0] in params) {
        throw new Error('Repeated body parameter value: ' + data[0]);
      }
      params[data[0]] = data[1];
    });
    if (params.grant_type !== this.type) {
      throw new Error('Required grant_type is missing');
    }
    if (params.client_id !== 'test%20client%20id') {
      throw new Error('Required client_id is missing');
    }
    if (this.type === 'client_credentials') {
      if (params.client_secret !== 'test%20client%20secret') {
        throw new Error('Required client_secret is missing');
      }
    }
    if (this.type === 'client_credentials' || this.type === 'password') {
      if (params.scope !== 'one%20two') {
        throw new Error('Required scope is missing');
      }
    }
    if (params.custom_body_param !== 'custom%20value') {
      throw new Error('Required custom_body_param is missing');
    }
  },

  createOauthErrorInfoJson: function() {
    const result = {
      error: 'test-error',
      error_description: 'test-description'
    };
    return JSON.stringify(result);
  },

  createOauthErrorInfoUrl: function() {
    let result = 'error=test-error&';
    result += 'error_description=test-description';
    return result;
  },

  mock: function() {
    let url = /^https:\/\/auth\.domain\.com\/token?.*/;
    this.srv.respondWith('POST', url, (request) => this.authHandler(request));
    url = /^https:\/\/auth\.domain\.com\/clienterror?.*/;
    this.srv.respondWith('POST', url, (request) => this.errorHandler(request));
    url = /^https:\/\/auth\.domain\.com\/server404error?.*/;
    this.srv.respondWith('POST', url, (request) =>
      this.error404Handler(request));
    url = /^https:\/\/auth\.domain\.com\/server400error?.*/;
    this.srv.respondWith('POST', url, (request) =>
      this.error400Handler(request));
    url = /^https:\/\/auth\.domain\.com\/server500error?.*/;
    this.srv.respondWith('POST', url, (request) =>
      this.error500Handler(request));
  },

  authHandler: function(request) {
    try {
      ClientCredentialsServer.validate(request);
    } catch (e) {
      request.respond(400, {
        'content-type': 'application/json'
      }, JSON.stringify({
        error: e.message
      }));
      return;
    }
    let response;
    let contentType;
    if (ClientCredentialsServer.responseType === 'json') {
      response = ClientCredentialsServer.createJsonTokenInfo();
      contentType = 'application/json';
    } else {
      response = ClientCredentialsServer.createUrlTokenInfo();
      contentType = 'application/x-www-form-urlencoded';
    }
    request.respond(200, {
      'content-type': contentType
    }, response);
  },

  errorHandler: function(request) {
    let response;
    let contentType;
    if (ClientCredentialsServer.responseType === 'json') {
      response = ClientCredentialsServer.createOauthErrorInfoJson();
      contentType = 'application/json';
    } else {
      response = ClientCredentialsServer.createOauthErrorInfoUrl();
      contentType = 'application/x-www-form-urlencoded';
    }
    request.respond(200, {
      'content-type': contentType
    }, response);
  },

  error404Handler: function(request) {
    request.respond(404, {
      'content-type': 'text/html'
    }, 'Not found');
  },

  error400Handler: function(request) {
    request.respond(400, {
      'content-type': 'text/html'
    }, 'Argument error');
  },

  error500Handler: function(request) {
    request.respond(500, {
      'content-type': 'text/html'
    }, 'Server error');
  },

  restore: function() {
    this.srv.restore();
  }
};
