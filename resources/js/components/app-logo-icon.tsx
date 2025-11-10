import { SVGAttributes } from "react";

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 365 362"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      stroke="none"
    >
      <g transform="translate(0,362) scale(0.1,-0.1)">
        <path d="M487 2592 l-337 -337 0 -430 0 -430 338 -338 337 -337 430 0 430 0
        338 338 337 337 0 425 0 425 -552 -552 -553 -553 -338 338 c-186 185 -339 340
        -340 344 -1 4 223 233 498 510 276 277 520 524 544 551 l44 47 -419 0 -419 0
        -338 -338z"/>
        <path d="M1597 2592 l-337 -337 0 -425 0 -425 553 553 552 552 342 -342 342
        -343 -544 -548 c-300 -301 -545 -549 -545 -552 0 -3 188 -5 418 -5 l417 0 338
        338 337 337 0 430 0 430 -338 338 -337 337 -430 0 -430 0 -338 -338z"/>
      </g>
    </svg>
  );
}
