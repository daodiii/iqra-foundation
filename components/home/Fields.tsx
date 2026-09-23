import { Logo } from '@/components/site/Logo';
import type { Area } from './areas';
import styles from './fields.module.css';

/**
 * What every field carries, opened out as a band on Vårt arbeid: the name, the brief's
 * text, and the guide's logo for the ground, in the corner, decorative because the name is
 * the text beside it. No number: the colour and the name say which area this is. (On the
 * home page the fields are the sea, `Sea.tsx`, with its own pages of words.)
 */
export function FieldBody({ area, headingId, level: Heading = 'h3' }: { area: Area; headingId: string; level?: 'h2' | 'h3' }) {
  return (
    <>
      <Heading id={headingId} className={styles.name}>{area.name}</Heading>
      <p className={styles.text}>{area.text}</p>
      <span className={styles.logo}>
        <Logo ground={area.ground} height={28} decorative />
      </span>
    </>
  );
}
