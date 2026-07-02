import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M19 10H14V5C14 4.44772 13.5523 4 13 4H11C10.4477 4 10 4.44772 10 5V10H5C4.44772 10 4 10.4477 4 11V13C4 13.5523 4.4477 14 5 14H10V19C10 19.5523 10.4477 20 11 20H13C13.5523 20 14 19.5523 14 19V14H19C19.5523 14 20 13.5523 20 13V11C20 10.4477 19.5523 10 19 10Z"
          fill="currentColor"
        />
      </svg>
      <span className="font-serif font-bold text-xl text-primary tracking-tight">
        Sample Health
      </span>
    </div>
  );
}
