import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Byen } from '@/components/mock/hero/Byen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="16" hero={<Byen />} />;
}
