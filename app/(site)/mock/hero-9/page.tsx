import { HomeWith } from '@/components/mock/hero/HomeWith';
import { FireFelt } from '@/components/mock/hero/FireFelt';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="9" hero={<FireFelt />} />;
}
