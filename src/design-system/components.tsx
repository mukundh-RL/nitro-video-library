/* ========================================================================
   Rocketlane Design System — React Component Library
   Requires: tokens.css imported once at the app root.
   Works with React 18+. No external UI deps.
   ======================================================================== */

import React, { forwardRef } from 'react';

/* ---------------------------------------------------------------------- */
/*  Icon primitive — the arrow chevron used across the system             */
/* ---------------------------------------------------------------------- */

const ArrowGlyph = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 5h6M5.5 2 8 5 5.5 8" />
  </svg>
);

/* ---------------------------------------------------------------------- */
/*  Button — pill + circular arrow, six variants, three sizes             */
/* ---------------------------------------------------------------------- */

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', children, className = '', as: As = 'button', ...props },
  ref
) {
  const cls = [
    'rl-btn',
    `rl-btn-${variant}`,
    size !== 'md' && `rl-btn-${size}`,
    className,
  ].filter(Boolean).join(' ');
  const arrowSize = size === 'lg' ? 14 : size === 'sm' ? 10 : 12;
  return (
    <As ref={ref} className={cls} {...props}>
      <span className="rl-btn-label">{children}</span>
      <span className="rl-btn-arrow">
        <ArrowGlyph size={arrowSize} />
      </span>
    </As>
  );
});

/* ---------------------------------------------------------------------- */
/*  Card — paper or dark                                                  */
/* ---------------------------------------------------------------------- */

export const Card = ({ dark = false, className = '', children, ...props }) => (
  <div className={`rl-card ${dark ? 'rl-card-dark' : ''} ${className}`} {...props}>
    {children}
  </div>
);

/* ---------------------------------------------------------------------- */
/*  Badge                                                                  */
/* ---------------------------------------------------------------------- */

export const Badge = ({ tone = 'primary', children, className = '', ...props }) => (
  <span className={`rl-badge rl-badge-${tone} ${className}`} {...props}>
    {children}
  </span>
);

/* ---------------------------------------------------------------------- */
/*  Input                                                                  */
/* ---------------------------------------------------------------------- */

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`rl-input ${className}`} {...props} />;
});

/* ---------------------------------------------------------------------- */
/*  Eyebrow — UPPERCASE label with tracking                                */
/* ---------------------------------------------------------------------- */

export const Eyebrow = ({ children, className = '', ...props }) => (
  <div className={`rl-eyebrow ${className}`} {...props}>{children}</div>
);

/* ---------------------------------------------------------------------- */
/*  Section — consistent vertical rhythm                                   */
/* ---------------------------------------------------------------------- */

export const Section = ({ children, className = '', ...props }) => (
  <section className={`rl-section ${className}`} {...props}>{children}</section>
);
