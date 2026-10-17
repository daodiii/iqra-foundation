import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Skriften } from '@/components/mock/hero/Skriften';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="7" hero={<Skriften />} />;
}
