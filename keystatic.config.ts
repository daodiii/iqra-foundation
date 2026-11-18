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

export default config({
  storage: github
    ? { kind: 'github', repo: { owner: 'daodiii', name: 'iqra-foundation' } }
    : { kind: 'local' },
  ui: { brand: { name: 'Iqra Foundation' } },
  locale: 'en-US',
  collections: {
    arrangementer: collection({
      label: 'Arrangementer',
      slugField: 'title',
      path: `${c.arrangementer.dir}/*`,
      format: { data: 'json' },
      columns: ['start', 'place'],
      schema: {
        title: fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } } }),
        start: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        time: fields.text({ label: 'Klokkeslett', description: 'Timer og minutter, for eksempel 18:00. Kan stå tomt.' }),
        end: fields.date({ label: 'Sluttdato', description: 'Bare for arrangementer over flere dager.' }),
        place: fields.text({ label: 'Sted', validation: { isRequired: true } }),
        text: fields.text({ label: 'Tekst', multiline: true, validation: { isRequired: true } }),
        area: fields.select({
          label: 'Område',
          description: 'Hvilket av de fire områdene dette hører til, om det hører til ett.',
          options: [
            { label: 'Ingen', value: '' },
            { label: 'Kunnskap', value: 'kunnskap' },
            { label: 'Dialog', value: 'dialog' },
            { label: 'Møteplasser', value: 'moteplasser' },
            { label: 'Samfunnsdeltakelse', value: 'samfunnsdeltakelse' },
          ],
          defaultValue: '',
        }),
        link: fields.url({ label: 'Lenke', description: 'Påmelding eller mer informasjon. Kan stå tomt.' }),
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
        title: fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } } }),
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
        name: fields.slug({ name: { label: 'Navn', validation: { isRequired: true } } }),
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
