import { site } from './site.en.ts';
import type { privacy as privacyNo } from './legal.no.ts';

/**
 * The privacy notice and the terms of use (`legal.no.ts`) in English (2026-11-22). Still a DRAFT,
 * like the Norwegian: it says no more than is true of the site today, and the foundation must read
 * it before the site is announced. The Norwegian text is the one that counts; the English is a
 * translation of it, and says so in its lede.
 */

type Legal = typeof privacyNo;

const c = site.contact;
const who = `${c.name}, organisation number ${c.orgnr}, ${c.address.join(', ')}. Email: ${c.email}.`;

export const privacy: Legal = {
  title: 'Privacy',
  description: 'What information the Iqra Foundation website processes, why, and what your rights are.',
  lede: 'We collect as little as possible. This page explains what the website does and what you can ask us for. It is a translation; if it differs from the Norwegian version, the Norwegian applies.',
  updated: '18 October 2026',
  sections: [
    {
      id: 'ansvarlig',
      heading: 'Who is responsible',
      paragraphs: [`The controller of the information on this website is ${who}`],
    },
    {
      id: 'besok',
      heading: 'When you visit the website',
      paragraphs: [
        'The website is hosted by Vercel, which delivers the pages to your browser. To do this, and to protect the site against misuse, the provider processes technical information about your visit, including your IP address, the time and the page you requested. The legal basis is our legitimate interest in delivering and securing the website (GDPR Article 6(1)(f)).',
        'We have no logins, user accounts or forms that send information to us.',
      ],
    },
    {
      id: 'statistikk',
      heading: 'Statistics',
      paragraphs: [
        'We use Vercel Web Analytics to count visits. The tool does not use cookies and does not build a profile of you. We see combined statistics: which pages are read, where visits come from, and what type of device and browser is used. The legal basis is our legitimate interest in understanding how the website is used (Article 6(1)(f)).',
      ],
    },
    {
      id: 'kapsler',
      heading: 'Cookies',
      paragraphs: [
        'The website sets no cookies and does not use browser storage to track you. That is why there is no banner asking for consent. If this changes, we will update this page first.',
      ],
    },
    {
      id: 'epost',
      heading: 'When you write to us',
      paragraphs: [
        `If you email us (${c.email}), we use what you write and your address to reply and to follow up your enquiry. We keep it for as long as that takes, and no longer. The legal basis is our legitimate interest in answering enquiries (Article 6(1)(f)).`,
      ],
    },
    {
      id: 'andre',
      heading: 'Other websites',
      paragraphs: [
        'The website links to services we do not control. “Set up AvtaleGiro” takes you to Solidus, where the agreement is made and you enter your payment details. Their privacy notice applies there, not this one. The same goes for Vipps and your bank when you give that way. The map on the Contact page is an image stored on our own website; the link to OpenStreetMap is only a credit.',
      ],
    },
    {
      id: 'deling',
      heading: 'Sharing',
      paragraphs: ['We do not sell information about you, and we do not share it with anyone other than the providers needed to run the website, or when the law requires it.'],
    },
    {
      id: 'rettigheter',
      heading: 'Your rights',
      paragraphs: [`You can ask us what information we hold about you, and ask for it to be corrected or deleted. You can also ask for the processing to be restricted, and you can object to it. Write to ${c.email}. You can complain to the Norwegian Data Protection Authority, Datatilsynet (datatilsynet.no), if you believe we process information in breach of the rules.`],
    },
    {
      id: 'endringer',
      heading: 'Changes',
      paragraphs: ['We update this page when the website changes. The date at the bottom shows when it was last changed.'],
    },
  ],
};

export const terms: Legal = {
  title: 'Terms',
  description: 'Terms of use for the Iqra Foundation website: content, liability, donations and links.',
  lede: 'These are the terms for using the website. They are short, because the website is too. This is a translation; if it differs from the Norwegian version, the Norwegian applies.',
  updated: '18 October 2026',
  sections: [
    {
      id: 'nettsiden',
      heading: 'About the website',
      paragraphs: [`The website is run by ${who} It tells you about the foundation and our work. By using it, you accept these terms.`],
    },
    {
      id: 'innhold',
      heading: 'Content and copyright',
      paragraphs: [
        'The texts, images, logo and design belong to Iqra Foundation or are used with permission. You may read the content, share the link and quote it with credit. You may not copy, change or use the content commercially, or use the name and logo as if they were your own, without our written consent.',
      ],
    },
    {
      id: 'ansvar',
      heading: 'Liability',
      paragraphs: [
        'We do our best to make sure that what is written here is correct and up to date, but we cannot promise that it is free of errors. Events, times and places may change. To the extent the law allows, we are not liable for losses that result from relying on the content.',
      ],
    },
    {
      id: 'gaver',
      heading: 'Donations',
      paragraphs: [
        'You can give to Iqra Foundation by bank transfer, with Vipps or with AvtaleGiro. The payment is made with your bank, Vipps or Solidus, not on this website, and their terms apply to the payment. Ask us if you have any questions.',
      ],
    },
    {
      id: 'lenker',
      heading: 'Links',
      paragraphs: ['Links to other websites are there to help. We do not control those websites and are not responsible for their content.'],
    },
    {
      id: 'lov',
      heading: 'Law',
      paragraphs: ['Norwegian law applies to the use of the website.'],
    },
    {
      id: 'kontakt',
      heading: 'Contact',
      paragraphs: [`Questions about the terms: ${c.email}.`],
    },
  ],
};
