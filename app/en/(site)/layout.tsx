import { SiteShell } from '@/components/site/Shells';

/** The site's old shell, kept by the article, the archive and the legal pages (components/site/Shells.tsx). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
