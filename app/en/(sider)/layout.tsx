import { ForsideShell } from '@/components/site/Shells';

/** The redesigned subpages' shell: the front page's, with the logo standing in the header from the first frame (components/site/Shells.tsx). */
export default function SiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ForsideShell lang="en" mark>
      {children}
    </ForsideShell>
  );
}
