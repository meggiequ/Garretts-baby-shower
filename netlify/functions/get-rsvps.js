const https = require('https');

function fetchPage(siteId, token, offset) {
  return new Promise((resolve, reject) => {
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
          reject(new Error(`Netlify API returned ${res.statusCode}: ${body}`));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid JSON response')); }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

exports.handler = async function(event, context) {
  const siteId = process.env.NETLIFY_SITE_ID;
  const token  = process.env.NETLIFY_TOKEN;

  if (!siteId || !token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing NETLIFY_SITE_ID or NETLIFY_TOKEN environment variables.' })
    };
  }

  try {
    let all = [];
    let offset = 0;
    while (true) {
      const page = await fetchPage(siteId, token, offset);
      all = all.concat(page);
      if (page.length < 100) break;
      offset += 100;
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(all)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
