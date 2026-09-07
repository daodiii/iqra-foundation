import { site } from '@/content/site.no';

export default function Page() {
  return (
    <main>
      <h1>{site.hero.h1Lines.join(' ')}.</h1>
    </main>
  );
}
