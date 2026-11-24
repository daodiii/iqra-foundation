import { ForsideShell } from '@/components/site/Shells';

/** The front page's own shell (components/site/Shells.tsx). */
export default function ForsideLayout({ children }: { children: React.ReactNode }) {
  return <ForsideShell lang="no">{children}</ForsideShell>;
}
