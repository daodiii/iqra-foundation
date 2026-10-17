import { Amiri } from 'next/font/google';

/**
 * MOCK (hero round three, 2026-10-16): the Arabic for the mocks, in Amiri (Naskh, SIL OFL, Google
 * Fonts). The owner: «Iqra Foundation is a Muslim think tank and it needs to showcase that.»
 *
 * IQRA is the name itself, «اقرأ», the first word of the first revelation (96:1). The four area
 * words are MY translations of the brief's Norwegian and must be checked by someone who reads
 * Arabic before anything ships: Kunnskap المعرفة (knowledge), Dialog الحوار (dialogue),
 * Møteplasser الملتقيات (meeting places), Samfunnsdeltakelse المشاركة (participation).
 */
export const amiri = Amiri({ weight: ['400', '700'], subsets: ['arabic'], display: 'swap', variable: '--font-amiri' });

export const IQRA = 'اقرأ';

export const AREA_AR: Record<string, string> = {
  kunnskap: 'المعرفة',
  dialog: 'الحوار',
  moteplasser: 'الملتقيات',
  samfunnsdeltakelse: 'المشاركة',
};
