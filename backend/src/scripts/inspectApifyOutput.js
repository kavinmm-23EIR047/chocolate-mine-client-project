const { ApifyClient } = require('apify-client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function inspectApifyOutput() {
  console.log('--- APIFY OUTPUT INSPECTOR ---');
  
  const token = process.env.APIFY_API_TOKEN;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const actorId = process.env.APIFY_ACTOR_ID || 'godberry/google-reviews-scraper';
  
  if (!token || token === 'apify_api_YOUR_TOKEN_HERE') {
    console.error('❌ ERROR: You must replace APIFY_API_TOKEN in .env with your real token');
    return;
  }
  
  try {
    const client = new ApifyClient({ token });
    const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    
    console.log(`Fetching 5 reviews for Place ID: ${placeId}...`);
    const run = await client.actor(actorId).call({
      placeUrls: [mapsUrl],
      maxReviews: 5,
      language: 'en'
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items.length > 0) {
      console.log('\n--- FIRST REVIEW EXACT STRUCTURE ---');
      console.log(JSON.stringify(items[0], null, 2));
      console.log('\n--- ALL AVAILABLE FIELDS ---');
      console.log(Object.keys(items[0]).join('\n'));
    } else {
      console.log('No reviews found to inspect.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectApifyOutput();
