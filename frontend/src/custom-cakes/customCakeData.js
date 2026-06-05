/**
 * ╔════════════════════════════════════════════════════════════════╗
 *   Custom Cake Data — Separate API Content Layer
 *   All themes, flavors, tiers, weights extracted here.
 *   Can later be swapped for `fetch('/api/custom-cakes')`.
 * ╚════════════════════════════════════════════════════════════════╝
 */

import { Shield, Leaf, Clock, Sparkles } from 'lucide-react';
import { Palette, Cake, Weight, UserCircle, ReceiptText, Layers } from 'lucide-react';

// ─── TIERS ───────────────────────────────────────────────────────
export const TIERS = [
  {
    id: 1,
    name: 'Single Layer',
    shortName: 'Tier 1',
    description: 'Classic single-layer cakes — elegant & perfect for small celebrations',
    icon: '🎂',
    layers: 1,
  },
  {
    id: 2,
    name: 'Double Layer',
    shortName: 'Tier 2',
    description: 'Two stunning tiers — ideal for birthdays & parties',
    icon: '🎂🎂',
    layers: 2,
  },
  {
    id: 3,
    name: 'Triple Layer',
    shortName: 'Tier 3',
    description: 'Grand three-tier showstopper — weddings & grand events',
    icon: '🎂🎂🎂',
    layers: 3,
  },
];

// ─── WEIGHTS ─────────────────────────────────────────────────────
export const WEIGHTS = [
  { id: '1kg', dbKey: '1Kg', label: '1 Kg', multiplier: 2, serves: '8–10' },
  { id: '1.5kg', dbKey: '1_5Kg', label: '1.5 Kg', multiplier: 3, serves: '12–15' },
  { id: '2kg', dbKey: '2Kg', label: '2 Kg', multiplier: 4, serves: '16–20' },
  { id: '2.5kg', dbKey: '2_5Kg', label: '2.5 Kg', multiplier: 5, serves: '20–25' },
  { id: '3kg', dbKey: '3Kg', label: '3 Kg', multiplier: 6, serves: '25–30' }
];

// ─── TRUST BADGES ────────────────────────────────────────────────
export const TRUST = [
  { icon: Shield, label: '100% Eggless' },
  { icon: Leaf, label: 'Premium Ingredients' },
  { icon: Sparkles, label: 'Freshly Baked' },
  { icon: Clock, label: 'On-time Delivery' },
];

// ─── MOBILE STEPS (with Tier as step 0) ──────────────────────────
export const STEPS = [
  { id: 0, label: 'Tier', icon: Layers },
  { id: 1, label: 'Theme', icon: Palette },
  { id: 2, label: 'Color', icon: Cake },
  { id: 3, label: 'Weight', icon: Weight },
  { id: 4, label: 'Message', icon: UserCircle },
  { id: 5, label: 'Summary', icon: ReceiptText },
];

// ─── HELPER: get tier info ───────────────────────────────────────
export function getTierById(tierId) {
  // We keep this to get tier metadata, but prices are dynamic now
  return TIERS.find(t => t.id === tierId) || null;
}
