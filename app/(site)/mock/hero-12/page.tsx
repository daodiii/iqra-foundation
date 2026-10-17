import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Vekten } from '@/components/mock/hero/Vekten';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="12" hero={<Vekten />} />;
}
