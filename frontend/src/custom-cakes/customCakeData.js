/**
 * ╔════════════════════════════════════════════════════════════════╗
 *   Custom Cake Data — Separate API Content Layer
 *   All themes, flavors, tiers, weights extracted here.
 *   Can later be swapped for `fetch('/api/custom-cakes')`.
 * ╚════════════════════════════════════════════════════════════════╝
 */

import { Shield, Leaf, Clock, Sparkles } from 'lucide-react';
import { Palette, Cake, Weight, UserCircle, ReceiptText, Layers } from 'lucide-react';

// ── Teddy flavor images ──────────────────────────────────────────
import teddyVanilla from '../assets/custom/themes/Teddy/tier-1-normal.png';
import teddyChocolate from '../assets/custom/themes/Teddy/tier-1-chocolate.png';
import teddyRose from '../assets/custom/themes/Teddy/tier-1-rose.png';
import teddyPistachio from '../assets/custom/themes/Teddy/tier-1-pistachoe.png';

// ── Coming Soon theme images ─────────────────────────────────────
import floralPurpleImg from '../assets/custom/themes/Floral Cake Purple/Floral Cake Purple.png';
import floralWhiteImg from '../assets/custom/themes/Floral White/Floral White.png';
import honeybeeImg from '../assets/custom/themes/Honeybee/Honeybee.png';
import girlsThemeImg from '../assets/custom/themes/Theme Cake for girls/Theme Cake for girls.png';

// ─── TIERS ───────────────────────────────────────────────────────
export const TIERS = [
  {
    id: 1,
    name: 'Single Layer',
    shortName: 'Tier 1',
    description: 'Classic single-layer cakes — elegant & perfect for small celebrations',
    icon: '🎂',
    layers: 1,
    priceMultiplier: 1.0,
  },
  {
    id: 2,
    name: 'Double Layer',
    shortName: 'Tier 2',
    description: 'Two stunning tiers — ideal for birthdays & parties',
    icon: '🎂🎂',
    layers: 2,
    priceMultiplier: 1.6,
  },
  {
    id: 3,
    name: 'Triple Layer',
    shortName: 'Tier 3',
    description: 'Grand three-tier showstopper — weddings & grand events',
    icon: '🎂🎂🎂',
    layers: 3,
    priceMultiplier: 2.2,
  },
];

// ─── FLAVORS ─────────────────────────────────────────────────────
export const TEDDY_FLAVORS = [
  { id: 'vanilla', name: 'Vanilla', image: teddyVanilla, pricePerKg: 899, bg: '#FEF6EC' },
  { id: 'chocolate', name: 'Chocolate', image: teddyChocolate, pricePerKg: 999, bg: '#F2EAE4' },
  { id: 'rose', name: 'Rose Strawberry', image: teddyRose, pricePerKg: 1099, bg: '#FEF0F3' },
  { id: 'pistachio', name: 'Pistachio', image: teddyPistachio, pricePerKg: 1199, bg: '#EEF6EE' },
];

// ─── THEMES ──────────────────────────────────────────────────────
export const THEMES = [
  {
    id: 'teddy', name: 'Teddy Theme', shortName: 'Teddy', emoji: '🧸',
    bg: '#FEF6EC', enabled: true, badge: 'Bestseller',
    rating: 4.8, reviews: 128, flavors: TEDDY_FLAVORS,
    description: 'Adorable handcrafted teddy bears with soft pastel accents',
    image: null,
    tiers: [1, 2, 3], // available in all tiers
  },
  {
    id: 'floral-white', name: 'Floral White', shortName: 'Floral White', emoji: '🤍',
    bg: '#F8F5F2', enabled: false, badge: 'Coming Soon',
    flavors: [], description: 'Elegant all-white floral arrangement with ivory sugar petals',
    image: floralWhiteImg,
    tiers: [1, 2],
  },
  {
    id: 'honeybee', name: 'Honeybee', shortName: 'Honeybee', emoji: '🐝',
    bg: '#FFFBEA', enabled: false, badge: 'Coming Soon',
    flavors: [], description: 'Sweet honeycomb textures with charming bee toppers',
    image: honeybeeImg,
    tiers: [1, 2, 3],
  },
  {
    id: 'floral-purple', name: 'Floral Cake Purple', shortName: 'Floral Purple', emoji: '💜',
    bg: '#F5F0FF', enabled: false, badge: 'Coming Soon',
    flavors: [], description: 'Lush violet blooms cascading over a dreamy lilac base',
    image: floralPurpleImg,
    tiers: [2, 3],
  },
  {
    id: 'girls-theme', name: 'Theme Cake for Girls', shortName: 'Girls Theme', emoji: '🎀',
    bg: '#FFF0F5', enabled: false, badge: 'Coming Soon',
    flavors: [], description: 'Pastel bows, ribbons and girly charm on every tier',
    image: girlsThemeImg,
    tiers: [1, 2, 3],
  },
];

// ─── WEIGHTS ─────────────────────────────────────────────────────
export const WEIGHTS = [
  { label: '0.5 kg', kg: 0.5, extraPrice: 0, serves: '4–6' },
  { label: '1 kg', kg: 1.0, extraPrice: 300, serves: '8–10' },
  { label: '1.5 kg', kg: 1.5, extraPrice: 600, serves: '12–15' },
  { label: '2 kg', kg: 2.0, extraPrice: 900, serves: '16–20' },
  { label: '3 kg', kg: 3.0, extraPrice: 1500, serves: '25–30' },
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

// ─── HELPER: filter themes by tier ───────────────────────────────
export function getThemesByTier(tierId) {
  if (!tierId) return THEMES;
  return THEMES.filter(t => t.tiers.includes(tierId));
}

// ─── HELPER: get tier info ───────────────────────────────────────
export function getTierById(tierId) {
  return TIERS.find(t => t.id === tierId) || null;
}

// ─── HELPER: calculate price with tier multiplier ────────────────
export function calculateTierPrice(basePrice, tierId) {
  const tier = getTierById(tierId);
  if (!tier) return basePrice;
  return Math.round(basePrice * tier.priceMultiplier);
}
