"use client";

import Image from "next/image";

export default function FlixyfyLogo() {
  return (
    <Image
      src="/brand/flixyfy-approved-emblem.png"
      alt="FLIXYFY"
      width={1254}
      height={1254}
      sizes="(max-width: 620px) 62px, (max-width: 820px) 66px, (max-width: 1100px) 92px, 102px"
      priority
      className="brand-logo"
    />
  );
}
