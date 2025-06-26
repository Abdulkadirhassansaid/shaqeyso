import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Shaqeyso Hub Logo</title>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" />
      <g stroke="none">
        <circle cx="9.5" cy="8" r="2.5" />
        <path d="M8,18 C10,13 15,14 16,11 C14.5,15 11.5,16.5 8,18 Z" />
      </g>
    </svg>
  ),
};
