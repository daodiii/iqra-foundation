import type { Metadata } from 'next';
import { MockPage } from '@/components/mock/MockPage';

export const metadata: Metadata = {
  title: 'Mock: materialer og farger',
  description: 'Blekk, vann og flater i merkevarens farger, seksjon for seksjon.',
  robots: { index: false },
};

export default function Mock() {
  return <MockPage />;
}
