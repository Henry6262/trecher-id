'use client';

import { useState } from 'react';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/images';

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

const DEFAULT_FALLBACK_SRC = '/avatar-fallback.svg';

export function AvatarImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  priority,
}: AvatarImageProps) {
  const normalizedSrc = normalizeImageUrl(src);

  return (
    <AvatarImageInner
      key={normalizedSrc ?? fallbackSrc}
      src={normalizedSrc ?? fallbackSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fallbackSrc={fallbackSrc}
      priority={priority}
    />
  );
}

function AvatarImageInner({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  priority,
}: Required<Pick<AvatarImageProps, 'alt' | 'width' | 'height' | 'fallbackSrc'>> &
  Pick<AvatarImageProps, 'className' | 'priority'> & { src: string }) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      priority={priority}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
