import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Lesningen } from '@/components/mock/hero/Lesningen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="5" hero={<Lesningen />} />;
}
