import type { Metadata } from 'next';
import { NotFound } from '@/components/site/NotFound';
import { copy } from '@/content/copy';

export const metadata: Metadata = { title: copy('en').site.pages.notFound.title };

/** A page that is not there, inside this language's site: `notFound()` from a page lands here. */
export default function NotFoundPage() {
  return <NotFound lang="en" />;
}
