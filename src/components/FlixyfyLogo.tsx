"use client";

import Image from "next/image";

export default function FlixyfyLogo() {
  return (
    <Image
      src="/brand/flixyfy-approved-emblem.png"
      alt="FLIXYFY"
      width={1254}
      height={1254}
      sizes="(max-width: 768px) 58px, (min-width: 1600px) 68px, 64px"
      priority
      className="brand-logo"
    />
  );
}