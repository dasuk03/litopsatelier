"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { loadProductImage, neonImagePrefix } from "./lib/cms";
import { withBasePath } from "./lib/paths";

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string;
  alt: string;
  fallback?: string;
};

export function ProductImage({
  src,
  alt,
  fallback = "/images/product-terra.webp",
  ...props
}: ProductImageProps) {
  const placeholder = withBasePath(fallback);
  const [resolved, setResolved] = useState(
    src.startsWith(neonImagePrefix) ? placeholder : withBasePath(src),
  );

  useEffect(() => {
    let active = true;
    if (!src.startsWith(neonImagePrefix)) {
      setResolved(withBasePath(src));
      return () => {
        active = false;
      };
    }

    setResolved(placeholder);
    void loadProductImage(src)
      .then((value) => {
        if (active) setResolved(value);
      })
      .catch(() => {
        if (active) setResolved(placeholder);
      });

    return () => {
      active = false;
    };
  }, [placeholder, src]);

  return <img {...props} src={resolved} alt={alt} />;
}
