import { HomeWith } from '@/components/mock/hero/HomeWith';
import { StadenMidt } from '@/components/mock/hero/Bagdad';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="25" hero={<StadenMidt />} />;
}
