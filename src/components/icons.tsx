type IconProps = { className?: string };

const base = 'h-5 w-5';

export function CheckIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoundOnIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M13 7.2a4 4 0 0 1 0 5.6M15.4 5a7 7 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoundOffIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 7.8 17 12M17 7.8 13.2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.3 1.3M6 14l-1.3 1.3M15.3 15.3 14 14M6 6 4.7 4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RefreshIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.2 8A6.4 6.4 0 1 0 16 12.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16.6 3.6V8h-4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReviewIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.8 17.5 16H2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 7.6v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.95" fill="currentColor" />
    </svg>
  );
}

export function TrashIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.8 5.5h12.4M8.2 5.5V3.8h3.6v1.7M5.4 5.5l.7 10.1a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9l.7-10.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChartIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="2.8"
        y="3.2"
        width="14.4"
        height="13.6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M2.8 8h14.4M8 3.2v13.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function AssistIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.2 4.6a12 12 0 0 1 6.8 1.5v9.6a12 12 0 0 0-6.8-1.5zM16.8 4.6a12 12 0 0 0-6.8 1.5v9.6a12 12 0 0 1 6.8-1.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SpeakerIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.6h2.4L10 4.8v10.4L6.9 12.4H4.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12.9 7.6a3.6 3.6 0 0 1 0 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Section icons ────────────────────────────────────────────────────────────

/** Học chữ — a flashcard. */
export function CardsIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="2.6"
        y="5.4"
        width="10.5"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6.4 3.5h7.6a2.6 2.6 0 0 1 2.6 2.6v7.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Viết — a pen on a baseline. */
export function PenIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m12.6 3.6 3.2 3.2-7.5 7.5-4 .8.8-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.2 17.4h13.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Ghép chữ — two blocks joining into one. */
export function BlocksIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.6" y="2.8" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect
        x="11.4"
        y="2.8"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect x="7" y="11.4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Nghe — sound arriving at an ear. */
export function EarIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6.2 8a3.8 3.8 0 1 1 7.6 0c0 2-1.6 2.8-2.6 3.8-.7.7-.8 1.4-.8 2.2a2 2 0 0 1-3.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.2a1 1 0 0 1 1.9.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
