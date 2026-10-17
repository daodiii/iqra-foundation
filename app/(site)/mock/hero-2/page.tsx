import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Soylen } from '@/components/mock/hero/Soylen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="2" hero={<Soylen />} />;
}
