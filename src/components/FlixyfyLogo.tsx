"use client";

import Image from "next/image";

export default function FlixyfyLogo() {
  return (
    <Image
      src="/brand/flixyfy-primary-emblem.png"
      alt="FLIXYFY"
      width={220}
      height={70}
      priority
      className="brand-logo"
    />
  );
}