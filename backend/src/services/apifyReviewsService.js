const { ApifyClient } = require('apify-client');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Service to fetch Google Reviews using Apify
 */
class ApifyReviewsService {
  constructor() {
    this.token = process.env.APIFY_API_TOKEN;
    this.actorId = process.env.APIFY_ACTOR_ID || 'godberry/google-reviews-scraper';
    this.placeId = process.env.GOOGLE_PLACE_ID;
    this.isEnabled = process.env.APIFY_ENABLED === 'true';
    
    if (this.isEnabled && this.token) {
      this.client = new ApifyClient({ token: this.token });
    }
  }

  /**
   * Fetches reviews for the configured Place ID
   * @param {number} maxReviews Maximum number of reviews to fetch
   * @returns {Promise<Array>} Array of normalized review objects
   */
  async fetchReviews(maxReviews = null) {
    if (!this.isEnabled) {
      throw new Error('Apify integration is disabled in settings');
    }

    if (!this.client || !this.token || this.token === 'apify_api_YOUR_TOKEN_HERE') {
      throw new Error('Valid Apify API token is not configured in .env');
    }

    if (!this.placeId) {
      throw new Error('Google Place ID is not configured in .env');
    }

    const limit = maxReviews || parseInt(process.env.APIFY_REVIEWS_LIMIT) || 100;
    
    console.log(`Starting Apify run for Place ID: ${this.placeId} (Limit: ${limit})`);

    try {
      // Start the actor and wait for it to finish
      const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${this.placeId}`;
      const run = await this.client.actor(this.actorId).call({
        placeUrls: [mapsUrl],
        maxReviews: limit,
        language: 'en'
      });

      console.log(`Apify run ${run.id} finished. Fetching dataset...`);

      // Fetch the results from the dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      console.log(`Successfully fetched ${items.length} raw reviews from Apify`);
      
      if (items.length > 0) {
          console.log('SAMPLE REVIEW DATA:', JSON.stringify(items[0], null, 2));
          console.log('AVAILABLE FIELDS:', Object.keys(items[0]));
      }
      
      // Normalize to our expected format
      return this.normalizeApifyReviews(items);
    } catch (error) {
      console.error('Error fetching reviews from Apify:', error.message);
      throw new Error('Apify fetch failed: ' + error.message);
    }
  }

  /**
   * Normalizes the specific output format of the godberry actor
   * to match our MongoDB schema
   */
  normalizeApifyReviews(items) {
    const reviews = items.map(item => {
      // For authorName:
      const name = item.reviewerName || 'Google Customer';
      
      // For time:
      let dateObj;
      try {
        // use publishedAtDate if available, since reviewDate is usually text ("a month ago")
        dateObj = item.publishedAtDate ? new Date(item.publishedAtDate) : new Date();
      } catch (e) {
        dateObj = new Date();
      }

      // For reviewId:
      const uniqueString = String(name) + String(dateObj.toISOString());
      let rId = item.reviewId ? String(item.reviewId) : `apify_${Buffer.from(uniqueString).toString('base64').substring(0, 15)}`;
      
      // For rating:
      let rating = Number(item.reviewRating);
      if (isNaN(rating)) rating = 0;
      rating = Math.max(1, Math.min(5, rating)); // Clamp between 1-5

      // For text:
      const text = item.reviewText || '';

      let pPhoto = item.reviewerPhotoUrl || '';
      let rImages = [];
      if (Array.isArray(item.reviewImageUrls) && item.reviewImageUrls.length > 0) {
          rImages = [...item.reviewImageUrls];
      } else if (Array.isArray(item.reviewImages) && item.reviewImages.length > 0) {
          rImages = [...item.reviewImages];
      }

      if (rImages.length > 0) {
          if (!pPhoto) {
              pPhoto = rImages.shift();
          } else {
              if (rImages[0] === pPhoto) {
                  rImages.shift();
              } else if (rImages[0].includes('/a/') || rImages[0].includes('/a-/') || rImages[0].match(/=s\d+-c/)) {
                  rImages.shift();
              }
          }
      }

      return {
        reviewId: rId,
        authorName: name,
        authorUrl: item.reviewerUrl || '',
        profilePhotoUrl: pPhoto,
        reviewImageUrls: rImages,
        rating: rating,
        text: text,
        time: dateObj,
        reviewDateStr: item.reviewDate || '',
        language: item.language || 'en',
        responseFromOwner: item.ownerResponse ? {
          text: item.ownerResponse,
          time: item.ownerResponseDate ? new Date(item.ownerResponseDate) : new Date()
        } : null,
        isSynced: true,
        syncedAt: new Date(),
        isVisible: true
      };
    });

    console.log('Sample transformed review:', {
        reviewId: reviews[0]?.reviewId,
        authorName: reviews[0]?.authorName,
        rating: reviews[0]?.rating,
        text: reviews[0]?.text?.substring(0, 50)
    });

    return reviews;
  }
}

module.exports = new ApifyReviewsService();
