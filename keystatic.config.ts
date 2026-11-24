import { createElement } from 'react';
import { collection, config, fields } from '@keystatic/core';
import { COLLECTIONS } from './content/collections';
import { klient } from './content/klient.no';

/**
 * Keystatic: the second door to the collections.
 *
 * A git-based CMS. Its edits are commits, so Vercel rebuilds and the site stays static;
 * it brings its own login (GitHub). The files it writes are the JSON records under
 * `content/<collection>/` that `lib/content.ts` reads — the same shape, the same paths
 * (`content/collections.ts` is the one declaration both read), so an entry written here
 * and an entry typed by hand are the same thing.
 *
 * Two modes. `local` writes the files on this machine under `next dev`, at
 * http://localhost:3001/keystatic. `github` is for editing from the browser in
 * production, and needs a GitHub App and four environment variables (README, «Redigere
 * innhold»); until they exist the admin is not served — `lib/keystatic.ts` — because a
 * local-mode admin on Vercel has no disk to write to.
 */
const github = process.env.KEYSTATIC_GITHUB_CLIENT_ID !== undefined;

const c = COLLECTIONS;
type Upload = { directory: string; publicPath: string };

/**
 * A picture's words, required (from PR 62). The post's own picture will not save without them.
 * A picture in the article text asks for them in its «Image details» dialog (the pencil on the
 * picture).
 */
const altText = () =>
  fields.text({ label: 'Bildebeskrivelse', description: 'Hva bildet viser, for dem som ikke ser det.', validation: { isRequired: true } });

/** A picture and its words, one field: ticked, the form will not save without both. */
const picture = (where: Upload) =>
  fields.conditional(fields.checkbox({ label: 'Bilde', description: 'Kryss av for å legge ved et bilde.' }), {
    true: fields.object(
      {
        src: fields.image({ label: 'Bildefil', directory: where.directory, publicPath: where.publicPath, validation: { isRequired: true } }),
        alt: altText(),
      },
      { label: 'Bildet' },
    ),
    false: fields.empty(),
  });

/**
 * The web address Keystatic makes from the title. It asks for it under the title, so it gets a
 * Norwegian name and a line saying it can be left alone.
 */
const address = (from: string) => ({
  label: 'Nettadresse',
  description: `Lages av ${from}. Trenger ikke endres.`,
});

/**
 * The foundation's mark in the editor's corner, beside the name. Navy on the light theme; white
 * on the dark one, where navy would vanish.
 */
const mark = ({ colorScheme }: { colorScheme: 'light' | 'dark' }) =>
  createElement('img', {
    src: '/brand/iqra-mark.svg',
    alt: '',
    height: 20,
    style: { height: 20, width: 'auto', filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : undefined },
  });

/** A picture's file name inside an article: unique, so a replaced picture never reuses an old name. */
const uniqueName = (name: string) => `${Date.now().toString(36)}-${name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;

export default config({
  storage: github
    ? { kind: 'github', repo: { owner: 'iqrasti', name: 'iqra-foundation' } }
    : { kind: 'local' },
  ui: {
    brand: { name: 'Iqra Foundation', mark },
    // The editor's menu follows the site's: Aktuelt, then Ressurser, then Om oss.
    navigation: {
      [klient.menu.news]: ['nyheter', 'arrangementer'],
      [klient.menu.resources]: ['ressurser'],
      [klient.menu.about]: ['menneskene'],
    },
  },
  // Keystatic's own buttons and menus in Norwegian (its nb-NO translation).
  locale: 'nb-NO',
  collections: {
    /** Nyheter (M3): headline, ingress, picture, date and article text; saved as a draft until «Publiser» is ticked. */
    nyheter: collection({
      label: 'Nyheter',
      slugField: 'title',
      path: `${c.nyheter.dir}/*/`,
      format: { data: 'json', contentField: 'body' },
      columns: ['date', 'publish'],
      schema: {
        title: fields.slug({ name: { label: 'Overskrift', validation: { isRequired: true } }, slug: address('overskriften') }),
        date: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        summary: fields.text({ label: 'Ingress', description: 'Den korte teksten under overskriften, og på kortet.', multiline: true, validation: { isRequired: true } }),
        image: picture(c.nyheter.files.image),
        body: fields.markdoc({
          label: 'Artikkeltekst',
          description: 'Hele artikkelen. Mellomoverskrifter, fet og kursiv, lenker, lister, sitater og bilder.',
          options: {
            heading: [2, 3],
            bold: true,
            italic: true,
            strikethrough: false,
            code: false,
            link: true,
            blockquote: true,
            orderedList: true,
            unorderedList: true,
            divider: true,
            table: false,
            codeBlock: false,
            image: {
              directory: c.nyheter.files.body.directory,
              publicPath: c.nyheter.files.body.publicPath,
              transformFilename: uniqueName,
              schema: { alt: altText() },
            },
          },
        }),
        publish: fields.checkbox({ label: 'Publiser på nettsiden', description: 'Uten kryss er nyheten lagret, men vises ikke på nettsiden.', defaultValue: false }),
      },
    }),
    arrangementer: collection({
      label: 'Arrangementer',
      slugField: 'title',
      path: `${c.arrangementer.dir}/*`,
      format: { data: 'json' },
      columns: ['start', 'place'],
      schema: {
        title: fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } }, slug: address('tittelen') }),
        start: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        time: fields.text({ label: 'Klokkeslett', description: 'Timer og minutter, for eksempel 18:00. Kan stå tomt.' }),
        end: fields.date({ label: 'Sluttdato', description: 'Bare for arrangementer over flere dager.' }),
        place: fields.text({ label: 'Sted', validation: { isRequired: true } }),
        text: fields.text({ label: 'Beskrivelse', multiline: true, validation: { isRequired: true } }),
        link: fields.url({ label: 'Påmelding', description: 'Lenke til påmelding eller mer informasjon. Kan stå tomt.' }),
        program: fields.text({ label: 'Program', description: 'Programmet for arrangementet. Kan stå tomt.', multiline: true }),
        report: fields.text({ label: 'Referat', description: 'Etter arrangementet: et referat som vises i arkivet. Kan stå tomt.', multiline: true }),
        recording: fields.url({ label: 'Opptak', description: 'Etter arrangementet: lenke til opptak, vist i arkivet. Kan stå tomt.' }),
        image: fields.object(
          {
            src: fields.image({
              label: 'Bilde',
              directory: c.arrangementer.files.image.directory,
              publicPath: c.arrangementer.files.image.publicPath,
            }),
            alt: fields.text({ label: 'Bildebeskrivelse', description: 'Hva bildet viser, for dem som ikke ser det. Må fylles ut når det er et bilde.' }),
          },
          { label: 'Bilde' },
        ),
      },
    }),
    ressurser: collection({
      label: 'Ressurser',
      slugField: 'title',
      path: `${c.ressurser.dir}/*`,
      format: { data: 'json' },
      columns: ['category', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } }, slug: address('tittelen') }),
        category: fields.select({
          label: 'Kategori',
          options: klient.resources.categories.map((k) => ({ label: k.title, value: k.key })),
          defaultValue: 'publikasjoner',
        }),
        date: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        summary: fields.text({ label: 'Sammendrag', multiline: true, validation: { isRequired: true } }),
        file: fields.file({
          label: 'Fil',
          description: 'En PDF, en presentasjon eller et annet dokument.',
          directory: c.ressurser.files.file.directory,
          publicPath: c.ressurser.files.file.publicPath,
        }),
        video: fields.file({
          label: 'Video',
          description: 'En videofil (MP4) som spilles av på nettsiden.',
          directory: c.ressurser.files.video.directory,
          publicPath: c.ressurser.files.video.publicPath,
        }),
        url: fields.url({ label: 'Lenke', description: 'Der ressursen ligger, om den ikke er lastet opp her. Én av fil, video eller lenke må fylles ut.' }),
      },
    }),
    menneskene: collection({
      label: 'Menneskene bak',
      slugField: 'name',
      path: `${c.menneskene.dir}/*`,
      format: { data: 'json' },
      columns: ['role', 'order'],
      schema: {
        name: fields.slug({ name: { label: 'Navn', validation: { isRequired: true } }, slug: address('navnet') }),
        role: fields.text({ label: 'Rolle', validation: { isRequired: true } }),
        photo: fields.object(
          {
            src: fields.image({
              label: 'Bilde',
              directory: c.menneskene.files.photo.directory,
              publicPath: c.menneskene.files.photo.publicPath,
            }),
            alt: fields.text({ label: 'Bildebeskrivelse', description: 'Må fylles ut når det er et bilde.' }),
          },
          { label: 'Bilde' },
        ),
        bio: fields.text({ label: 'Kort biografi', multiline: true, description: 'Noen setninger om personen. Kan stå tomt til den er skrevet.' }),
        order: fields.integer({ label: 'Rekkefølge', description: 'Lavest først.', defaultValue: 10 }),
      },
    }),
  },
});
