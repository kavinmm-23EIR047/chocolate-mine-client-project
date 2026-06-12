import React from 'react';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';

const GoogleReviewsWidget = () => {
  const { reviews, stats, loading } = useGoogleReviews({ type: 'latest' });

  if (loading || !stats) return <div className="p-4 text-center">Loading reviews...</div>;
  if (reviews.length === 0) return null;

  return (
    <div className="my-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">What Our Customers Say on Google</h2>
        <div className="mt-4 flex justify-center items-center gap-2">
          <span className="text-2xl font-bold">{stats.averageRating}</span>
          <span className="text-yellow-400 text-2xl">{'★'.repeat(Math.round(stats.averageRating))}</span>
          <span className="text-gray-500">({stats.totalReviews} reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.slice(0, 3).map((review) => (
          <div key={review._id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              {review.profilePhotoUrl ? (
                <img src={review.profilePhotoUrl} alt={review.authorName} className="w-12 h-12 rounded-full mr-4" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4">
                  {review.authorName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900">{review.authorName}</h3>
                <div className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm italic">"{review.text}"</p>
            <div className="mt-4 text-xs text-gray-400 text-right">
              {new Date(review.time).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <a 
          href={`https://search.google.com/local/reviews?placeid=${import.meta.env.VITE_GOOGLE_PLACE_ID || 'ChIJAz8zUx1ZqDsR_GA6U31D-dA'}`} 
          target="_blank" 
          rel="noreferrer"
          className="inline-block bg-white text-blue-600 font-semibold border border-blue-600 px-6 py-2 rounded-full hover:bg-blue-50 transition"
        >
          Read more on Google
        </a>
      </div>
    </div>
  );
};

export default GoogleReviewsWidget;
