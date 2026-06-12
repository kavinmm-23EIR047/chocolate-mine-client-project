const { ApifyClient } = require('apify-client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testConnection() {
  console.log('--- APIFY CONNECTION TEST ---');
  
  const token = process.env.APIFY_API_TOKEN;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const actorId = process.env.APIFY_ACTOR_ID || 'godberry/google-reviews-scraper';
  
  console.log(`Token: ${token ? token.substring(0, 15) + '...' : 'NOT SET'}`);
  console.log(`Place ID: ${placeId || 'NOT SET'}`);
  
  if (!token || token === 'apify_api_YOUR_TOKEN_HERE') {
    console.error('❌ ERROR: You must replace APIFY_API_TOKEN in .env with your real token from apify.com');
    return;
  }
  
  if (!placeId) {
    console.error('❌ ERROR: GOOGLE_PLACE_ID is not set in .env');
    return;
  }
  
  try {
    console.log('Initializing client...');
    const client = new ApifyClient({ token });
    
    // Test if we can fetch user profile to verify token
    console.log('Verifying token...');
    const user = await client.user('me').get();
    console.log(`✅ Apify connection successful! Logged in as: ${user.username || user.id}`);
    
    // Optional: Actually run a quick test scrape
    console.log(`\nStarting quick test scrape for Place ID: ${placeId} (fetching max 5 reviews)...`);
    console.log('This usually takes 10-30 seconds...');
    
    const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const run = await client.actor(actorId).call({
      placeUrls: [mapsUrl],
      maxReviews: 5,
      language: 'en'
    });
    
    console.log(`Run ${run.id} finished. Fetching data...`);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`\n✅ Successfully fetched ${items.length} reviews via Apify!`);
    
    if (items.length > 0) {
      console.log('\nSample Review:');
      console.log(`- Author: ${items[0].name}`);
      console.log(`- Rating: ${items[0].stars} stars`);
      console.log(`- Text: ${items[0].text ? items[0].text.substring(0, 50) + '...' : '(No text)'}`);
    }
    
    console.log('\n🎉 Test completed successfully! You can proceed to the next step.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
    if (error.message.includes('401')) {
      console.error('This usually means your API token is invalid or expired.');
    }
  }
}

testConnection();
