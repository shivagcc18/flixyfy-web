"use client";

import Image from "next/image";

export default function FlixyfyLogo() {
  return (
    <Image
      src="/brand/flixyfy-approved-emblem.png"
      alt="FLIXYFY"
      width={1254}
      height={1254}
      sizes="(max-width: 620px) 56px, (max-width: 768px) 60px, 96px"
      priority
      className="brand-logo"
    />
  );
}
