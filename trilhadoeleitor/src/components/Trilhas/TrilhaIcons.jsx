const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

function IconWrapper({ children, className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function LogoMarkIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1684E8" />
          <stop offset="1" stopColor="#5B35F5" />
        </linearGradient>
      </defs>
      <path d="M18 12h20c8 0 14 6 14 14s-6 14-14 14H26l8 8-8 8-22-22 22-22 8 8-8 8h12c3 0 6-3 6-6s-3-6-6-6H18z" fill="url(#logoGrad)" />
    </svg>
  );
}

export const GridIcon = ({ className }) => (
  <IconWrapper className={className}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </IconWrapper>
);

export const BookIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M3 6.5C3 5.1 4.1 4 5.5 4H11v16H5.5A2.5 2.5 0 0 1 3 17.5z" />
    <path d="M21 6.5C21 5.1 19.9 4 18.5 4H13v16h5.5a2.5 2.5 0 0 0 2.5-2.5z" />
  </IconWrapper>
);

export const GraduationCapIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="m2 9 10-5 10 5-10 5z" />
    <path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" />
  </IconWrapper>
);

export const ClipboardIcon = ({ className }) => (
  <IconWrapper className={className}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5h6v3H9z" />
    <path d="m9 12 2 2 4-4" />
  </IconWrapper>
);

export const ChartIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <rect x="7" y="12" width="3" height="5" rx="1" />
    <rect x="12" y="9" width="3" height="8" rx="1" />
    <rect x="17" y="6" width="3" height="11" rx="1" />
  </IconWrapper>
);

export const EditSquareIcon = ({ className }) => (
  <IconWrapper className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m8 16 1.4-4.3L16 5l3 3-6.6 6.6z" />
  </IconWrapper>
);

export const SettingsIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19 12a7.2 7.2 0 0 0-.1-1l2.1-1.6-2-3.4-2.5 1a8.1 8.1 0 0 0-1.7-1l-.4-2.7h-4l-.4 2.7a8.1 8.1 0 0 0-1.7 1l-2.5-1-2 3.4L5.1 11a7.2 7.2 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a8.1 8.1 0 0 0 1.7 1l.4 2.7h4l.4-2.7a8.1 8.1 0 0 0 1.7-1l2.5 1 2-3.4-2.1-1.6c.1-.3.1-.6.1-1z" />
  </IconWrapper>
);

export const HelpIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.7 9.6a2.5 2.5 0 1 1 4.1 2c-.9.8-1.8 1.3-1.8 2.5" />
    <circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none" />
  </IconWrapper>
);

export const BellIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7.8-2 7.8h16S18 14 18 8z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </IconWrapper>
);

export const SearchIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </IconWrapper>
);

export const FilterIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M3 5h18l-7 8v6l-4-2v-4z" />
  </IconWrapper>
);

export const ChevronDownIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="m6 9 6 6 6-6" />
  </IconWrapper>
);

export const PlusIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconWrapper>
);

export const DotsIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </IconWrapper>
);

export const GripVerticalIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </IconWrapper>
);

export const ClockIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 1.5" />
  </IconWrapper>
);

export const PlayIcon = ({ className }) => (
  <IconWrapper className={className}>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <path d="m11 10 4 2-4 2z" fill="currentColor" stroke="none" />
  </IconWrapper>
);

export const FileIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
  </IconWrapper>
);

export const CircleQuestionIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.8 9.8a2.3 2.3 0 1 1 3.8 1.9c-.8.7-1.6 1.1-1.6 2.1" />
    <circle cx="12" cy="16.9" r=".8" fill="currentColor" stroke="none" />
  </IconWrapper>
);

export const EyeIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.6" />
  </IconWrapper>
);

export const SaveIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M5 4h12l2 2v14H5z" />
    <path d="M8 4v5h8V4" />
    <rect x="8" y="14" width="8" height="4" rx="1" />
  </IconWrapper>
);

export const SendIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="m21 3-9 9" />
    <path d="m21 3-6 18-3-9-9-3z" />
  </IconWrapper>
);

export const InfoIcon = ({ className }) => (
  <IconWrapper className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10v6" />
    <circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" />
  </IconWrapper>
);

export const UploadCloudIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M20 16.5a4 4 0 0 0-1.4-7.7A6 6 0 0 0 7.1 8a4 4 0 0 0 .4 8H20z" />
    <path d="m12 16V9" />
    <path d="m9.3 11.7 2.7-2.7 2.7 2.7" />
  </IconWrapper>
);

export const BookmarkIcon = ({ className }) => (
  <IconWrapper className={className}>
    <path d="M7 4h10v16l-5-3-5 3z" />
  </IconWrapper>
);
