import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Kapitlene } from '@/components/mock/hero/Kapitlene';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="1" hero={<Kapitlene />} />;
}
