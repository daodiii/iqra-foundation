import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Ordene } from '@/components/mock/hero/Ordene';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="17" hero={<Ordene />} />;
}
