import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Hilsenen } from '@/components/mock/hero/Hilsenen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="15" hero={<Hilsenen />} />;
}
