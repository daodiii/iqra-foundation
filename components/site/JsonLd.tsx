import { siteGraph } from '@/lib/schema';

/**
 * The foundation and the site as JSON-LD (lib/schema.ts), in the server-rendered HTML of every page.
 * A data block, not a script that runs, so the content security policy does not apply to it. `<` is
 * escaped as Next's JSON-LD guide does, so no value can close the tag.
 */
export function JsonLd({ lang }: { lang: 'nb' | 'en' }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph(lang)).replace(/</g, '\\u003c') }}
    />
  );
}
