const axios = require('axios');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

class SocialMediaService {
  constructor() {
    this.gaClient = null;
    this.initGaClient();
  }

  initGaClient() {
    try {
      // Initialize GA4 client if credentials are provided in env
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.gaClient = new BetaAnalyticsDataClient();
      } else if (process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY) {
        this.gaClient = new BetaAnalyticsDataClient({
          credentials: {
            client_email: process.env.GA_CLIENT_EMAIL,
            private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google Analytics client:', error.message);
    }
  }

  async getGoogleAnalyticsMetrics(dateRange = '30daysAgo', endDate = 'today') {
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!propertyId || !this.gaClient) {
      return {
        error: true,
        message: 'Google Analytics credentials not fully configured.',
        data: {
          totalUsers: 0,
          pageViews: 0,
          activeUsers: 0,
          sessions: 0,
        }
      };
    }

    try {
      const [response] = await this.gaClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: dateRange, endDate }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'sessions' }
        ],
      });

      const row = response.rows && response.rows.length > 0 ? response.rows[0] : null;
      
      return {
        error: false,
        data: {
          totalUsers: row ? parseInt(row.metricValues[0].value) : 0,
          pageViews: row ? parseInt(row.metricValues[1].value) : 0,
          activeUsers: row ? parseInt(row.metricValues[2].value) : 0,
          sessions: row ? parseInt(row.metricValues[3].value) : 0,
        }
      };
    } catch (error) {
      console.error('Error fetching Google Analytics data:', error.message);
      return {
        error: true,
        message: 'Failed to fetch Google Analytics data.',
        data: {
          totalUsers: 0,
          pageViews: 0,
          activeUsers: 0,
          sessions: 0,
        }
      };
    }
  }

  async getInstagramMetrics() {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!accessToken || !instagramAccountId) {
      return {
        error: true,
        message: 'Instagram credentials not fully configured.',
        data: {
          followersCount: 0,
          mediaCount: 0,
          profileViews: 0,
          websiteClicks: 0,
          reach: 0,
        }
      };
    }

    try {
      // Fetch basic account info
      const basicInfoUrl = `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=followers_count,media_count&access_token=${accessToken}`;
      const basicResponse = await axios.get(basicInfoUrl);

      // Fetch insights (reach, profile_views, website_clicks)
      const insightsUrl = `https://graph.facebook.com/v19.0/${instagramAccountId}/insights?metric=reach,profile_views,website_clicks&period=day&access_token=${accessToken}`;
      
      let reach = 0;
      let profileViews = 0;
      let websiteClicks = 0;

      try {
        const insightsResponse = await axios.get(insightsUrl);
        const data = insightsResponse.data.data;
        
        const getMetricSum = (metricName) => {
          const metric = data.find(m => m.name === metricName);
          if (metric && metric.values) {
            return metric.values.reduce((sum, val) => sum + val.value, 0);
          }
          return 0;
        };

        reach = getMetricSum('reach');
        profileViews = getMetricSum('profile_views');
        websiteClicks = getMetricSum('website_clicks');
      } catch (insightError) {
        console.error('Error fetching Instagram insights (Insights might not be available or permissions missing):', insightError.message);
      }

      return {
        error: false,
        data: {
          followersCount: basicResponse.data.followers_count || 0,
          mediaCount: basicResponse.data.media_count || 0,
          profileViews,
          websiteClicks,
          reach,
        }
      };
    } catch (error) {
      console.error('Error fetching Instagram data:', error.message);
      return {
        error: true,
        message: 'Failed to fetch Instagram data.',
        data: {
          followersCount: 0,
          mediaCount: 0,
          profileViews: 0,
          websiteClicks: 0,
          reach: 0,
        }
      };
    }
  }
}

module.exports = new SocialMediaService();
