import { notFound } from 'next/navigation';

/**
 * Any address under /en that no English page answers: the English 404 (app/en/not-found.tsx), in
 * the English shell, rather than the site-wide Norwegian one.
 */
export default function MissingEnglishPage(): never {
  notFound();
}
