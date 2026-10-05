import http from 'node:test';
import { getProxyForUrl } from 'proxy-from-env';
// ^ or: var getProxyForUrl = require('proxy-from-env').getProxyForUrl;

var some_url = 'http://example.com/something';

// // Example, if there is a proxy server at 10.0.0.1:1234, then setting the
// // http_proxy environment variable causes the request to go through a proxy.
// process.env.http_proxy = 'http://10.0.0.1:1234';
// 
// // But if the host to be proxied is listed in NO_PROXY, then the request is
// // not proxied (but a direct request is made).
// process.env.no_proxy = 'example.com';

var proxy_url = getProxyForUrl(some_url);  // <-- Our magic.
if (proxy_url) {
  // Should be proxied through proxy_url.
  var parsed_some_url = new URL(some_url);
  var parsed_proxy_url = new URL(proxy_url);
  // A HTTP proxy is quite simple. It is similar to a normal request, except the
  // path is an absolute URL, and the proxied URL's host is put in the header
  // instead of the server's actual host.
  httpOptions = {
    protocol: parsed_proxy_url.protocol,
    hostname: parsed_proxy_url.hostname,
    port: parsed_proxy_url.port,
    path: parsed_some_url.href,
    headers: {
      Host: parsed_some_url.host,  // = host name + optional port.
    },
  };
} else {
  // Direct request.
  httpOptions = some_url;
}
http.get(httpOptions, function(res) {
  var responses = [];
  res.on('data', function(chunk) { responses.push(chunk); });
  res.on('end', function() { console.log(responses.join(''));  });
});
