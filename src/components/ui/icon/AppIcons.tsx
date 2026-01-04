import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

export const EditIcon = (props: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M13.586 2.586a2 2 0 0 1 2.828 2.828l-9.5 9.5a1 1 0 0 1-.39.242l-4 1.333a.5.5 0 0 1-.632-.632l1.333-4a1 1 0 0 1 .242-.39l9.5-9.5Z" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h1v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm2 4a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm4 1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-6 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 5c5.455 0 9.68 4.145 10.9 6-1.22 1.855-5.445 6-10.9 6S2.32 12.855 1.1 11C2.32 9.145 6.545 5 12 5Zm0 2c-3.59 0-6.86 2.48-8.57 4 1.71 1.52 4.98 4 8.57 4s6.86-2.48 8.57-4c-1.71-1.52-4.98-4-8.57-4Zm0 2.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M11 2h2l.5 2.5a7.5 7.5 0 0 1 2 .83l2.32-1.34 1 1.73-2.1 1.8c.2.54.35 1.1.43 1.68L22 10v2l-2.85.3a7.7 7.7 0 0 1-.43 1.68l2.1 1.8-1 1.73-2.32-1.34a7.5 7.5 0 0 1-2 .83L13 22h-2l-.5-2.5a7.5 7.5 0 0 1-2-.83l-2.32 1.34-1-1.73 2.1-1.8a7.7 7.7 0 0 1-.43-1.68L2 12v-2l2.85-.3c.08-.58.23-1.14.43-1.68l-2.1-1.8 1-1.73 2.32 1.34c.62-.37 1.29-.65 2-.83L11 2Zm1 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
  </svg>
);
