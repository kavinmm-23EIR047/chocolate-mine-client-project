import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Power,
  Calendar,
  Clock,
  Snowflake,
  Check,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import themeService from '../../services/themeService';
import { useSiteTheme } from '../../context/SiteThemeContext';

const toLocalDatetimeInput = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const getDefaultChristmasDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, now.getMonth(), now.getDate(), 0, 0);
  const end = new Date(year, 11, 31, 23, 59);
  if (end < start) {
    end.setFullYear(year + 1);
  }
  return {
    startDate: toLocalDatetimeInput(start),
    endDate: toLocalDatetimeInput(end),
  };
};

const STATUS_BADGES = {
  active: {
    label: 'Active Live Now',
    cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  scheduled: {
    label: 'Scheduled (Upcoming)',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  expired: {
    label: 'Period Ended',
    cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
  hidden: {
    label: 'Hidden (Not Visible)',
    cls: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  },
  disabled: {
    label: 'Disabled',
    cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  },
};

const createInitialForm = () => {
  const { startDate, endDate } = getDefaultChristmasDates();
  return {
    name: 'Christmas Wonderland',
    preset: 'christmas',
    description: 'Spreading snow & golden stars, flying Santa & reindeer sleigh on load, and a 3D dancing Santa in the sidebar.',
    isEnabled: true,
    isVisible: true,
    scheduleMode: 'period',
    startDate,
    endDate,
    features: {
      snow: true,
      sleighIntro: true,
      dancingSanta: true,
      festiveDecor: true,
      introMusic: true,
    },
  };
};

const formatDisplayDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(createInitialForm);
  const { refreshActiveTheme } = useSiteTheme();

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await themeService.getThemes();
      setThemes(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const resetForm = () => {
    setForm(createInitialForm());
    setEditId(null);
    setShowForm(false);
  };

  const openCreateChristmas = () => {
    setForm(createInitialForm());
    setEditId(null);
    setShowForm(true);
  };

  const handleEdit = (theme) => {
    setEditId(theme._id);
    setForm({
      name: theme.name || 'Christmas Wonderland',
      preset: theme.preset || 'christmas',
      description: theme.description || '',
      isEnabled: Boolean(theme.isEnabled),
      isVisible: Boolean(theme.isVisible),
      scheduleMode: theme.scheduleMode || 'period',
      startDate: toLocalDatetimeInput(theme.startDate),
      endDate: toLocalDatetimeInput(theme.endDate),
      features: {
        snow: theme.features?.snow ?? true,
        sleighIntro: theme.features?.sleighIntro ?? true,
        dancingSanta: theme.features?.dancingSanta ?? true,
        festiveDecor: theme.features?.festiveDecor ?? true,
        introMusic: theme.features?.introMusic ?? true,
      },
    });
    setShowForm(true);
  };

  const applyQuickPeriod = (days) => {
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 0, 0);
    setForm((prev) => ({
      ...prev,
      scheduleMode: 'period',
      startDate: toLocalDatetimeInput(start),
      endDate: toLocalDatetimeInput(end),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return toast.error('Theme name is required');
    }
    if (form.scheduleMode === 'period') {
      if (!form.startDate || !form.endDate) {
        return toast.error('Please select both Start Date and End Date for period mode');
      }
      if (new Date(form.endDate) < new Date(form.startDate)) {
        return toast.error('End Date must be after Start Date');
      }
    }

    const payload = {
      name: form.name.trim(),
      preset: form.preset,
      description: form.description.trim(),
      isEnabled: form.isEnabled,
      isVisible: form.isVisible,
      scheduleMode: form.scheduleMode,
      startDate: form.scheduleMode === 'period' && form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.scheduleMode === 'period' && form.endDate ? new Date(form.endDate).toISOString() : null,
      features: form.features,
    };

    try {
      setSaving(true);
      if (editId) {
        await themeService.updateTheme(editId, payload);
        toast.success('Theme updated successfully!');
      } else {
        await themeService.createTheme(payload);
        toast.success('Christmas theme created!');
      }
      resetForm();
      await fetchThemes();
      refreshActiveTheme();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnable = async (theme) => {
    try {
      setBusyId(theme._id);
      const res = await themeService.toggleEnable(theme._id);
      const updated = res.data?.data;
      toast.success(updated?.isEnabled ? `"${theme.name}" Enabled` : `"${theme.name}" Disabled`);
      await fetchThemes();
      refreshActiveTheme();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle enable');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVisible = async (theme) => {
    try {
      setBusyId(theme._id);
      const res = await themeService.toggleVisible(theme._id);
      const updated = res.data?.data;
      toast.success(updated?.isVisible ? `"${theme.name}" is now Visible` : `"${theme.name}" is now Hidden`);
      await fetchThemes();
      refreshActiveTheme();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle visibility');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (theme) => {
    if (!window.confirm(`Delete theme "${theme.name}"?`)) return;
    try {
      setBusyId(theme._id);
      await themeService.deleteTheme(theme._id);
      toast.success('Theme deleted');
      await fetchThemes();
      refreshActiveTheme();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete theme');
    } finally {
      setBusyId(null);
    }
  };

  const featureItems = [
    { key: 'snow', label: 'Spreading Snow & Stars', desc: 'Gentle drifting snowflakes & golden sparkles across storefront' },
    { key: 'sleighIntro', label: 'Santa + Reindeer on Start', desc: 'Animated Santa & deer sleigh glides across screen on load' },
    { key: 'introMusic', label: 'Christmas Intro Song (6s)', desc: 'Plays a 6-second Jingle Bells melody when site starts' },
    { key: 'dancingSanta', label: '3D Dancing Sidebar Santa', desc: 'Interactive 3D-style dancing Santa in storefront side corner' },
    { key: 'festiveDecor', label: 'Festive Icicles & Garlands', desc: 'Corner frost icicles & seasonal storefront trim' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-heading tracking-tight">Seasonal Themes</h1>
              <p className="text-xs font-semibold text-muted">
                Create Christmas themes, control visibility & enable state, and run period-based schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-extrabold text-heading hover:border-primary/40 transition-all"
          >
            <ExternalLink size={14} />
            <span>Open Storefront</span>
          </a>
          <button
            type="button"
            onClick={fetchThemes}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-extrabold text-heading hover:border-primary/40 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateChristmas}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-button-text text-xs font-black shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Theme</span>
          </button>
        </div>
      </div>

      {/* Create / Edit Theme Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Snowflake size={18} className="text-sky-500" />
                <h2 className="text-lg font-black text-heading">
                  {editId ? 'Edit Seasonal Theme' : 'Create Christmas Theme'}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 rounded-xl text-muted hover:text-heading hover:bg-border/40 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-muted mb-1.5">
                  Theme Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Christmas Wonderland"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-sm font-bold text-heading outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-muted mb-1.5">
                  Theme Template
                </label>
                <select
                  value={form.preset}
                  onChange={(e) => setForm((p) => ({ ...p, preset: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-sm font-bold text-heading outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="christmas">Christmas (Snow + Santa & Deer Sleigh + 3D Dancing Santa)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Festive details..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-sm font-semibold text-heading outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Period-Based Work Scheduling */}
            <div className="p-4 rounded-2xl bg-card-soft border border-border/70 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-heading">
                    Activation Schedule (Period-Based Work)
                  </span>
                </div>

                <div className="inline-flex p-1 rounded-xl bg-card border border-border">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, scheduleMode: 'period' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      form.scheduleMode === 'period'
                        ? 'bg-primary text-button-text shadow-xs'
                        : 'text-muted hover:text-heading'
                    }`}
                  >
                    Period Based (Dates)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, scheduleMode: 'always' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      form.scheduleMode === 'always'
                        ? 'bg-primary text-button-text shadow-xs'
                        : 'text-muted hover:text-heading'
                    }`}
                  >
                    Always (Manual)
                  </button>
                </div>
              </div>

              {form.scheduleMode === 'period' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={form.startDate}
                        onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-xs sm:text-sm font-bold text-heading outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={form.endDate}
                        onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-xs sm:text-sm font-bold text-heading outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-muted">Quick Period:</span>
                    {[
                      { label: 'Next 7 Days', days: 7 },
                      { label: 'Next 15 Days', days: 15 },
                      { label: 'Next 30 Days', days: 30 },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => applyQuickPeriod(preset.days)}
                        className="px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-bold text-heading hover:border-primary/50 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Christmas Features Toggles */}
            <div className="space-y-2.5">
              <span className="block text-xs font-black uppercase tracking-wider text-muted">
                Included Christmas Features
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureItems.map((item) => {
                  const checked = Boolean(form.features[item.key]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-primary/5 border-primary/40'
                          : 'bg-card border-border opacity-75'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            features: { ...p.features, [item.key]: e.target.checked },
                          }))
                        }
                        className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-black text-heading">{item.label}</p>
                        <p className="text-[11px] font-medium text-muted mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Enable & Visible Switches */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isEnabled: !p.isEnabled }))}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                    form.isEnabled
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-card border-border text-muted'
                  }`}
                >
                  <Power size={14} />
                  <span>{form.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isVisible: !p.isVisible }))}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                    form.isVisible
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-card border-border text-muted'
                  }`}
                >
                  {form.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{form.isVisible ? 'Visible to Users' : 'Hidden'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-heading cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-button-text text-xs font-black shadow-md cursor-pointer disabled:opacity-60"
                >
                  <Check size={15} />
                  <span>{saving ? 'Saving...' : editId ? 'Update Theme' : 'Save Christmas Theme'}</span>
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Theme Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : themes.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Snowflake size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-heading">No Seasonal Themes Created Yet</h3>
            <p className="text-xs font-semibold text-muted">
              Create your Christmas theme to activate spreading snow, flying Santa + reindeer sleigh on load, and the 3D dancing sidebar Santa on a custom period schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateChristmas}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-button-text text-xs font-black shadow-md cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Christmas Theme</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {themes.map((theme) => {
            const badge = STATUS_BADGES[theme.statusLabel] || STATUS_BADGES.disabled;
            const isBusy = busyId === theme._id;
            return (
              <div
                key={theme._id}
                className={`bg-card border rounded-2xl p-5 space-y-4 shadow-sm transition-all ${
                  theme.isCurrentlyActive
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        <Snowflake size={11} />
                        {theme.preset}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.isCurrentlyActive ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                        {badge.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-heading">{theme.name}</h3>
                    {theme.description && (
                      <p className="text-xs font-medium text-muted leading-relaxed">{theme.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(theme)}
                      disabled={isBusy}
                      className="p-2 rounded-xl bg-card-soft border border-border text-heading hover:border-primary/40 cursor-pointer"
                      title="Edit Theme & Period"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(theme)}
                      disabled={isBusy}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Delete Theme"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Period Details */}
                <div className="p-3 rounded-xl bg-card-soft border border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-extrabold text-heading">
                    <Clock size={14} className="text-primary" />
                    <span>{theme.scheduleMode === 'period' ? 'Period Schedule:' : 'Schedule:'}</span>
                  </div>
                  {theme.scheduleMode === 'period' ? (
                    <span className="font-mono font-bold text-[11px] text-heading/90">
                      {formatDisplayDate(theme.startDate)} → {formatDisplayDate(theme.endDate)}
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Always Active while Enabled & Visible
                    </span>
                  )}
                </div>

                {/* Enabled Features */}
                <div className="flex flex-wrap gap-1.5">
                  {featureItems.map((item) => {
                    const active = theme.features?.[item.key] ?? true;
                    return (
                      <span
                        key={item.key}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          active
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-card-soft text-muted border-border line-through opacity-60'
                        }`}
                      >
                        {item.label}
                      </span>
                    );
                  })}
                </div>

                {/* Enable / Disable & Visible / Hidden Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => handleToggleEnable(theme)}
                    disabled={isBusy}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      theme.isEnabled
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-card-soft text-heading border-border hover:border-emerald-500/40'
                    }`}
                  >
                    <Power size={15} />
                    <span>{theme.isEnabled ? 'Enabled (Click to Disable)' : 'Disabled (Click to Enable)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleVisible(theme)}
                    disabled={isBusy}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      theme.isVisible
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                        : 'bg-card-soft text-heading border-border hover:border-sky-500/40'
                    }`}
                  >
                    {theme.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    <span>{theme.isVisible ? 'Visible (Click to Hide)' : 'Hidden (Click to Show)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminThemes;
