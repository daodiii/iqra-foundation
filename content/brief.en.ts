import type { Brief } from './brief.no.ts';
import type { Loose } from './loose.ts';

/**
 * The foundation's brief (`brief.no.ts`) in English, key for key (2026-11-22). Most of the brief
 * has been replaced on the site by the client's newer text (`klient.*.ts`); what the English pages
 * still read from here is the two sentences under Arrangementer and Kontakt. The rest is
 * translated so the two files keep one shape. The areas' keys stay Norwegian: they are anchors
 * and data, not words a visitor reads.
 */
export const brief = {
  home: {
    headline: 'A foundation for knowledge, dialogue, meeting places and civic participation',
    paragraph: 'Iqra Foundation is an independent, non-profit foundation rooted in Islamic values and principles. We develop knowledge, build meeting places and promote dialogue and active participation in society.',
    buttons: ['Explore our work', 'Support us'],
  },
  vision: {
    headline: 'A society where knowledge and dialogue create understanding, participation and stronger communities.',
    paragraph: 'We want to help build a society where people meet, perspectives are shared and more people have the chance to learn, get involved and take part.',
  },
  mission: {
    headline: 'Iqra Foundation will develop knowledge, build meeting places and make room for dialogue and active participation in society.',
    paragraph: 'Starting from Islamic values, we create spaces for learning, reflection and the exchange of views. Through long-term work and cooperation, we want to strengthen understanding, engagement and participation, particularly among young people and adults.',
  },
  about: {
    title: 'About Iqra Foundation',
    paragraphs: [
      'Iqra Foundation is an independent, non-profit foundation rooted in Islamic values and principles.',
      'We work where knowledge, dialogue, meeting places and civic participation meet.',
      'The foundation aims to be an open and inclusive space for learning, reflection and the exchange of views. We want to bring people together, make knowledge accessible and make room for constructive conversations about faith, society and the questions of our time.',
      'Through sharing knowledge, meeting places, events and cooperation with relevant partners in society, Iqra Foundation will contribute to greater understanding, stronger communities and active participation in society.',
    ],
  },
  areas: [
    { key: 'kunnskap', name: 'Knowledge', text: 'We create spaces for learning, reflection and sharing knowledge. Through academic activities and resources, we want to make knowledge accessible and contribute to a better informed public conversation.' },
    { key: 'dialog', name: 'Dialogue', text: 'We make room for open and constructive conversations about faith, society and current issues. We want to bring different perspectives together and build greater understanding and trust.' },
    { key: 'moteplasser', name: 'Meeting places', text: 'We develop meeting places where people can meet, learn, share perspectives and build relationships. The ambition is to develop both activities and lasting spaces for knowledge, dialogue and community.' },
    { key: 'samfunnsdeltakelse', name: 'Civic participation', text: 'We want to strengthen the opportunities for young people and adults in particular to get involved and take an active part in society. We will promote responsibility, volunteering, leadership, community and democratic participation.' },
  ],
  people: {
    title: 'The people behind Iqra',
    paragraph: 'Iqra Foundation is governed by a board responsible for the foundation’s strategic direction, financial management and long-term development. Behind the foundation’s work are people with different skills and a shared commitment to knowledge, dialogue and civic participation.',
  },
  menu: ['Home', 'About us', 'Our work', 'Events', 'Resources', 'Our people', 'Governing documents', 'Contact', 'Support us'],
  documents: 'Under Governing documents we will in time publish the statutes, annual reports, annual accounts, strategies and other key documents.',
  resources: 'Under Resources we will collect publications, articles, reports, presentations, videos and other material.',
  thread: {
    name: 'IQRA FOUNDATION',
    line: 'Knowledge. Dialogue. Meeting places. Civic participation.',
  },
  four: 'Knowledge | Dialogue | Meeting places | Civic participation',
} as const satisfies Loose<Brief>;
