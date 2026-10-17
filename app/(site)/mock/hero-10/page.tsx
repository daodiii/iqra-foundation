import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Plakaten } from '@/components/mock/hero/Plakaten';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="10" hero={<Plakaten />} />;
}
