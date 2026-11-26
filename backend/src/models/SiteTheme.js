const mongoose = require('mongoose');

const siteThemeSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Theme name is required'],
    trim: true,
    maxlength: [80, 'Theme name cannot exceed 80 characters'],
  },
  preset: {
    type: String,
    enum: ['christmas'],
    default: 'christmas',
  },
  description: {
    type: String,
    trim: true,
    default: 'Festive spreading snow, flying Santa & reindeer sleigh on load, and 3D dancing sidebar Santa.',
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  scheduleMode: {
    type: String,
    enum: ['always', 'period'],
    default: 'period',
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  features: {
    snow: { type: Boolean, default: true },
    sleighIntro: { type: Boolean, default: true },
    dancingSanta: { type: Boolean, default: true },
    festiveDecor: { type: Boolean, default: true },
    introMusic: { type: Boolean, default: true },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

siteThemeSchema.index({ isEnabled: 1, isVisible: 1, updatedAt: -1 });

/**
 * Evaluate live operational state of a theme for the current timestamp.
 * Only active when Enabled, Visible, and within the active period (if period-based).
 */
siteThemeSchema.statics.computeThemeState = function computeThemeState(theme, now = new Date()) {
  if (!theme) {
    return { isCurrentlyActive: false, statusLabel: 'disabled' };
  }

  if (!theme.isEnabled) {
    return { isCurrentlyActive: false, statusLabel: 'disabled' };
  }

  if (!theme.isVisible) {
    return { isCurrentlyActive: false, statusLabel: 'hidden' };
  }

  if (theme.scheduleMode === 'period') {
    const start = theme.startDate ? new Date(theme.startDate) : null;
    const end = theme.endDate ? new Date(theme.endDate) : null;

    if (start && !Number.isNaN(start.getTime()) && now < start) {
      return { isCurrentlyActive: false, statusLabel: 'scheduled' };
    }
    if (end && !Number.isNaN(end.getTime()) && now > end) {
      return { isCurrentlyActive: false, statusLabel: 'expired' };
    }
  }

  return { isCurrentlyActive: true, statusLabel: 'active' };
};

module.exports = mongoose.model('SiteTheme', siteThemeSchema);
