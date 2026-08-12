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
      <rect width="128" height="128" rx="28" fill="#1f7a66" />
      <rect x="16" y="16" width="96" height="96" rx="20" fill="#eef3ef" />
      <path d="M26 64 L64 26 L64 64 Z" fill="#9fc0b4" />
      <path d="M64 26 L102 64 L64 64 Z" fill="#1f7a66" />
      <path d="M26 64 L64 64 L64 102 Z" fill="#b56a3a" />
      <path d="M64 64 L102 64 L64 102 Z" fill="#14201c" />
      <circle cx="30" cy="30" r="5.5" fill="#145245" />
      <circle cx="98" cy="30" r="5.5" fill="#145245" />
      <circle cx="30" cy="98" r="5.5" fill="#145245" />
      <circle cx="98" cy="98" r="5.5" fill="#145245" />
    </svg>
  );
}
