import React from 'react';
import { useSiteTheme } from '../../../context/SiteThemeContext';
import SpreadingSnow from './SpreadingSnow';
import SantaSleighIntro from './SantaSleighIntro';
import DancingSanta3D from './DancingSanta3D';

const ChristmasFrostDecor = () => (
  <div
    aria-hidden="true"
    className="fixed inset-x-0 top-0 pointer-events-none z-[115] flex justify-between overflow-hidden select-none"
  >
    <svg
      viewBox="0 0 220 70"
      className="w-36 sm:w-56 h-auto opacity-85 drop-shadow-[0_4px_10px_rgba(186,230,253,0.45)]"
      fill="none"
    >
      <defs>
        <linearGradient id="icicleLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#dbeafe" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <path
        d="M0 0 H220 C205 14, 198 6, 185 18 C176 28, 171 10, 160 22 C148 36, 144 10, 130 28 C120 42, 115 14, 102 32 C92 48, 86 12, 74 36 C62 56, 56 16, 44 48 C34 68, 26 22, 16 54 C10 66, 4 30, 0 42 Z"
        fill="url(#icicleLeft)"
      />
    </svg>

    <svg
      viewBox="0 0 220 70"
      className="w-36 sm:w-56 h-auto opacity-85 drop-shadow-[0_4px_10px_rgba(186,230,253,0.45)] scale-x-[-1]"
      fill="none"
    >
      <defs>
        <linearGradient id="icicleRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#dbeafe" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <path
        d="M0 0 H220 C205 14, 198 6, 185 18 C176 28, 171 10, 160 22 C148 36, 144 10, 130 28 C120 42, 115 14, 102 32 C92 48, 86 12, 74 36 C62 56, 56 16, 44 48 C34 68, 26 22, 16 54 C10 66, 4 30, 0 42 Z"
        fill="url(#icicleRight)"
      />
    </svg>
  </div>
);

/**
 * Renders the active Christmas Wonderland storefront overlays when enabled,
 * visible, and within its configured schedule period in the Admin Panel.
 */
const ChristmasThemeOverlay = () => {
  const { activeTheme, isChristmasActive, sleighReplayKey } = useSiteTheme();

  if (!isChristmasActive || !activeTheme) return null;

  const features = activeTheme.features || {};
  const showSnow = features.snow !== false;
  const showSleighIntro = features.sleighIntro !== false;
  const showDancingSanta = features.dancingSanta !== false;
  const showFestiveDecor = features.festiveDecor !== false;
  const showIntroMusic = features.introMusic !== false;

  return (
    <>
      {showFestiveDecor && <ChristmasFrostDecor />}
      {showSnow && <SpreadingSnow />}
      {(showSleighIntro || showIntroMusic) && (
        <SantaSleighIntro
          replayKey={sleighReplayKey}
          showVisualSleigh={showSleighIntro}
          playMusic={showIntroMusic}
        />
      )}
      {showDancingSanta && <DancingSanta3D />}
    </>
  );
};

export default ChristmasThemeOverlay;
