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
  isDeployer?: boolean;
}

const DEFAULT_FALLBACK_SRC = '/avatar-fallback.svg';
const DEPLOYER_FALLBACK_SRC = '/deployer-fallback.svg';

export function AvatarImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  priority,
  isDeployer,
}: AvatarImageProps) {
  const resolvedFallback = isDeployer ? DEPLOYER_FALLBACK_SRC : fallbackSrc;
  const normalizedSrc = normalizeImageUrl(src);

  return (
    <AvatarImageInner
      key={normalizedSrc ?? resolvedFallback}
      src={normalizedSrc ?? resolvedFallback}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fallbackSrc={resolvedFallback}
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
