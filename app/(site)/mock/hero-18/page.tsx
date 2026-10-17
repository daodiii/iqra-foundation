import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Skyggen } from '@/components/mock/hero/Skyggen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="18" hero={<Skyggen />} />;
}
