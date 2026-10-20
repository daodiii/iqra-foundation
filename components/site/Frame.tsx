import Image from 'next/image';
import type { Picture } from '@/lib/content';
import styles from './frame.module.css';

/**
 * A post's own picture, in a 3:2 frame it fills — on its card and on its page. The frame
 * gives the shape, so the picture's size is never needed: Arrangementer is regenerated hourly
 * on Vercel, where the uploaded files are not on the function's disk.
 *
 * `eager` is for a page's lead picture, under the title and likely the largest thing on the
 * first screen: it loads at once and first in line (`loading="eager"`, `fetchPriority="high"`,
 * which Next 16's image doc recommends over `preload`). A card's picture keeps Next's lazy default.
 */
export function Frame({
  picture,
  sizes,
  className,
  eager = false,
}: {
  picture: Picture;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div className={className ? `${styles.frame} ${className}` : styles.frame} data-frame>
      <Image
        src={picture.src}
        alt={picture.alt}
        fill
        sizes={sizes}
        style={{ objectFit: 'cover' }}
        loading={eager ? 'eager' : undefined}
        fetchPriority={eager ? 'high' : undefined}
      />
    </div>
  );
}
