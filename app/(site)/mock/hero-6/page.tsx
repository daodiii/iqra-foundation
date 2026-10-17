import { HomeWith } from '@/components/mock/hero/HomeWith';
import { FireVinduer } from '@/components/mock/hero/FireVinduer';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="6" hero={<FireVinduer />} />;
}
