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
      intro: 'Through activities, partnerships and sharing knowledge, Iqra Foundation aims to help build a better informed, more inclusive and more engaged society.',
      areas: [
        { title: 'Learning and development', text: 'We create opportunities for learning and personal development through courses, lectures and teaching.' },
        { title: 'Engagement and participation', text: 'We inspire young people and adults to take the initiative, get involved and contribute to positive change in society.' },
        { title: 'Cooperation and community', text: 'We build relationships and spaces where people, organisations and professional communities can meet and work together.' },
      ],
    },
    action: {
      title: 'From knowledge to action',
      items: [
        { title: 'Learning that helps people grow', text: 'Courses, lectures and training that build both professional skills and personal development. We focus on quality, critical reflection and relevance to the participants’ everyday lives.' },
        { title: 'Engagement that creates change', text: 'We inspire young people and adults to take the initiative, develop leadership and contribute through volunteering and social responsibility, locally and nationally.' },
        { title: 'Meeting places that build bridges', text: 'We establish physical and digital spaces for dialogue and cooperation between individuals, organisations, professional communities and public institutions.' },
      ],
    },
    news: {
      title: 'News and events',
      intro: 'News, upcoming events and recent activities from Iqra Foundation.',
      all: 'See all news',
    },
    together: {
      title: 'Together we can make a difference',
      text: 'Lasting change in society comes from shared effort. We welcome cooperation with organisations, institutions, professional communities, businesses and individuals, in Norway and abroad, who share our commitment to knowledge, dialogue and community.',
      buttons: { partner: 'Become a partner', support: 'Support our work' },
    },
  },

  about: {
    title: 'About Iqra Foundation',
    intro: 'Iqra Foundation STI is a non-profit foundation with its registered office in Oslo. It is private and self-owned, and its organisation number is 817 388 752. The foundation was established and is run under the Norwegian Foundations Act, and the Norwegian Foundation Authority (Stiftelsestilsynet) supervises it.',
    name: {
      title: 'The name Iqra',
      text: 'Iqra is Arabic for “read”. It was the first word revealed in the Quran, and it expresses a basic call to seek knowledge and understanding. The name says what we stand for: that learning and enlightenment are the foundation of human development and of a good society.',
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
      close: 'These values are set down in the foundation’s statutes and are to be upheld in all its activities, including in the long term.',
    },
    audience: {
      title: 'Who we are for',
      text: 'Our activities are aimed mainly at young people and adults. Our events and programmes are open to everyone who wants to learn, take part and contribute.',
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
    intro: 'Iqra Foundation turns knowledge, values and engagement into practical action. The work is organised in six areas.',
    areas: [
      {
        title: 'Courses, training and skills development',
        text: 'We run and support teaching, courses and training. Our programmes aim to build the participants’ knowledge, strengthen their capacity for critical reflection and prepare them better for work, education and public life.',
        note: 'Example topics: civic knowledge, democracy and participation, leadership, organisational work, and knowledge of religions and beliefs.',
      },
      { title: 'Seminars, conferences and panel discussions', text: 'We hold seminars, lectures, conferences, debates and panel discussions on academic and current social issues. We invite experts, practitioners and decision-makers, and make sure that different perspectives are heard.' },
      { title: 'Dialogue and mutual understanding', text: 'We start conversations and cooperation between people and communities that rarely meet. The aim is greater cultural understanding, less prejudice and stronger trust in society.' },
      { title: 'Projects, volunteering and leadership', text: 'We initiate, support and carry out projects that promote participation, volunteering, leadership and social responsibility. We particularly want to give young people and young adults experience in taking responsibility, leading processes and getting involved in their local community.' },
      { title: 'Sharing knowledge and publications', text: 'We produce and share articles, reports, digital resources and other educational material. In this way we make academic and socially relevant knowledge available to a wider audience.' },
      { title: 'Meeting places and learning spaces', text: 'We want to create places where people can learn and meet, in person and online. In the longer term we want our own premises, for example a learning centre, an activity centre and a conference venue. The foundation will use them, and so can other organisations with related aims.' },
      { title: 'Cooperation and partnerships', text: 'We work with national and international organisations, institutions and professional communities when this strengthens the foundation’s purpose. Cooperation is based on shared goals, openness and mutual respect.' },
    ],
  },

  people: {
    title: 'Our people',
    intro: 'Iqra Foundation is led by a board with broad experience in the social sciences, organisational life, languages and communication. The board is the foundation’s highest governing body.',
    board: {
      title: 'The board',
      text: 'The board has overall responsibility for the foundation’s strategy, finances, organisation and the fulfilment of its purpose, and represents the foundation externally. It has five members, elected for two years at a time. One member has particular responsibility for finances.',
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
      text: 'You can write to the board at post@iqrasti.no.',
    },
  },

  news: {
    title: 'News and events',
    intro: 'News, announcements and events from Iqra Foundation.',
    filter: { all: 'All', news: 'News', events: 'Events' },
    newsText: 'Updates on the foundation’s work, new projects, partnerships and announcements.',
    eventsText: 'Upcoming seminars, conferences, lectures and courses, with details of time, place, programme and registration. The archive shows past events, with summaries and recordings where available.',
    archiveText: 'The archive shows past events, with summaries and recordings where available.',
    newsletter: { link: 'Sign up for the newsletter', text: 'to receive invitations and updates directly.' },
  },

  resources: {
    title: 'Resources',
    intro: 'Knowledge should be easy to find and easy to share. Our resource library collects material for learning and reflection.',
    categories: [
      { key: 'publikasjoner', title: 'Publications and reports', text: 'Reports, notes and other written material from the foundation’s work.' },
      { key: 'artikler', title: 'Articles and background reading', text: 'Longer pieces on dialogue, civic participation and community.' },
      { key: 'videoer', title: 'Videos and presentations', text: null },
      { key: 'styringsdokumenter', title: 'Governing documents', text: 'The foundation’s statutes, annual accounts, annual report and other key documents. We publish them to be open about how the foundation is run and how its funds are used.' },
    ],
  },

  support: {
    title: 'Support Iqra Foundation',
    intro: 'Donations and partnerships are what let us develop new programmes. With more donations we can hold more courses, events and projects. We can also build meeting places that many people will benefit from for years to come.',
    uses: {
      title: 'Where your contribution goes',
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
      title: 'How you can contribute',
      items: [
        { title: 'Donation', text: 'A one-off amount or regular monthly support.' },
        { title: 'Cooperation and partnership', text: 'For organisations, institutions and businesses that want to support or work with us on specific initiatives.' },
        { title: 'Volunteering', text: 'Give your time, skills and energy to our events and projects.' },
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
