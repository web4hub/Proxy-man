// https-client.mjs

import https from 'node:https';
import { URL } from 'node:url';

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30_000,
  minVersion: 'TLSv1.2',
});

/**
 * Perform an HTTPS request to any HTTPS hostname.
 *
 * Examples:
 *   httpsRequest('https://web4.si/')
 *   httpsRequest('https://web4app.ch/api')
 *   httpsRequest('https://example.net/')
 */
export function httpsRequest(
  target,
  {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 30_000,
  } = {},
) {
  return new Promise((resolve, reject) => {
    let url;

    try {
      url = new URL(target);
    } catch {
      reject(new Error(`Invalid URL: ${target}`));
      return;
    }

    if (url.protocol !== 'https:') {
      reject(
        new Error(
          `Only HTTPS URLs are supported: ${url.protocol}`,
        ),
      );
      return;
    }

    const request = https.request(
      url,
      {
        method,
        agent,

        headers: {
          Accept: 'application/json',
          'User-Agent': 'Web4-HTTPS-Client/1.0',
          ...headers,
        },

        timeout,

        // Keep normal TLS certificate verification enabled.
        rejectUnauthorized: true,
      },

      (response) => {
        const chunks = [];

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);

          resolve({
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            headers: response.headers,
            body: buffer.toString('utf8'),
          });
        });
      },
    );

    request.on('timeout', () => {
      request.destroy(
        new Error(`Request timed out after ${timeout}ms`),
      );
    });

    request.on('error', reject);

    if (body !== null) {
      const payload =
        typeof body === 'string'
          ? body
          : JSON.stringify(body);

      request.write(payload);
    }

    request.end();
  });
}

// --------------------------------------------------
// Example usage
// --------------------------------------------------

const targets = [
  'https://web4.si/',
  'https://web4app.ch/',
  'https://example.net/',
];

for (const target of targets) {
  try {
    console.log(`\n→ ${target}`);

    const response = await httpsRequest(target);

    console.log('Status:', response.statusCode);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Body:', response.body.slice(0, 500));
  } catch (error) {
    console.error(
      `Request failed for ${target}:`,
      error.message,
    );
  }
}
