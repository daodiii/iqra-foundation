import { Hero } from '@/components/home/Hero';
import { HomeWith } from '@/components/mock/hero/HomeWith';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="i-dag" hero={<Hero />} />;
}
