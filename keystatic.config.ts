import { collection, config, fields } from '@keystatic/core';
import { COLLECTIONS } from './content/collections';

/**
 * Keystatic: the second door to the collections.
 *
 * A git-based CMS. Its edits are commits, so Vercel rebuilds and the site stays static;
 * it brings its own login (GitHub). The files it writes are the records under
 * `content/<collection>/` that `lib/content.ts` reads — the same shape, the same paths
 * (`content/collections.ts` is the one declaration both read), so an entry written here
 * and an entry typed by hand are the same thing.
 *
 * Two modes. `local` writes the files on this machine under `next dev`, at
 * http://localhost:3000/keystatic. `github` is for editing from the browser in production:
 * a save is a commit on `main` by the editor's GitHub account, and Vercel rebuilds. It needs a
 * GitHub App and five environment variables (README, «Editing in the browser»).
 *
 * The mode is read from `NEXT_PUBLIC_KEYSTATIC_STORAGE`, which Next writes into the browser's
 * bundle too. This config is evaluated in the browser as well (the admin is a client app), and
 * a server-only variable is always undefined there: switched on `KEYSTATIC_GITHUB_CLIENT_ID`, as
 * it was, the admin would have run as local mode against a GitHub-mode server.
 */
const github = process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github';

const c = COLLECTIONS;
type Upload = { directory: string; publicPath: string };

/* ----- what every post shares: arrangementer, nyheter, ressurser ----- */

const title = () => fields.slug({ name: { label: 'Tittel', validation: { isRequired: true } } });

const summary = () =>
  fields.text({
    label: 'Sammendrag',
    description: 'Den korte teksten på kortet og i listen.',
    multiline: true,
    validation: { isRequired: true },
  });

const area = () =>
  fields.select({
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
  });

/**
 * A picture's words, required. The post's own picture will not save without them. A picture in
 * a full text asks for them in its «Image details» dialog (the pencil on the picture), which will
 * not close without them; but the Image button inserts the picture without opening that dialog,
 * and Keystatic 0.6.9 saves the entry with `![](…)` all the same, so the editors' guide has to ask.
 */
const altText = () =>
  fields.text({
    label: 'Bildebeskrivelse',
    description: 'Hva bildet viser, for dem som ikke ser det.',
    validation: { isRequired: true },
  });

/** A picture and its words, one field: ticked, the form will not save without both. */
const picture = (where: Upload) =>
  fields.conditional(fields.checkbox({ label: 'Bilde', description: 'Kryss av for å legge ved et bilde.' }), {
    true: fields.object(
      {
        src: fields.image({
          label: 'Bildefil',
          directory: where.directory,
          publicPath: where.publicPath,
          validation: { isRequired: true },
        }),
        alt: altText(),
      },
      { label: 'Bildet' },
    ),
    false: fields.empty(),
  });

/** A picture's file name inside a full text: unique, so a replaced picture never reuses an old name. */
const uniqueName = (name: string) => `${Date.now().toString(36)}-${name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;

const body = (where: Upload) =>
  fields.markdoc({
    label: 'Brødtekst',
    description: 'Hele teksten. Står den tom, er sammendraget hele innlegget, og det får ingen egen side.',
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
        directory: where.directory,
        publicPath: where.publicPath,
        transformFilename: uniqueName,
        schema: { alt: altText() },
      },
    },
  });

const publish = () =>
  fields.checkbox({
    label: 'Publiser på nettsiden',
    description: 'Uten kryss er innlegget lagret, men vises ikke på nettsiden.',
    defaultValue: false,
  });

export default config({
  storage: github ? { kind: 'github', repo: { owner: 'daodiii', name: 'iqra-foundation' } } : { kind: 'local' },
  ui: {
    brand: { name: 'Iqra Foundation' },
    navigation: {
      Innlegg: ['arrangementer', 'nyheter', 'ressurser'],
      Stiftelsen: ['menneskene', 'styringsdokumenter'],
    },
  },
  locale: 'en-US',
  collections: {
    arrangementer: collection({
      label: 'Arrangementer',
      slugField: 'title',
      path: `${c.arrangementer.dir}/*/`,
      format: { data: 'json' },
      columns: ['start', 'publish'],
      schema: {
        title: title(),
        start: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        time: fields.text({ label: 'Klokkeslett', description: 'Timer og minutter, for eksempel 18:00. Kan stå tomt.' }),
        end: fields.date({ label: 'Sluttdato', description: 'Bare for arrangementer over flere dager.' }),
        place: fields.text({ label: 'Sted', validation: { isRequired: true } }),
        summary: summary(),
        body: body(c.arrangementer.files.body),
        area: area(),
        link: fields.url({ label: 'Påmeldingslenke', description: 'Påmelding eller mer informasjon. Kan stå tomt.' }),
        image: picture(c.arrangementer.files.image),
        publish: publish(),
      },
    }),
    nyheter: collection({
      label: 'Nyheter',
      slugField: 'title',
      path: `${c.nyheter.dir}/*/`,
      format: { data: 'json' },
      columns: ['date', 'publish'],
      schema: {
        title: title(),
        date: fields.date({ label: 'Dato', validation: { isRequired: true } }),
        summary: summary(),
        body: body(c.nyheter.files.body),
        area: area(),
        image: picture(c.nyheter.files.image),
        publish: publish(),
      },
    }),
    ressurser: collection({
      label: 'Ressurser',
      slugField: 'title',
      path: `${c.ressurser.dir}/*/`,
      format: { data: 'json' },
      columns: ['kind', 'date', 'publish'],
      schema: {
        title: title(),
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
        summary: summary(),
        body: body(c.ressurser.files.body),
        area: area(),
        file: fields.file({
          label: 'Fil',
          description: 'En PDF eller annen fil. En ressurs har en fil, en lenke eller en brødtekst.',
          directory: c.ressurser.files.file.directory,
          publicPath: c.ressurser.files.file.publicPath,
        }),
        url: fields.url({ label: 'Lenke', description: 'Der ressursen ligger, om den ikke er en fil her.' }),
        image: picture(c.ressurser.files.image),
        publish: publish(),
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
