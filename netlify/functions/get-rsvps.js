const https = require('https');

exports.handler = async function(event, context) {
  const siteId = process.env.NETLIFY_SITE_ID;
  const token  = process.env.NETLIFY_TOKEN;

  if (!siteId || !token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing NETLIFY_SITE_ID or NETLIFY_TOKEN environment variables.' })
    };
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${siteId}/forms`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: `Netlify API returned ${res.statusCode}`, detail: body, siteId: siteId.slice(0,8) + '...' })
          });
          return;
        }
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      });
    });

    req.end();
  });
};
