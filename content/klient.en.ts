import type { Klient } from './klient.no.ts';
import type { Loose } from './loose.ts';

/**
 * The client's text (`klient.no.ts`) in English, for the /en pages (2026-11-22).
 *
 * A translation, key for key: the same keys in the same order, each saying what the Norwegian
 * says. British spelling. Plain and professional: short sentences, no added claims, nothing left
 * out. Where the Norwegian uses a dash for a pause, the English uses a comma.
 *
 * When the Norwegian changes, change the line here too. `content/en.test.ts` fails if a key
 * is missing or extra, but it cannot tell whether the meaning still matches.
 */
export const klient = {
  menu: {
    home: 'Home',
    about: 'About us',
    aboutFoundation: 'About Iqra Foundation',
    work: 'Our work',
    people: 'Our people',
    news: 'News and events',
    newsItems: 'News',
    events: 'Events',
    resources: 'Resources',
    contact: 'Contact',
    support: 'Support us',
  },

  home: {
    headline: 'Knowledge that inspires. Community that strengthens.',
    paragraphs: [
      'Iqra Foundation is a non-profit foundation in Oslo, grounded in Islamic values and principles. We work for knowledge and dialogue, and for people to understand each other and take an active part in society. Our work is aimed particularly at young people and adults.',
      'At our meeting places people can learn, share experiences and take responsibility for their own development and for the society around them.',
    ],
    buttons: { about: 'Read more about us', events: 'See upcoming events' },
    why: {
      title: 'Why we exist',
      paragraphs: [
        'With knowledge, people can understand their own situation, take part in society and influence it. When people from different backgrounds meet, listen and work together, trust and community grow.',
        'Iqra Foundation was set up to give this a lasting and independent home. Here, learning and engagement have time to grow. People get the tools to contribute actively to Norwegian society.',
      ],
    },
    create: {
      title: 'What we want to create',
      intro: 'Through activities, partnerships and sharing knowledge, Iqra Foundation wants to help build a better informed and more inclusive society, where more people get involved.',
      areas: [
        { title: 'Learning and development', text: 'Courses, lectures and teaching give people the chance to learn and grow.' },
        { title: 'Engagement and participation', text: 'We encourage young people and adults to take the initiative and get involved in the society around them.' },
        { title: 'Cooperation and community', text: 'We build relationships and create places where people, organisations and experts can meet and work together.' },
      ],
    },
    action: {
      title: 'From knowledge to action',
      items: [
        { title: 'Learning that helps people grow', text: 'Courses, lectures and training that build knowledge and personal growth. We care about quality and critical thinking, and about being useful in everyday life.' },
        { title: 'Engagement that creates change', text: 'We encourage young people and adults to take the initiative and to lead. We also want more people to volunteer, locally and nationally.' },
        { title: 'Meeting places that build bridges', text: 'We create places for conversation and cooperation, in person and online. Individuals, organisations, experts and public institutions can meet there.' },
      ],
    },
    news: {
      title: 'News and events',
      intro: 'News, upcoming events and recent activities from Iqra Foundation.',
      all: 'See all news',
    },
    together: {
      title: 'Together we can make a difference',
      text: 'Lasting change in society takes many people working together. We would like to work with organisations, experts, businesses and individuals, in Norway and abroad, who care about knowledge and dialogue.',
      buttons: { partner: 'Become a partner', support: 'Support our work' },
    },
  },

  about: {
    title: 'About Iqra Foundation',
    intro: 'Iqra Foundation STI is a non-profit foundation with its registered office in Oslo. It is private and self-owned, and its organisation number is 817 388 752. The foundation was established and is run under the Norwegian Foundations Act, and the Norwegian Foundation Authority (Stiftelsestilsynet) supervises it.',
    name: {
      title: 'The name Iqra',
      text: 'Iqra is Arabic for “read”. It was the first word revealed in the Quran, a call to seek knowledge and understanding. The name shows what we stand for. We believe learning and enlightenment are the foundation for people and society to grow.',
    },
    purpose: {
      title: 'Our purpose',
      lead: 'Iqra Foundation has a charitable purpose based on Islamic values and principles. The foundation will:',
      points: [
        'promote knowledge, dialogue and mutual understanding',
        'establish and develop meeting places for learning and community',
        'strengthen participation, community and civic engagement, particularly among young people and adults',
      ],
    },
    values: {
      title: 'Our values',
      lead: 'Our work is built on Islamic values and principles. In practice, this means we emphasise:',
      points: [
        { name: 'Knowledge', text: 'seeking, sharing and applying knowledge with humility and care for quality' },
        { name: 'Responsibility', text: 'towards people, society and the resources we manage' },
        { name: 'Respect', text: 'for the dignity of every person, regardless of background or belief' },
        { name: 'Community', text: 'building trust and cooperation across different communities' },
      ],
      close: 'The values are set down in the foundation’s statutes. They apply to everything the foundation does, in the long term too.',
    },
    audience: {
      title: 'Who we are for',
      text: 'Our work is aimed mainly at young people and adults. Our events and programmes are open to anyone who wants to learn and take part.',
    },
    independent: {
      title: 'A non-profit and independent foundation',
      paragraphs: [
        'Iqra Foundation has no owners and does not operate for profit. All capital, assets and income are to be used solely to advance the foundation’s purpose.',
        'The foundation may run income-generating activities when these support its purpose and contribute to financial sustainability. Any surplus goes back to the purpose in full. The statutes state that neither board members, founders nor people close to them may gain financially from the foundation’s funds.',
      ],
    },
  },

  work: {
    title: 'Our work',
    intro: 'Iqra Foundation turns knowledge and values into practical action. The work is divided into six areas.',
    areas: [
      {
        title: 'Courses, training and skills development',
        text: 'We run and support courses and teaching. Participants should learn something new and get better at thinking critically. That should make it easier to take part in work, education and public life.',
        note: 'Example topics: civic knowledge, democracy and participation, leadership, organisational work, and knowledge of religions and beliefs.',
      },
      { title: 'Seminars, conferences and panel discussions', text: 'We hold seminars, lectures and debates on academic questions and current issues. Experts, practitioners and decision-makers are invited, and different views should be heard.' },
      { title: 'Dialogue and mutual understanding', text: 'We start conversations and cooperation between people and communities that rarely meet. The aim is for people to understand and trust each other more, with less prejudice.' },
      { title: 'Projects, volunteering and leadership', text: 'We start and support projects where people volunteer and learn to lead. Young people and young adults in particular should gain experience of taking responsibility and getting involved where they live.' },
      { title: 'Sharing knowledge and publications', text: 'We write and share articles, reports and digital resources. That way, expert knowledge reaches more people.' },
      { title: 'Meeting places and learning spaces', text: 'We want to create places where people can learn and meet, in person and online. In the longer term we want our own premises, for example a learning centre, an activity centre and a conference venue. The foundation will use them, and so can other organisations with related aims.' },
      { title: 'Cooperation and partnerships', text: 'We work with organisations, institutions and experts in Norway and abroad when it helps the foundation fulfil its purpose. The cooperation rests on shared goals, openness and respect.' },
    ],
  },

  people: {
    title: 'Our people',
    intro: 'Iqra Foundation is led by a board, which is the foundation’s highest governing body. Its members have experience in the social sciences, organisational life, languages and communication.',
    board: {
      title: 'The board',
      text: 'The board is responsible for the foundation’s strategy, finances and organisation, and for making sure its purpose is fulfilled. It also represents the foundation externally. The board has five members, elected for two years at a time, and one of them has particular responsibility for finances.',
    },
    members: [
      { name: 'Mohammed Isak Abdullahi', role: 'Chair' },
      { name: 'Omar Abdirahman', role: 'Board member' },
      { name: 'Ali Mohamed Salah', role: 'Board member' },
      { name: 'Mohammed Abdi Dualeh', role: 'Board member' },
      { name: 'Liiban Abdullahi Abdibashir', role: 'Board member' },
    ],
    contact: {
      title: 'Contact the board',
      text: 'Messages to the board can be sent to post@iqrasti.no.',
    },
  },

  news: {
    title: 'News and events',
    intro: 'News, announcements and events from Iqra Foundation.',
    filter: { all: 'All', news: 'News', events: 'Events' },
    newsText: 'Updates on the foundation’s work, new projects, partnerships and announcements.',
    eventsText: 'Upcoming seminars, lectures and courses, with time, place, programme and registration. The archive shows past events, with summaries and recordings where available.',
    archiveText: 'The archive shows past events, with summaries and recordings where available.',
    newsletter: { link: 'The newsletter', text: 'sends invitations and updates directly by e-mail.' },
  },

  resources: {
    title: 'Resources',
    intro: 'Knowledge should be easy to find and easy to share. Our resource library collects material for learning and reflection.',
    categories: [
      { key: 'publikasjoner', title: 'Publications and reports', text: 'Reports, notes and other written material from the foundation’s work.' },
      { key: 'artikler', title: 'Articles and background reading', text: 'Longer pieces on dialogue, civic participation and community.' },
      { key: 'videoer', title: 'Videos and presentations', text: null },
      { key: 'styringsdokumenter', title: 'Governing documents', text: 'The foundation’s statutes, annual accounts, annual report and other key documents. They are here so anyone can see how the foundation is run and how its money is used.' },
    ],
  },

  support: {
    title: 'Support Iqra Foundation',
    intro: 'Donations and partnerships are what let us develop new programmes. With more donations we can hold more courses, events and projects. We can also build meeting places that many people will benefit from for years to come.',
    uses: {
      title: 'Where contributions go',
      lead: 'All contributions are used solely for the foundation’s charitable purpose, including:',
      points: [
        'courses, training and skills development',
        'seminars, conferences and dialogue events',
        'volunteering and leadership projects for young people and adults',
        'educational material and digital resources',
        'developing meeting places and learning spaces',
      ],
      close: 'The foundation has no owners, and any surplus can never go to private individuals. The accounts are audited and made available.',
    },
    ways: {
      title: 'Ways to contribute',
      items: [
        { title: 'Donation', text: 'A one-off amount or regular monthly support.' },
        { title: 'Cooperation and partnership', text: 'For organisations, institutions and businesses that want to support or work with us on specific initiatives.' },
        { title: 'Volunteering', text: 'Volunteers give time and skills to events and projects.' },
      ],
    },
    close: 'Together we can create more opportunities.',
  },

  contact: {
    name: 'Iqra Foundation STI',
    orgnr: '817 388 752',
    postbox: 'Postboks 9044',
    postcode: '0133 Oslo, Norway',
    phone: '+47 941 43 585',
    email: 'post@iqrasti.no',
  },
} as const satisfies Loose<Klient>;
