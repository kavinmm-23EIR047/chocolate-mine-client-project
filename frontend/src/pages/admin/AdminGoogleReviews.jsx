import React, { useState, useEffect } from 'react';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';
import googleReviewsService from '../../services/googleReviewsService';

const AdminGoogleReviews = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  
  const { 
    reviews, 
    stats, 
    loading, 
    pagination, 
    refetch, 
    refetchStats 
  } = useGoogleReviews({ type: 'all', limit: 50, fetchOnMount: true });

  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await googleReviewsService.syncReviews();
      refetch();
      refetchStats();
      alert('Google Reviews synced successfully!');
    } catch (err) {
      alert('Failed to sync: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await googleReviewsService.toggleVisibility(id);
      refetch();
    } catch (err) {
      alert('Failed to toggle visibility');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await googleReviewsService.deleteReview(id);
        refetch();
        refetchStats();
      } catch (err) {
        alert('Failed to delete review');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Google Reviews Management</h1>
        <div className="flex gap-4">
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Force Sync Now'}
          </button>
          <a 
            href={googleReviewsService.getExportUrl()} 
            target="_blank" 
            rel="noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          >
            Export to Excel
          </a>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Total Reviews</h3>
            <p className="text-2xl font-bold">{stats.totalReviews}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Average Rating</h3>
            <p className="text-2xl font-bold">{stats.averageRating} ⭐</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Last Sync</h3>
            <p className="text-sm mt-1">{stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Never'}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Integration Status</h3>
            <p className="text-green-600 font-bold mt-1">{stats.isEnabled ? 'Active' : 'Disabled'}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-4">Customer</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Review</th>
              <th className="p-4">Date</th>
              <th className="p-4">Visible</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center">No reviews found</td></tr>
            ) : (
              reviews.map(review => (
                <tr key={review._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{review.authorName}</td>
                  <td className="p-4">{'⭐'.repeat(review.rating)}</td>
                  <td className="p-4 text-sm max-w-xs truncate" title={review.text}>{review.text || '-'}</td>
                  <td className="p-4">{new Date(review.time).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleVisibility(review._id)}
                      className={`px-3 py-1 rounded text-sm ${review.isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {review.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleDelete(review._id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGoogleReviews;
