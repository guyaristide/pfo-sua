import type { CSSProperties } from 'react';

const paths = {
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  building: 'M4 21V5l8-3 8 3v16zM8 9h2v2H8zm6 0h2v2h-2zM8 13h2v2H8zm6 0h2v2h-2zM10 21v-4h4v4',
  invoice: 'M6 2h9l5 5v15H6zM14 2v6h6M9 12h6M9 16h6',
  payments: 'M2 7h20v12H2zM2 11h20M6 15h4',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  tag: 'M3 3h9l9 9-9 9-9-9zM8 8h.01',
  folder: 'M3 5h6l2 2h10v12H3z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h-2M22 12h-2M12 4V2M12 22v-2M6 6l-1.5-1.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-right': 'M9 6l6 6-6 6',
  'arrow-left': 'M20 12H4M10 6l-6 6 6 6',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12M6 11l6 6 6-6M4 21h16',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  grid: 'M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z',
  check: 'M5 12l5 5L20 7',
  'chevron-up': 'M6 15l6-6 6 6',
  calendar: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-5-6.7',
  bank: 'M3 9l9-6 9 6H3zM5 9v9M10 9v9M14 9v9M19 9v9M3 21h18',
  percent: 'M19 5L5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  close: 'M6 6l12 12M18 6L6 18',
  upload: 'M12 15V3M6 9l6-6 6 6M4 21h16',
  camera: 'M4 7h4l2-3h4l2 3h4v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  print: 'M6 9V3h12v6M6 17H3v-8h18v8h-3M6 14h12v7H6z',
} as const;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, title, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={className}
      style={style}
    >
      {title ? <title>{title}</title> : null}
      <path d={paths[name]} />
    </svg>
  );
}
