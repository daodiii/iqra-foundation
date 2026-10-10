import Image from 'next/image';
import type { Picture } from '@/lib/content';
import styles from './frame.module.css';

/**
 * A post's own picture, in a 3:2 frame it fills — on its card and on its page. The frame
 * gives the shape, so the picture's size is never needed: Arrangementer is regenerated hourly
 * on Vercel, where the uploaded files are not on the function's disk.
 */
export function Frame({ picture, sizes, className }: { picture: Picture; sizes: string; className?: string }) {
  return (
    <div className={className ? `${styles.frame} ${className}` : styles.frame} data-frame>
      <Image src={picture.src} alt={picture.alt} fill sizes={sizes} style={{ objectFit: 'cover' }} />
    </div>
  );
}
