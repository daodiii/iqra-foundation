import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Preget } from '@/components/mock/hero/Preget';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="13" hero={<Preget />} />;
}
