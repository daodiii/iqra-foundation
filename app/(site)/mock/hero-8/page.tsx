import { HomeWith } from '@/components/mock/hero/HomeWith';
import { Konstruksjonen } from '@/components/mock/hero/Konstruksjonen';

export const metadata = { robots: { index: false } };

export default function Page() {
  return <HomeWith current="8" hero={<Konstruksjonen />} />;
}
