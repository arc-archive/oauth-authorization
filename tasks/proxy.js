const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({
  secure: false
});
proxy.on('proxyRes', function(proxyRes, req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
});
const http = require('http');
var server = http.createServer(function(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
      Object.keys(req.headers).join(', ') + ', authorization');
    res.end();
    return;
  }
  const redirect = req.url.substr(1);
  const authorityIndex = redirect.indexOf('/', 8);
  var authority = redirect.substr(0, authorityIndex);
  var path = redirect.substr(authorityIndex);
  // console.log(authority, 'and', path);
  req.url = path;
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(req, res, {
    target: authority
  });
});

server.listen(5050);
