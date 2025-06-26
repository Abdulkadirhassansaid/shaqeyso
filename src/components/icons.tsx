import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Shaqeyso Hub Logo</title>
      <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2" fill="none" />
      <g fill="#1e40af">
        <circle cx="12" cy="8" r="2.5" />
        <path d="M16.5 19a4.5 4.5 0 0 0-9 0z" />
      </g>
      <path
        d="M8 14.5c0-3 1.5-5 4-5s4 2 4 5"
        stroke="#1e40af"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
};
