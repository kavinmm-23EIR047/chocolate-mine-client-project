const mongoose = require('mongoose');

const googleReviewSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorUrl: {
      type: String
    },
    profilePhotoUrl: {
      type: String
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    text: {
      type: String
    },
    time: {
      type: Date,
      required: true
    },
    language: {
      type: String
    },
    responseFromOwner: {
      text: { type: String },
      time: { type: Date }
    },
    isSynced: {
      type: Boolean,
      default: true
    },
    syncedAt: {
      type: Date,
      default: Date.now
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    tags: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for faster querying
googleReviewSchema.index({ rating: -1 });
googleReviewSchema.index({ time: -1 });
googleReviewSchema.index({ isVisible: 1 });

module.exports = mongoose.model('GoogleReview', googleReviewSchema);
