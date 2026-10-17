import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Lerretet } from '@/components/mock/hero/Lerretet';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="3" hero={<Lerretet />} />;
}
