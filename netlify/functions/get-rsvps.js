exports.handler = async function(event, context) {
  const SITE_ID = '390c47c6-ce28-4255-9d78-ff546b01cd5a';
  const TOKEN   = 'nfp_G8n63tUUBJiyLhzjzF25gJ7jFrZA8TWmea27';

  if (!siteId || !token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing SITE_ID or NETLIFY_TOKEN environment variables.' })
    };
  }

  try {
    const res = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/forms/rsvp/submissions?per_page=200`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Netlify API returned ${res.status}` })
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
