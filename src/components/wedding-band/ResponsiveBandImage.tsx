import { useEffect, useState } from 'react';

interface Props {
  src384: string;
  src768: string;
  fallback: string;
  alt: string;
  eager?: boolean;
  className?: string;
  onLoadState?: (loaded: boolean) => void;
}

export function ResponsiveBandImage({ src384, src768, fallback, alt, eager = false, className, onLoadState }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    onLoadState?.(false);
  }, [src384, src768, fallback, onLoadState]);
  const source = failed ? fallback : src384;
  return (
    <div className={`responsive-image ${loaded ? 'is-loaded' : ''} ${className ?? ''}`}>
      {!loaded && <span className="image-skeleton" aria-hidden="true" />}
      <picture>
        {!failed && <source media="(min-width: 390px)" srcSet={src768} type="image/webp" />}
        <img
          src={source}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width={768}
          height={768}
          onLoad={() => { setLoaded(true); onLoadState?.(true); }}
          onError={() => { if (!failed) { setFailed(true); setLoaded(false); } }}
        />
      </picture>
    </div>
  );
}
