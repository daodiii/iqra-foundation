import Image from 'next/image';
import { pictureSize } from '@/lib/picture-size';
import styles from './body.module.css';

/** At most as wide as the text column; the whole screen on a phone. */
const SIZES = '(max-width: 700px) 100vw, 640px';

/**
 * A picture inside a full text, at its own proportions, resized by Next. Markdoc puts it
 * inside a paragraph, so it is an <img> alone — a <figure> there would be invalid HTML and
 * break hydration. A picture whose size cannot be read (not a file under `public/`) is shown
 * as it is, plain.
 */
export function BodyImage({ src, alt = '', root }: { src: string; alt?: string; root?: string }) {
  const size = pictureSize(src, root);
  if (!size) {
    // A plain <img>: there is no size to give next/image.
    return <img src={src} alt={alt} loading="lazy" className={styles.picture} />;
  }
  return <Image src={src} alt={alt} width={size.width} height={size.height} sizes={SIZES} className={styles.picture} />;
}
