import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Staden } from '@/components/mock/hero/Bagdad';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="24" hero={<Staden />} />;
}
