import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AreaKey, Picture } from '@/lib/content';
import { AreaMark } from './AreaMark';
import { Body } from './Body';
import { Frame } from './Frame';
import page from './page.module.css';
import styles from './post.module.css';

/** As wide as the text column; the whole screen on a phone. */
const SIZES = '(max-width: 700px) 100vw, 640px';

/**
 * One post's page — an event, a news item or an article, one layout for all three, in the
 * subpages' plain style: the way back to its list, the title, the date (and for an event the
 * time and place), its area, its picture, the full text, and an event's sign-up link. The
 * title is a plain h1, not a PageTitle morph: two titles with one morph name on a page is a
 * React error.
 */
export function Post({
  back,
  title,
  meta,
  area,
  image,
  action,
  body,
}: {
  back: { href: string; label: string };
  title: string;
  meta: ReactNode;
  area: AreaKey | null;
  image: Picture | null;
  action?: { href: string; label: string } | null;
  body: string;
}) {
  return (
    <article className={page.page}>
      <p className={styles.back}>
        <Link href={back.href} prefetch={false}>
          <span aria-hidden="true">← </span>
          {back.label}
        </Link>
      </p>
      <h1 className={styles.title}>{title}</h1>
      <p className={page.meta}>{meta}</p>
      {area && (
        <p className={page.meta}>
          <AreaMark area={area} />
        </p>
      )}
      {image && <Frame picture={image} sizes={SIZES} className={styles.picture} eager />}
      <Body source={body} />
      {action && (
        <p className={styles.action}>
          <a href={action.href}>{action.label}</a>
        </p>
      )}
    </article>
  );
}
