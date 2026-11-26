const slugify = require('slugify');
const SiteTheme = require('../models/SiteTheme');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

let ioInstance = null;

exports.setIo = (io) => {
  ioInstance = io;
};

const formatThemeWithState = (themeDoc, now = new Date()) => {
  const theme = typeof themeDoc.toObject === 'function' ? themeDoc.toObject() : themeDoc;
  const state = SiteTheme.computeThemeState(theme, now);
  return {
    ...theme,
    ...state,
  };
};

const findCurrentlyActiveTheme = async () => {
  const now = new Date();
  const candidates = await SiteTheme.find({ isEnabled: true, isVisible: true })
    .sort({ updatedAt: -1 })
    .lean();

  for (const theme of candidates) {
    const state = SiteTheme.computeThemeState(theme, now);
    if (state.isCurrentlyActive) {
      return { ...theme, ...state };
    }
  }
  return null;
};

const broadcastActiveTheme = async () => {
  if (!ioInstance) return;
  try {
    const activeTheme = await findCurrentlyActiveTheme();
    ioInstance.emit('theme_updated', {
      activeTheme,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Theme socket broadcast warning:', err.message);
  }
};

const parseOptionalDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeFeatures = (raw = {}) => ({
  snow: raw.snow !== undefined ? Boolean(raw.snow) : true,
  sleighIntro: raw.sleighIntro !== undefined ? Boolean(raw.sleighIntro) : true,
  dancingSanta: raw.dancingSanta !== undefined ? Boolean(raw.dancingSanta) : true,
  festiveDecor: raw.festiveDecor !== undefined ? Boolean(raw.festiveDecor) : true,
  introMusic: raw.introMusic !== undefined ? Boolean(raw.introMusic) : true,
});

// @desc    Get currently active public seasonal theme (no auth required)
// @route   GET /api/v1/themes/active
exports.getActiveTheme = asyncHandler(async (req, res) => {
  const activeTheme = await findCurrentlyActiveTheme();
  res.status(200).json({
    status: 'success',
    serverTime: new Date().toISOString(),
    data: activeTheme,
  });
});

// @desc    Get all themes for admin panel
// @route   GET /api/v1/admin/themes
exports.getAllThemes = asyncHandler(async (req, res) => {
  const now = new Date();
  const themes = await SiteTheme.find().sort({ createdAt: -1 }).lean();
  const formatted = themes.map((t) => formatThemeWithState(t, now));

  res.status(200).json({
    status: 'success',
    count: formatted.length,
    serverTime: now.toISOString(),
    data: formatted,
  });
});

// @desc    Create a seasonal theme (e.g. Christmas)
// @route   POST /api/v1/admin/themes
exports.createTheme = asyncHandler(async (req, res, next) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    return next(new AppError('Theme name is required', 400));
  }

  const preset = req.body.preset === 'christmas' ? 'christmas' : 'christmas';
  const scheduleMode = req.body.scheduleMode === 'always' ? 'always' : 'period';
  const startDate = parseOptionalDate(req.body.startDate);
  const endDate = parseOptionalDate(req.body.endDate);

  if (scheduleMode === 'period' && (!startDate || !endDate)) {
    return next(new AppError('Start date and end date are required for period-based scheduling', 400));
  }

  if (startDate && endDate && endDate < startDate) {
    return next(new AppError('End date must be after start date', 400));
  }

  const baseKey = slugify(req.body.key || name, { lower: true, strict: true }) || 'theme';
  let uniqueKey = baseKey;
  let suffix = 2;
  while (await SiteTheme.exists({ key: uniqueKey })) {
    uniqueKey = `${baseKey}-${suffix++}`;
  }

  const theme = await SiteTheme.create({
    key: uniqueKey,
    name,
    preset,
    description: typeof req.body.description === 'string' && req.body.description.trim()
      ? req.body.description.trim()
      : 'Festive spreading snow, flying Santa & reindeer sleigh on load, and 3D dancing sidebar Santa.',
    isEnabled: Boolean(req.body.isEnabled),
    isVisible: req.body.isVisible !== undefined ? Boolean(req.body.isVisible) : true,
    scheduleMode,
    startDate,
    endDate,
    features: normalizeFeatures(req.body.features),
    createdBy: req.user?._id || null,
  });

  await broadcastActiveTheme();

  res.status(201).json({
    status: 'success',
    data: formatThemeWithState(theme),
  });
});

// @desc    Update theme configuration & schedule
// @route   PATCH /api/v1/admin/themes/:id
exports.updateTheme = asyncHandler(async (req, res, next) => {
  const theme = await SiteTheme.findById(req.params.id);
  if (!theme) {
    return next(new AppError('Theme not found', 404));
  }

  const nextScheduleMode = req.body.scheduleMode !== undefined
    ? (req.body.scheduleMode === 'always' ? 'always' : 'period')
    : theme.scheduleMode;

  const nextStart = req.body.startDate !== undefined ? parseOptionalDate(req.body.startDate) : theme.startDate;
  const nextEnd = req.body.endDate !== undefined ? parseOptionalDate(req.body.endDate) : theme.endDate;

  if (nextScheduleMode === 'period' && (!nextStart || !nextEnd)) {
    return next(new AppError('Start date and end date are required for period-based scheduling', 400));
  }

  if (nextStart && nextEnd && nextEnd < nextStart) {
    return next(new AppError('End date must be after start date', 400));
  }

  if (typeof req.body.name === 'string' && req.body.name.trim()) {
    theme.name = req.body.name.trim();
  }
  if (typeof req.body.description === 'string') {
    theme.description = req.body.description.trim();
  }
  if (req.body.isEnabled !== undefined) {
    theme.isEnabled = Boolean(req.body.isEnabled);
  }
  if (req.body.isVisible !== undefined) {
    theme.isVisible = Boolean(req.body.isVisible);
  }
  theme.scheduleMode = nextScheduleMode;
  theme.startDate = nextStart;
  theme.endDate = nextEnd;

  if (req.body.features && typeof req.body.features === 'object') {
    theme.features = normalizeFeatures({ ...theme.features?.toObject?.(), ...req.body.features });
  }

  await theme.save();
  await broadcastActiveTheme();

  res.status(200).json({
    status: 'success',
    data: formatThemeWithState(theme),
  });
});

// @desc    Toggle Enable / Disable button
// @route   PATCH /api/v1/admin/themes/:id/enable
exports.toggleThemeEnable = asyncHandler(async (req, res, next) => {
  const theme = await SiteTheme.findById(req.params.id);
  if (!theme) {
    return next(new AppError('Theme not found', 404));
  }

  theme.isEnabled = req.body?.isEnabled !== undefined ? Boolean(req.body.isEnabled) : !theme.isEnabled;
  await theme.save();
  await broadcastActiveTheme();

  res.status(200).json({
    status: 'success',
    data: formatThemeWithState(theme),
  });
});

// @desc    Toggle Visible / Hidden button
// @route   PATCH /api/v1/admin/themes/:id/visible
exports.toggleThemeVisible = asyncHandler(async (req, res, next) => {
  const theme = await SiteTheme.findById(req.params.id);
  if (!theme) {
    return next(new AppError('Theme not found', 404));
  }

  theme.isVisible = req.body?.isVisible !== undefined ? Boolean(req.body.isVisible) : !theme.isVisible;
  await theme.save();
  await broadcastActiveTheme();

  res.status(200).json({
    status: 'success',
    data: formatThemeWithState(theme),
  });
});

// @desc    Delete a theme
// @route   DELETE /api/v1/admin/themes/:id
exports.deleteTheme = asyncHandler(async (req, res, next) => {
  const theme = await SiteTheme.findByIdAndDelete(req.params.id);
  if (!theme) {
    return next(new AppError('Theme not found', 404));
  }

  await broadcastActiveTheme();

  res.status(200).json({
    status: 'success',
    message: 'Theme deleted successfully',
  });
});
