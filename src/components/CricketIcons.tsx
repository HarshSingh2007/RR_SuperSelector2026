import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Custom Royal Cricket Emblem
 * An original, non-infringing emblem combining a royal crown, cricket bat, ball, and shield.
 */
export const RoyalCrestEmblem: React.FC<IconProps> = ({ size = 32, className = '', color = '#E90074' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    <defs>
      <linearGradient id="royalEmblemGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E90074" />
        <stop offset="0.5" stopColor="#7545C8" />
        <stop offset="1" stopColor="#171F35" />
      </linearGradient>
      <linearGradient id="goldCrownGrad" x1="12" y1="6" x2="36" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Shield Base */}
    <path
      d="M24 44C24 44 40 36 40 20V10L24 4L8 10V20C8 36 24 44 24 44Z"
      fill="#0B1020"
      stroke="url(#royalEmblemGrad)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Inner Shield Accent */}
    <path
      d="M24 39C24 39 36 32 36 19V11.5L24 7L12 11.5V19C12 32 24 39 24 39Z"
      fill="#121A2D"
      opacity="0.8"
    />
    {/* Crown Crest */}
    <path
      d="M17 14L20 18L24 13L28 18L31 14V21H17V14Z"
      fill="url(#goldCrownGrad)"
      stroke="#D97706"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    {/* Crossed Cricket Bat */}
    <path
      d="M18 34L28 22L30 24L20 36L18 34Z"
      fill="#C9C3DF"
      stroke="#F7F7FB"
      strokeWidth="1"
    />
    <line x1="28" y1="22" x2="31" y2="19" stroke="#E90074" strokeWidth="2" strokeLinecap="round" />
    {/* Cricket Ball on Shield */}
    <circle cx="28" cy="28" r="4.5" fill="#E90074" stroke="#F7F7FB" strokeWidth="1" />
    <path d="M25 26Q28 28 31 30" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="1 1" />
  </svg>
);

/**
 * Authentic Willow Cricket Bat Icon
 */
export const CricketBatIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#C9C3DF' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Handle with rubber grip bands */}
    <line x1="4" y1="4" x2="8" y2="8" stroke="#E90074" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="4.5" y1="3.5" x2="5.5" y2="4.5" stroke="#FFFFFF" strokeWidth="1" />
    <line x1="6.5" y1="5.5" x2="7.5" y2="6.5" stroke="#FFFFFF" strokeWidth="1" />
    {/* Bat Shoulder & Blade */}
    <path
      d="M7.5 9L9 7.5L19 15.5C19.8 16.2 20.2 17.2 19.8 18.2C19.4 19.2 18.5 19.8 17.5 19.8L15 19.5L7.5 9Z"
      fill={color}
      stroke="#29334C"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    {/* Bat Spine / Sweet Spot Line */}
    <path d="M9 10L17.5 17" stroke="#121A2D" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/**
 * Leather Cricket Ball with 6-Stitch Seam
 */
export const CricketBallIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#E90074' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    <circle cx="12" cy="12" r="9.5" fill={color} stroke="#F7F7FB" strokeWidth="1.2" />
    {/* Curved Raised Seam with stitch ticks */}
    <path
      d="M 5.5 18.5 Q 12 12 18.5 5.5"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M 5.5 18.5 Q 12 12 18.5 5.5"
      stroke="#121A2D"
      strokeWidth="1.2"
      strokeDasharray="2 2"
      strokeLinecap="round"
    />
    {/* Ball Shine highlight */}
    <ellipse cx="9" cy="8" rx="2" ry="3.5" transform="rotate(-30 9 8)" fill="#FFFFFF" opacity="0.3" />
  </svg>
);

/**
 * Triple Wicket Stumps & Bails
 */
export const CricketStumpsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#C9C3DF' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Bails on top */}
    <rect x="3.5" y="4" width="7.5" height="2" rx="0.5" fill="#E90074" />
    <rect x="13" y="4" width="7.5" height="2" rx="0.5" fill="#7545C8" />
    {/* Off, Middle, Leg Stumps */}
    <rect x="5" y="6" width="2" height="15" rx="0.5" fill={color} stroke="#171F35" strokeWidth="0.5" />
    <rect x="11" y="6" width="2" height="15" rx="0.5" fill={color} stroke="#171F35" strokeWidth="0.5" />
    <rect x="17" y="6" width="2" height="15" rx="0.5" fill={color} stroke="#171F35" strokeWidth="0.5" />
    {/* Pitch Crease line at base */}
    <line x1="2" y1="21" x2="22" y2="21" stroke="#29334C" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * All-Rounder Emblem (Bat crossed with Ball)
 */
export const AllRounderIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#7545C8' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Willow Bat */}
    <path
      d="M4 4L6.5 6.5L16 16C17 17 16.5 18.5 15.5 19L14 18L6.5 10.5L4 4Z"
      fill="#C9C3DF"
      stroke="#29334C"
      strokeWidth="1"
    />
    <line x1="4" y1="4" x2="6.5" y2="6.5" stroke="#E90074" strokeWidth="2.5" strokeLinecap="round" />
    {/* Cricket Ball */}
    <circle cx="16" cy="8" r="4.5" fill="#E90074" stroke="#F7F7FB" strokeWidth="1" />
    <path d="M13 7Q16 8 19 9" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1 1" />
  </svg>
);

/**
 * Wicketkeeper Icon (Gauntlet Glove & Stumps)
 */
export const WicketkeeperIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#10B981' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Background Mini Stumps */}
    <rect x="15" y="3" width="1.5" height="12" rx="0.4" fill="#C9C3DF" opacity="0.6" />
    <rect x="18" y="3" width="1.5" height="12" rx="0.4" fill="#C9C3DF" opacity="0.6" />
    <rect x="21" y="3" width="1.5" height="12" rx="0.4" fill="#C9C3DF" opacity="0.6" />
    <line x1="14" y1="2.5" x2="22.5" y2="2.5" stroke="#E90074" strokeWidth="1" />
    {/* Keeper Gauntlet / Glove */}
    <path
      d="M3 10C3 7.5 4.5 5 7 5C8.5 5 9.5 6 10 7C10.5 6 11.5 5 13 5C15 5 16 7 16 10C16 14 14 18 11 20L5 19C3.5 17 3 13 3 10Z"
      fill={color}
      stroke="#0B1020"
      strokeWidth="1.2"
    />
    {/* Webbing between thumb and forefinger */}
    <path d="M7 8Q10 9 13 8" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="1.5 1.5" />
    {/* Wrist padding */}
    <rect x="4" y="18" width="8" height="2.5" rx="1" fill="#0B1020" stroke="#29334C" strokeWidth="0.8" />
  </svg>
);

/**
 * Bowling Motion Seam Trail Icon
 */
export const BowlingMotionIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#E90074' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Aerodynamic Speed / Spin Curves */}
    <path d="M2 17C6 14 10 15 14 10" stroke="#7545C8" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
    <path d="M4 21C8 18 12 19 16 14" stroke="#E90074" strokeWidth="1.5" strokeLinecap="round" />
    {/* Fast Moving Cricket Ball */}
    <circle cx="17.5" cy="8.5" r="5" fill={color} stroke="#FFFFFF" strokeWidth="1.2" />
    <path d="M14 11Q17.5 8.5 21 6" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="1 1" />
  </svg>
);

/**
 * 22-Yard Pitch Strip with Crease Markings
 */
export const PitchStripIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#C9C3DF' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Pitch rectangle */}
    <rect x="7" y="2" width="10" height="20" rx="1.5" fill="#171F35" stroke="#29334C" strokeWidth="1" />
    {/* Bowling crease top */}
    <line x1="8" y1="5" x2="16" y2="5" stroke="#E90074" strokeWidth="1.2" />
    {/* Popping crease top */}
    <line x1="7" y1="7" x2="17" y2="7" stroke="#FFFFFF" strokeWidth="1" />
    {/* Popping crease bottom */}
    <line x1="7" y1="17" x2="17" y2="17" stroke="#FFFFFF" strokeWidth="1" />
    {/* Bowling crease bottom */}
    <line x1="8" y1="19" x2="16" y2="19" stroke="#7545C8" strokeWidth="1.2" />
    {/* Center turf stripes */}
    <line x1="12" y1="8" x2="12" y2="16" stroke="#29334C" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

/**
 * Stadium Floodlight Tower Icon
 */
export const FloodlightIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#FBBF24' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Light Pylon Tower */}
    <path d="M10 22L11 8H13L14 22" stroke="#29334C" strokeWidth="1.2" />
    <line x1="10.5" y1="15" x2="13.5" y2="15" stroke="#29334C" strokeWidth="1" />
    {/* Light Bank Rig */}
    <rect x="6" y="4" width="12" height="4" rx="1" fill="#171F35" stroke="#29334C" strokeWidth="1" />
    {/* Glowing Light Bulbs */}
    <circle cx="8" cy="6" r="1" fill={color} />
    <circle cx="10.5" cy="6" r="1" fill={color} />
    <circle cx="13.5" cy="6" r="1" fill={color} />
    <circle cx="16" cy="6" r="1" fill={color} />
    {/* Beams */}
    <path d="M7 8L4 16" stroke={color} strokeWidth="0.8" opacity="0.4" strokeDasharray="1 1" />
    <path d="M17 8L20 16" stroke={color} strokeWidth="0.8" opacity="0.4" strokeDasharray="1 1" />
  </svg>
);

/**
 * Auction Gavel & War Room Icon
 */
export const AuctionGavelIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#E90074' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Gavel Head */}
    <path
      d="M14 3L21 10L18.5 12.5L11.5 5.5L14 3Z"
      fill="#171F35"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Gavel Handle */}
    <line x1="11.5" y1="9" x2="3.5" y2="17" stroke="#C9C3DF" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="3" y1="16.5" x2="4.5" y2="18" stroke="#E90074" strokeWidth="2.2" strokeLinecap="round" />
    {/* Sound Block base with mini cricket ball */}
    <rect x="2" y="19.5" width="10" height="2.5" rx="1" fill="#7545C8" stroke="#29334C" strokeWidth="0.8" />
    <circle cx="17.5" cy="17.5" r="3" fill="#E90074" stroke="#FFFFFF" strokeWidth="0.8" />
    <path d="M16 16Q17.5 17.5 19 19" stroke="#FFFFFF" strokeWidth="0.6" strokeDasharray="1 1" />
  </svg>
);

/**
 * Hidden Gem Diamond Icon
 */
export const HiddenGemIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#7545C8' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Gem Crown & Pavilion */}
    <path
      d="M6 3H18L22 9L12 21L2 9L6 3Z"
      fill="#171F35"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Table & Facets */}
    <path d="M10 3L7.5 9L12 21L16.5 9L14 3" stroke="#E90074" strokeWidth="1" strokeLinejoin="round" />
    <line x1="2" y1="9" x2="22" y2="9" stroke="#C9C3DF" strokeWidth="1" />
    {/* Sparkle star */}
    <path d="M12 5V7M11 6H13" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Head-to-Head Duel Icon (Crossed Bat & Ball with VS Energy)
 */
export const HeadToHeadIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#E90074' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Willow Bat angling right */}
    <line x1="3" y1="21" x2="6" y2="18" stroke="#E90074" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M5.5 18.5L14 10L16 12L7.5 20.5L5.5 18.5Z" fill="#C9C3DF" stroke="#29334C" strokeWidth="0.8" />
    {/* Cricket Ball on the other side */}
    <circle cx="17.5" cy="6.5" r="4.5" fill="#E90074" stroke="#FFFFFF" strokeWidth="1" />
    <path d="M15 5Q17.5 6.5 20 8" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1 1" />
    {/* Electric clash sparks */}
    <path d="M11 4L9 8L13 9L11 13" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Young Talent Radar & Future Stars Discovery Icon
 */
export const YoungTalentRadarIcon: React.FC<IconProps> = ({ size = 20, className = '', color = '#F59E0B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
  >
    {/* Outer Radar Ring */}
    <circle cx="12" cy="12" r="9.5" stroke="#29334C" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="6" stroke="#7545C8" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    {/* Crosshairs */}
    <line x1="12" y1="2" x2="12" y2="22" stroke="#29334C" strokeWidth="0.8" />
    <line x1="2" y1="12" x2="22" y2="12" stroke="#29334C" strokeWidth="0.8" />
    {/* Radar sweep wedge */}
    <path d="M12 12L19 5A9.5 9.5 0 0 0 12 2.5V12Z" fill="url(#radarSweepGrad)" opacity="0.4" />
    <defs>
      <linearGradient id="radarSweepGrad" x1="12" y1="2" x2="19" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E90074" />
        <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Glowing Talent Blip Star */}
    <circle cx="15.5" cy="8.5" r="2.2" fill={color} stroke="#FFFFFF" strokeWidth="0.8" />
    {/* Center Mini Cricket Ball Core */}
    <circle cx="12" cy="12" r="2.5" fill="#E90074" />
  </svg>
);

