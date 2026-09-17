import { collection, config, fields } from '@keystatic/core';
import { COLLECTIONS } from './content/collections';

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
      columns: ['kind', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } } }),
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'Publikasjon', value: 'publikasjon' },
            { label: 'Artikkel', value: 'artikkel' },
            { label: 'Rapport', value: 'rapport' },
            { label: 'Presentasjon', value: 'presentasjon' },
            { label: 'Video', value: 'video' },
            { label: 'Annet', value: 'annet' },
          ],
          defaultValue: 'publikasjon',
        }),
        date: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        summary: fields.text({ label: 'Sammendrag', multiline: true, validation: { isRequired: true } }),
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
        file: fields.file({
          label: 'Fil',
          description: 'En PDF eller annen fil. Enten fil eller lenke.',
          directory: c.ressurser.files.file.directory,
          publicPath: c.ressurser.files.file.publicPath,
        }),
        url: fields.url({ label: 'Lenke', description: 'Der ressursen ligger, om den ikke er en fil her.' }),
      },
    }),
    styringsdokumenter: collection({
      label: 'Styringsdokumenter',
      slugField: 'title',
      path: `${c.styringsdokumenter.dir}/*`,
      format: { data: 'json' },
      columns: ['kind', 'year'],
      schema: {
        title: fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } } }),
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'Vedtekter', value: 'vedtekter' },
            { label: 'Årsrapport', value: 'arsrapport' },
            { label: 'Årsregnskap', value: 'arsregnskap' },
            { label: 'Strategi', value: 'strategi' },
            { label: 'Annet', value: 'annet' },
          ],
          defaultValue: 'arsrapport',
        }),
        year: fields.integer({ label: 'År', validation: { isRequired: true, min: 2020, max: 2100 } }),
        file: fields.file({
          label: 'Fil',
          directory: c.styringsdokumenter.files.file.directory,
          publicPath: c.styringsdokumenter.files.file.publicPath,
          validation: { isRequired: true },
        }),
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
        bio: fields.text({ label: 'Kort presentasjon', multiline: true, validation: { isRequired: true } }),
        order: fields.integer({ label: 'Rekkefølge', description: 'Lavest først.', defaultValue: 10 }),
      },
    }),
  },
});
