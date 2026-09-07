import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** The site's whole motion vocabulary (spec section 3). */
export const EASE = { out: 'expo.out', inOut: 'power2.inOut', none: 'none', in2: 'power2.in', in1: 'power1.inOut' } as const;
export const DUR = { s: 0.3, m: 0.6, l: 0.7 } as const;

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, useGSAP };
