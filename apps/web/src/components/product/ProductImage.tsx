"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_SRC = "/branding/logo-principal-verde.png";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function ProductImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
  priority,
  unoptimized,
}: ProductImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src && src.trim() ? src : FALLBACK_SRC);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : width ?? 1200}
      height={fill ? undefined : height ?? 1200}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized || currentSrc !== FALLBACK_SRC}
      onError={() => {
        if (currentSrc !== FALLBACK_SRC) {
          setCurrentSrc(FALLBACK_SRC);
        }
      }}
    />
  );
}