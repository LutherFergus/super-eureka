type MosaicMarkProps = {
  className?: string;
  title?: string;
};

/** Brand mark: C2C quilt diamond in Mosaic teal / copper / ink. */
export function MosaicMark({
  className = "mosaic-mark",
  title = "Mosaic",
}: MosaicMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient
          id="mosaicMarkBg"
          x1="18"
          y1="8"
          x2="110"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1f7a66" />
          <stop offset="1" stopColor="#145245" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#mosaicMarkBg)" />
      <rect x="22" y="22" width="84" height="84" rx="18" fill="#eef3ef" />
      <path d="M30 64 L64 30 L64 64 Z" fill="#9fc0b4" />
      <path d="M64 30 L98 64 L64 64 Z" fill="#1f7a66" />
      <path d="M30 64 L64 64 L64 98 Z" fill="#b56a3a" />
      <path d="M64 64 L98 64 L64 98 Z" fill="#14201c" />
      <circle cx="34" cy="34" r="5" fill="#145245" />
      <circle cx="94" cy="34" r="5" fill="#145245" />
      <circle cx="34" cy="94" r="5" fill="#145245" />
      <circle cx="94" cy="94" r="5" fill="#145245" />
    </svg>
  );
}
