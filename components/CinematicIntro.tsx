"use client";

import { useEffect, useState } from "react";

const INTRO_KEY = "orbitbridge-intro-seen-v1";
const INTRO_DURATION = 4800;

export default function CinematicIntro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(INTRO_KEY) === "1") {
        setVisible(false);
        return;
      }
      window.sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // If storage is unavailable, the intro still works for this page load.
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 900 : INTRO_DURATION;
    const leaveTimer = window.setTimeout(() => setLeaving(true), duration - 650);
    const hideTimer = window.setTimeout(() => setVisible(false), duration);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  const skipIntro = () => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 420);
  };

  return (
    <div
      className={`gamgam-intro${leaving ? " gamgam-intro--leaving" : ""}`}
      role="status"
      aria-label="OrbitBridge — Swap & Bridge"
    >
      <div className="intro-grain" aria-hidden="true" />
      <div className="intro-halo intro-halo--one" aria-hidden="true" />
      <div className="intro-halo intro-halo--two" aria-hidden="true" />
      <div className="intro-orbit intro-orbit--one" aria-hidden="true"><i /></div>
      <div className="intro-orbit intro-orbit--two" aria-hidden="true"><i /></div>
      <div className="intro-orbit intro-orbit--three" aria-hidden="true"><i /></div>

      <div className="intro-center">
        <div className="intro-logo-stage">
          <span className="intro-logo-ring intro-logo-ring--outer" aria-hidden="true" />
          <span className="intro-logo-ring intro-logo-ring--inner" aria-hidden="true" />
          <img
            className="intro-globe intro-logo-lockup"
            src="/orbitbridge-emblem.png"
            alt="OrbitBridge logo"
            draggable={false}
          />
          <span className="intro-logo-glint" aria-hidden="true" />
        </div>

        <div className="intro-wordmark">
          <div className="intro-brand-name">Orbit<span>Bridge</span></div>
          <div className="intro-tagline"><span /> SWAP &amp; BRIDGE · ONE CLICK SIMPLE AND REWARDS <span /></div>
        </div>

        <div className="intro-bottom">
          <span className="intro-bottom-line" />
          <span>SWAP&nbsp; · &nbsp;BRIDGE</span>
          <span className="intro-bottom-line" />
        </div>
      </div>

      <div className="intro-corner intro-corner--left">OB / 01</div>
      <div className="intro-corner intro-corner--right">CROSS-CHAIN PROTOCOL</div>
      <button className="intro-skip" type="button" onClick={skipIntro} aria-label="Skip intro">
        SKIP INTRO <span aria-hidden="true">↗</span>
      </button>
      <div className="intro-progress" aria-hidden="true"><span /></div>
    </div>
  );
}
