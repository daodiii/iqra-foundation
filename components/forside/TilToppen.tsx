'use client';

import { useCopy } from '@/components/site/Lang';
import { scrollToY } from '@/lib/smooth';

/** «Til toppen»: back to the hero, carried by the glide where it runs. A link to the top, so it works without JavaScript too. */
export function TilToppen({ className }: { className?: string }) {
  const { site } = useCopy();
  return (
    <a
      href="#topp"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        scrollToY(0);
      }}
    >
      <span aria-hidden="true">↑</span> {site.footer.toTop}
    </a>
  );
}
