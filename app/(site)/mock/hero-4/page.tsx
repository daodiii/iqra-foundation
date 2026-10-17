import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Skulpturen } from '@/components/mock/hero/Skulpturen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="4" hero={<Skulpturen />} />;
}
