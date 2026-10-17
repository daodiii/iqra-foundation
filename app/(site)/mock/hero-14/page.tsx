import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Lyset } from '@/components/mock/hero/Lyset';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="14" hero={<Lyset />} />;
}
