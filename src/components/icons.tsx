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
      
      {/* Full green ring */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="#16a34a" 
        strokeWidth="2.5" 
        fill="none" 
      />
      
      {/* White half-ring overlay */}
      <path 
        d="M 12, 2 A 10, 10, 0, 0, 0, 12, 22" 
        stroke="white" 
        strokeWidth="2.5" 
        fill="none" 
      />
      
      {/* The Inner Figure */}
      <g fill="#29ABE2" stroke="none">
        <circle cx="12" cy="9.5" r="2.5" />
        <path d="M9.5 13 c 1 1.5, 4 1.5, 5 0 C 13, 16, 11, 17, 9.5, 18 Z" />
      </g>
    </svg>
  ),
};
