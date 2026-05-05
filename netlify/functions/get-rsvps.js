const https = require('https');

function httpsGet(token, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path,
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
    // Get form ID dynamically
    const forms = await httpsGet(token, `/api/v1/sites/${siteId}/forms`);
    const form = forms.find(f => f.name === 'rsvp');
    if (!form) {
      return { statusCode: 404, body: JSON.stringify({ error: 'rsvp form not found' }) };
    }

    // Fetch all submissions using form ID
    let all = [];
    let offset = 0;
    while (true) {
      const page = await httpsGet(token, `/api/v1/forms/${form.id}/submissions?per_page=100&offset=${offset}`);
      all = all.concat(page);
      if (page.length < 100) break;
      offset += 100;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(all)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
