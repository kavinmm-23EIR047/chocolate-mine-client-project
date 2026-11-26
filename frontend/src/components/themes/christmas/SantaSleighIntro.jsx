import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { playChristmasIntroSong } from '../../../utils/christmasAudio';

/**
 * Animated Christmas Santa ("Dad") + Reindeer Sleigh flyby that glides across
 * the screen when the storefront starts/loads, accompanied by a 6-second
 * Jingle Bells intro melody (autoplay-safe with mute & tap-to-play support).
 */
const SantaSleighIntro = ({
  replayKey = 0,
  playMusic = true,
  showVisualSleigh = true,
}) => {
  const [visible, setVisible] = useState(true);
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtrlRef = useRef(null);

  // Sync visual flyby window (~6.5s)
  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [replayKey]);

  // Sync 6-second Jingle Bells intro song
  useEffect(() => {
    if (!playMusic || muted) {
      audioCtrlRef.current?.stop();
      audioCtrlRef.current = null;
      setAudioPlaying(false);
      setAudioBlocked(false);
      return undefined;
    }

    const ctrl = playChristmasIntroSong({
      onBlockedChange: (blocked) => {
        setAudioBlocked(blocked);
        setAudioPlaying(!blocked);
      },
      onEnded: () => {
        setAudioPlaying(false);
      },
    });
    audioCtrlRef.current = ctrl;

    const unlockAndPlay = async () => {
      if (audioCtrlRef.current) {
        const started = await audioCtrlRef.current.resumeAndPlay();
        if (started) {
          setAudioBlocked(false);
          setAudioPlaying(true);
        }
      }
    };

    window.addEventListener('pointerdown', unlockAndPlay, { once: true });
    window.addEventListener('keydown', unlockAndPlay, { once: true });
    window.addEventListener('touchstart', unlockAndPlay, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
      ctrl.stop();
      audioCtrlRef.current = null;
      setAudioPlaying(false);
    };
  }, [replayKey, playMusic, muted]);

  const handleToggleMute = async (e) => {
    e.stopPropagation();
    if (muted) {
      setMuted(false);
    } else if (audioBlocked && audioCtrlRef.current) {
      const started = await audioCtrlRef.current.resumeAndPlay();
      if (started) {
        setAudioBlocked(false);
        setAudioPlaying(true);
      }
    } else {
      setMuted(true);
      audioCtrlRef.current?.stop();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={replayKey}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 pointer-events-none z-[220] overflow-hidden select-none"
        >
          {/* Moving Santa + Reindeer Sleigh */}
          {showVisualSleigh && (
            <motion.div
              initial={{ x: '-38vw', y: '24vh', rotate: -4, scale: 0.85 }}
              animate={{
                x: ['-38vw', '28vw', '68vw', '118vw'],
                y: ['24vh', '16vh', '20vh', '10vh'],
                rotate: [-4, 2, -2, 4],
                scale: [0.85, 1.04, 1, 0.92],
              }}
              transition={{
                duration: 6.1,
                ease: [0.25, 0.46, 0.45, 0.94],
                times: [0, 0.35, 0.72, 1],
              }}
              className="absolute top-0 left-0 flex items-center"
            >
              {/* Glowing Stardust & Snow Trail */}
              <div className="relative flex items-center">
                <motion.div
                  animate={{ opacity: [0.35, 0.85, 0.4], scaleX: [0.95, 1.08, 0.96] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="w-28 sm:w-44 h-6 -mr-10 rounded-full blur-md"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(251,191,36,0) 0%, rgba(253,224,71,0.55) 60%, rgba(255,255,255,0.85) 100%)',
                  }}
                />

                {/* Detailed Illustrated Santa Sleigh + 2 Galloping Reindeer */}
                <svg
                  viewBox="0 0 460 150"
                  className="w-[270px] sm:w-[400px] md:w-[460px] h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="sleighRed" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                    <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fef08a" />
                    </linearGradient>
                    <linearGradient id="deerCoat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b45309" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                  </defs>

                  {/* Sparkling stars in wake */}
                  <circle cx="24" cy="72" r="2.5" fill="#fde047" opacity="0.9" />
                  <circle cx="48" cy="96" r="2" fill="#ffffff" opacity="0.85" />
                  <circle cx="14" cy="108" r="1.8" fill="#fef08a" opacity="0.8" />
                  <circle cx="62" cy="64" r="2.2" fill="#ffffff" opacity="0.8" />

                  {/* Reins */}
                  <path
                    d="M170 78 Q 235 88 292 72"
                    stroke="#fbbf24"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />
                  <path
                    d="M172 84 Q 270 96 368 68"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Gift Sack in Sleigh */}
                  <ellipse cx="105" cy="72" rx="22" ry="20" fill="#15803d" />
                  <path d="M92 56 L118 56 L110 46 L100 46 Z" fill="#166534" />
                  <rect x="86" y="66" width="14" height="14" rx="2" fill="#f59e0b" />
                  <rect x="91" y="66" width="4" height="14" fill="#dc2626" />

                  {/* Santa Claus ("Christmas Dad") inside Sleigh */}
                  <g>
                    <ellipse cx="136" cy="72" rx="18" ry="20" fill="#dc2626" />
                    <path d="M122 60 Q136 66 150 60" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    <motion.g
                      animate={{ rotate: [-14, 18, -14] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      style={{ originX: '146px', originY: '66px' }}
                    >
                      <path d="M146 66 L168 46" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" />
                      <circle cx="169" cy="45" r="4.5" fill="#ffffff" />
                    </motion.g>
                    <circle cx="136" cy="46" r="12" fill="#fed7aa" />
                    <circle cx="141" cy="46" r="1.5" fill="#1f2937" />
                    <circle cx="143" cy="49" r="2.2" fill="#fb7185" opacity="0.65" />
                    <path
                      d="M126 48 Q136 68 148 50 Q142 54 136 53 Q130 54 126 48 Z"
                      fill="#ffffff"
                    />
                    <path d="M124 41 Q132 22 149 34 L147 41 Z" fill="#dc2626" />
                    <rect x="123" y="38" width="25" height="5.5" rx="2.75" fill="#ffffff" />
                    <circle cx="151" cy="34" r="4" fill="#ffffff" />
                  </g>

                  {/* Sleigh Body */}
                  <path
                    d="M66 78 C72 106, 98 112, 152 110 C172 109, 182 95, 178 76 C168 78, 160 88, 142 88 L88 86 C78 86, 72 78, 66 78 Z"
                    fill="url(#sleighRed)"
                    stroke="url(#goldTrim)"
                    strokeWidth="2.5"
                  />
                  {/* Sleigh Runners */}
                  <path
                    d="M64 118 L174 118 C186 118, 192 108, 185 102"
                    stroke="url(#goldTrim)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path d="M88 109 L84 118 M148 109 L144 118" stroke="url(#goldTrim)" strokeWidth="3.5" />

                  {/* Back Reindeer */}
                  <motion.g
                    animate={{ y: [-3, 3, -3], rotate: [-2, 3, -2] }}
                    transition={{ repeat: Infinity, duration: 0.65 }}
                    style={{ originX: '295px', originY: '78px' }}
                  >
                    <path d="M276 88 L264 112 M284 90 L278 114 M306 88 L322 108 M312 86 L330 102" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
                    <ellipse cx="294" cy="80" rx="22" ry="12" fill="url(#deerCoat)" />
                    <path d="M308 75 L322 52 L332 54 L320 82 Z" fill="url(#deerCoat)" />
                    <ellipse cx="328" cy="52" rx="10" ry="7" fill="#b45309" />
                    <path d="M322 46 L316 30 M319 37 L311 35 M326 45 L325 28 M325 36 L332 33" stroke="#fde68a" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M308 68 L320 75" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="315" cy="75" r="3" fill="#fde047" />
                  </motion.g>

                  {/* Lead Reindeer (Rudolph with Glowing Red Nose!) */}
                  <motion.g
                    animate={{ y: [3, -4, 3], rotate: [2, -3, 2] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    style={{ originX: '380px', originY: '72px' }}
                  >
                    <path d="M362 82 L348 106 M370 84 L362 108 M394 82 L412 100 M400 80 L422 94" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
                    <ellipse cx="354" cy="72" rx="4.5" ry="3" fill="#fef3c7" />
                    <ellipse cx="380" cy="74" rx="23" ry="12.5" fill="url(#deerCoat)" />
                    <path d="M394 68 L410 44 L420 47 L406 76 Z" fill="url(#deerCoat)" />
                    <ellipse cx="417" cy="45" rx="10.5" ry="7" fill="#b45309" />
                    <circle cx="418" cy="43" r="1.5" fill="#111827" />
                    <circle cx="428" cy="45" r="4.2" fill="#ef4444" />
                    <circle cx="428" cy="45" r="8" fill="#ef4444" opacity="0.35" />
                    <path d="M410 39 L404 22 M407 30 L399 28 M415 38 L414 20 M414 29 L422 25" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M395 62 L408 69" stroke="#16a34a" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx="403" cy="69" r="3.2" fill="#fde047" />
                  </motion.g>
                </svg>
              </div>
            </motion.div>
          )}

          {/* Subtle Festive Welcome Ribbon + Music Control during 6.5s Intro (always horizontally centered) */}
          <div className="fixed top-16 sm:top-20 inset-x-0 px-3 flex justify-center pointer-events-none z-[225]">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-20, 0, 0, -16] }}
              transition={{ duration: 6.2, times: [0, 0.1, 0.88, 1] }}
              className="pointer-events-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-red-700 via-rose-600 to-emerald-700 text-white border border-amber-300/60 shadow-xl max-w-full"
            >
              <span className="text-xs sm:text-sm shrink-0">🎅</span>
              <span className="text-[11px] sm:text-xs font-black tracking-wide leading-tight text-center truncate">
                {playMusic && audioBlocked && !muted ? (
                  <>
                    <span className="sm:hidden">Tap for Jingle Bells! 🎄</span>
                    <span className="hidden sm:inline">Tap anywhere for Jingle Bells! Merry Christmas 🎄</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Merry Christmas! Holiday Treats</span>
                    <span className="hidden sm:inline">Merry Christmas! Fresh Holiday Treats at The Chocolate Mine</span>
                  </>
                )}
              </span>
              {playMusic && (
                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label={muted ? 'Play Christmas song' : audioBlocked ? 'Play Jingle Bells' : 'Mute Christmas song'}
                  title={muted ? 'Play Jingle Bells' : audioBlocked ? 'Tap to Play Jingle Bells' : 'Mute Jingle Bells'}
                  className="touch-compact ml-0.5 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {muted ? <VolumeX size={13} /> : <Volume2 size={13} className={audioPlaying ? 'animate-pulse' : ''} />}
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SantaSleighIntro;
