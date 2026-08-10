"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { neonImagePrefix } from "./lib/cms-constants";
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
  loading = "lazy",
  decoding = "async",
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
    void import("./lib/cms")
      .then(({ loadProductImage }) => loadProductImage(src))
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

  return <img {...props} src={resolved} alt={alt} loading={loading} decoding={decoding} />;
}
