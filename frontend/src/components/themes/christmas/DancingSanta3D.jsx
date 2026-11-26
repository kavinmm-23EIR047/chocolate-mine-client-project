import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { useSiteTheme } from '../../../context/SiteThemeContext';

/**
 * Interactive 3D-style dancing Santa ("Christmas dad") anchored in the side corner.
 * Uses Three.js WebGL with articulated 3D meshes, glossy PBR lighting, and lively
 * hip/arm/leg/hat dance choreography, with a graceful SVG fallback if WebGL fails.
 */
const DancingSanta3D = () => {
  const mountRef = useRef(null);
  const spinBoostRef = useRef(0);
  const [webglReady, setWebglReady] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const { triggerSleighReplay } = useSiteTheme();

  useEffect(() => {
    if (collapsed) return undefined;
    const container = mountRef.current;
    if (!container) return undefined;

    let renderer;
    let animationId;
    const width = container.clientWidth || 136;
    const height = container.clientHeight || 164;

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      setWebglReady(true);
    } catch {
      setWebglReady(false);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 5.4);
    camera.lookAt(0, 1.15, 0);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', handleResize);

    // Warm 3D studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.05);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.65);
    keyLight.position.set(2.5, 4.5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfde047, 0.85);
    rimLight.position.set(-3, 2.5, -2);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x93c5fd, 0.7, 12);
    fillLight.position.set(-2.5, 1.2, 3);
    scene.add(fillLight);

    // Materials
    const redSuitMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.08 });
    const whiteFurMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65, metalness: 0.02 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.55 });
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.5 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.2 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.85 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.8 });

    // Snowy pedestal + gift box
    const stageGroup = new THREE.Group();
    const snowBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.22, 24), snowMat);
    snowBase.position.y = 0.11;
    stageGroup.add(snowBase);

    const giftBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.42), greenMat);
    giftBox.position.set(0.76, 0.38, 0.28);
    giftBox.rotation.y = 0.4;
    stageGroup.add(giftBox);
    const giftRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.09), goldMat);
    giftRibbon.position.copy(giftBox.position);
    giftRibbon.rotation.copy(giftBox.rotation);
    stageGroup.add(giftRibbon);
    scene.add(stageGroup);

    // Root Santa character
    const santaRoot = new THREE.Group();
    santaRoot.position.y = 0.22;
    scene.add(santaRoot);

    // Legs
    const createLeg = (xOffset) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(xOffset, 0.62, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.36, 14), redSuitMat);
      thigh.position.y = -0.18;
      legPivot.add(thigh);
      const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 14), blackMat);
      boot.position.y = -0.45;
      legPivot.add(boot);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), blackMat);
      toe.scale.set(1, 0.72, 1.35);
      toe.position.set(0, -0.52, 0.08);
      legPivot.add(toe);
      return legPivot;
    };

    const leftLeg = createLeg(-0.24);
    const rightLeg = createLeg(0.24);
    santaRoot.add(leftLeg, rightLeg);

    // Upper Body Group (bounces & grooves over hips)
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.65;
    santaRoot.add(bodyGroup);

    // Coat skirt & plump belly
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.66, 0.24, 24), whiteFurMat);
    skirt.position.y = 0.05;
    bodyGroup.add(skirt);

    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 20), redSuitMat);
    torso.scale.set(1.04, 1.12, 0.96);
    torso.position.y = 0.45;
    bodyGroup.add(torso);

    // Belt + Gold Buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.59, 0.6, 0.14, 24), blackMat);
    belt.position.y = 0.36;
    bodyGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.06), goldMat);
    buckle.position.set(0, 0.36, 0.58);
    bodyGroup.add(buckle);

    // Coat front white fur strip
    const furStrip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.64, 0.08), whiteFurMat);
    furStrip.position.set(0, 0.52, 0.54);
    bodyGroup.add(furStrip);

    // Arms
    const createArm = (side) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.56, 0.74, 0);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.48, 14), redSuitMat);
      sleeve.position.set(side * 0.14, -0.18, 0);
      sleeve.rotation.z = side * 0.45;
      armPivot.add(sleeve);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 14), whiteFurMat);
      cuff.position.set(side * 0.24, -0.38, 0);
      cuff.rotation.z = side * 0.45;
      armPivot.add(cuff);
      const mitten = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), whiteFurMat);
      mitten.position.set(side * 0.29, -0.47, 0.03);
      armPivot.add(mitten);
      return armPivot;
    };

    const leftArm = createArm(-1);
    const rightArm = createArm(1);
    bodyGroup.add(leftArm, rightArm);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.06;
    bodyGroup.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 22, 20), skinMat);
    headGroup.add(head);

    // Eyes & Nose & Cheeks
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), blackMat);
    leftEye.position.set(-0.12, 0.06, 0.33);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), blackMat);
    rightEye.position.set(0.12, 0.06, 0.33);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), cheekMat);
    nose.position.set(0, -0.01, 0.37);
    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), cheekMat);
    cheekL.position.set(-0.2, -0.04, 0.29);
    const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), cheekMat);
    cheekR.position.set(0.2, -0.04, 0.29);
    headGroup.add(leftEye, rightEye, nose, cheekL, cheekR);

    // Fluffy Beard
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 16), whiteFurMat);
    beard.scale.set(1.05, 1.02, 0.78);
    beard.position.set(0, -0.18, 0.16);
    const stacheL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), whiteFurMat);
    stacheL.scale.set(1.4, 0.7, 0.8);
    stacheL.position.set(-0.1, -0.07, 0.34);
    stacheL.rotation.z = 0.25;
    const stacheR = stacheL.clone();
    stacheR.position.x = 0.1;
    stacheR.rotation.z = -0.25;
    headGroup.add(beard, stacheL, stacheR);

    // Santa Hat + Swaying Pom-Pom
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.24, 0);
    headGroup.add(hatGroup);

    const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.085, 12, 24), whiteFurMat);
    hatBrim.rotation.x = Math.PI / 2;
    hatGroup.add(hatBrim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.65, 20), redSuitMat);
    hatCone.position.set(0.05, 0.3, -0.02);
    hatCone.rotation.z = -0.24;
    hatGroup.add(hatCone);

    const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), whiteFurMat);
    pomPom.position.set(0.14, 0.63, -0.03);
    hatGroup.add(pomPom);

    // Floating 3D Snow Orbs around Santa
    const miniOrbs = Array.from({ length: 6 }, (_, i) => {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), whiteFurMat);
      orb.userData = { angle: (i / 6) * Math.PI * 2, radius: 1.05 + (i % 2) * 0.18, speed: 1.1 + i * 0.15, yBase: 0.6 + (i % 3) * 0.45 };
      scene.add(orb);
      return orb;
    });

    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      const beat = t * 5.2; // upbeat festive dance tempo

      // Spin boost decays smoothly after click
      if (spinBoostRef.current > 0.01) {
        spinBoostRef.current *= 0.93;
      } else {
        spinBoostRef.current = 0;
      }

      // Main groove bounce & sway
      santaRoot.position.y = 0.22 + Math.abs(Math.sin(beat)) * 0.13;
      santaRoot.rotation.y = Math.sin(t * 1.4) * 0.38 + spinBoostRef.current;

      // Hip & torso dance twist
      bodyGroup.rotation.z = Math.sin(beat * 0.5) * 0.14;
      bodyGroup.rotation.y = Math.cos(beat * 0.5) * 0.22;

      // Joyful alternating arm groove
      leftArm.rotation.z = -0.35 + Math.sin(beat) * 0.65;
      leftArm.rotation.x = Math.cos(beat * 0.5) * 0.35;
      rightArm.rotation.z = 0.35 + Math.sin(beat + Math.PI) * 0.65;
      rightArm.rotation.x = Math.sin(beat * 0.5) * 0.35;

      // Stepping feet tap
      leftLeg.rotation.x = Math.max(-0.45, Math.sin(beat) * 0.42);
      rightLeg.rotation.x = Math.max(-0.45, Math.sin(beat + Math.PI) * 0.42);

      // Cheerful head nod & hat bob
      headGroup.rotation.z = Math.sin(beat * 0.5 + 0.5) * 0.14;
      headGroup.rotation.x = Math.sin(beat) * 0.08;
      hatGroup.rotation.z = Math.sin(beat - 0.5) * 0.1;

      // Swirling snow orbs
      for (const orb of miniOrbs) {
        const d = orb.userData;
        const a = d.angle + t * d.speed;
        orb.position.set(
          Math.cos(a) * d.radius,
          d.yBase + Math.sin(t * 2 + d.angle) * 0.16,
          Math.sin(a) * d.radius
        );
      }

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animationId) window.cancelAnimationFrame(animationId);
      renderer?.dispose();
    };
  }, [collapsed]);

  const handleSantaTap = () => {
    spinBoostRef.current += Math.PI * 2;
    try {
      confetti({
        particleCount: 38,
        spread: 65,
        origin: { x: 0.08, y: 0.82 },
        colors: ['#ef4444', '#16a34a', '#fbbf24', '#ffffff'],
      });
    } catch {
      // ignore if confetti unsupported
    }
    triggerSleighReplay();
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="touch-compact fixed bottom-[76px] sm:bottom-24 lg:bottom-5 left-2.5 sm:left-4 z-[180] flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-700 text-white text-[11px] sm:text-xs font-black shadow-lg border border-amber-300/60 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        title="Show 3D Dancing Santa"
      >
        <span className="text-sm sm:text-base leading-none">🎅</span>
        <span className="hidden sm:inline">Santa</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-[72px] sm:bottom-24 lg:bottom-4 left-1.5 sm:left-3 lg:left-4 z-[180] flex flex-col items-center select-none group"
      onMouseEnter={() => setShowBubble(true)}
      onMouseLeave={() => setShowBubble(false)}
    >
      {/* Festive Greeting Bubble */}
      <div
        className={`mb-0.5 px-2.5 py-1 rounded-full bg-card/95 backdrop-blur-md border border-amber-400/60 text-heading text-[10px] font-black shadow-md whitespace-nowrap transition-all duration-200 ${
          showBubble ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
        }`}
      >
        Ho Ho Ho! Tap Santa 🎄
      </div>

      <div className="relative">
        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(true);
          }}
          aria-label="Minimize dancing Santa"
          title="Hide Santa"
          className="touch-compact absolute -top-0.5 -right-0.5 z-20 w-5 h-5 rounded-full bg-card/90 border border-border text-heading flex items-center justify-center opacity-85 sm:opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-sm"
        >
          <X size={10} />
        </button>

        {/* Interactive 3D Canvas Container — balanced sizes for mobile, tablet & desktop */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleSantaTap}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleSantaTap();
          }}
          title="Tap Santa for a Christmas surprise!"
          className="w-[74px] h-[90px] sm:w-[96px] sm:h-[116px] lg:w-[132px] lg:h-[160px] cursor-pointer active:scale-95 transition-transform"
        >
          {webglReady ? (
            <div ref={mountRef} className="w-full h-full" />
          ) : (
            /* Pure 3D-shaded SVG Fallback */
            <div className="w-full h-full flex items-center justify-center animate-bounce text-6xl drop-shadow-lg">
              🎅
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DancingSanta3D;
