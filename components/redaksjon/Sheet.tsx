'use client';

import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { EXTENSIONS, fromMarkdown, toMarkdown } from '@/lib/redaksjon/markdown';
import type { Pic } from '@/lib/redaksjon/schema';
import { Icon } from './Icon';
import { Picture } from './Picture';
import { Toolbar } from './Toolbar';
import s from './editor.module.css';

/** Grows a text area with its text where `field-sizing` is not supported. */
function grow(el: HTMLTextAreaElement | null) {
  if (!el || CSS.supports('field-sizing', 'content')) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

type Props = {
  title: string; onTitle: (v: string) => void;
  summary: string; onSummary: (v: string) => void;
  image: Pic; onImage: (p: Pic) => void;
  body: string; onBody: (md: string) => void;
  /** Shrinks a chosen picture and keeps it for the next save; gives back an address to show it by. */
  addPicture: (file: File) => Promise<string>;
  missing: Set<string>;
};

/**
 * The sheet: the cover and its description, the headline, the ingress, and the text with its
 * toolbar. What is typed goes straight up to the editor's state; the text as Markdown.
 */
export function Sheet(p: Props) {
  const editor = useEditor({
    extensions: [...EXTENSIONS, Placeholder.configure({ placeholder: 'Skriv teksten her …' })],
    content: fromMarkdown(p.body),
    immediatelyRender: false,
    editorProps: { attributes: { 'aria-label': 'Tekst', class: 'redaksjon-text' } },
    onUpdate: ({ editor: e }) => p.onBody(toMarkdown(e.getJSON())),
  });

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { grow(titleRef.current); grow(summaryRef.current); }, [p.title, p.summary]);

  const coverInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'cover' | 'text' | null>(null);
  const [problem, setProblem] = useState('');
  const [pending, setPending] = useState<{ src: string; alt: string } | null>(null);

  const take = async (file: File | undefined, where: 'cover' | 'text') => {
    if (!file) return;
    setBusy(where);
    setProblem('');
    try {
      const src = await p.addPicture(file);
      if (where === 'cover') p.onImage({ src, alt: p.image?.alt ?? '' });
      else setPending({ src, alt: '' });
    } catch (e) {
      setProblem((e as Error).message || 'Kunne ikke bruke bildet.');
    } finally {
      setBusy(null);
    }
  };

  const insert = () => {
    if (!editor || !pending || !pending.alt.trim()) return;
    editor.chain().focus().setImage({ src: pending.src, alt: pending.alt.trim() }).run();
    setPending(null);
  };

  const altMissing = p.missing.has('image');

  return (
    <article className={s.sheet}>
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => { void take(e.target.files?.[0], 'cover'); e.target.value = ''; }} />
      <input ref={textInput} type="file" accept="image/*" hidden onChange={(e) => { void take(e.target.files?.[0], 'text'); e.target.value = ''; }} />

      {p.image ? (
        <>
          <div className={s.cover}>
            <Picture src={p.image.src} />
            <div className={s.coverTools}>
              <button type="button" className={s.btn} onClick={() => coverInput.current?.click()}><Icon name="img" />Bytt bilde</button>
              <button type="button" className={s.btn} aria-label="Fjern bildet" title="Fjern bildet" onClick={() => p.onImage(null)}><Icon name="trash" /></button>
            </div>
            {busy === 'cover' && <div className={s.busy}>Klargjør bildet …</div>}
          </div>
          <div className={s.alt} data-missing={altMissing || undefined}>
            <label htmlFor="redaksjon-alt">Bildebeskrivelse</label>
            <input
              id="redaksjon-alt"
              value={p.image.alt}
              placeholder="Beskriv kort hva bildet viser. Teksten leses opp for blinde og svaksynte."
              onChange={(e) => p.onImage({ src: p.image!.src, alt: e.target.value })}
              aria-invalid={altMissing || undefined}
            />
          </div>
        </>
      ) : (
        <button type="button" className={s.addCover} onClick={() => coverInput.current?.click()} disabled={busy === 'cover'}>
          <Icon name="img" />
          {busy === 'cover' ? 'Klargjør bildet …' : 'Legg til bilde'}
          <small>Vises øverst i saken og på Aktuelt</small>
        </button>
      )}
      {problem && <p className={`${s.hint} ${s.danger}`} style={{ margin: '10px 56px 0' }} role="alert">{problem}</p>}

      <label className={s.srOnly} htmlFor="redaksjon-tittel">Overskrift</label>
      <textarea
        id="redaksjon-tittel" ref={titleRef} className={s.headline} rows={1} value={p.title} placeholder="Overskrift"
        onChange={(e) => p.onTitle(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); summaryRef.current?.focus(); } }}
      />
      <label className={s.srOnly} htmlFor="redaksjon-ingress">Ingress</label>
      <textarea
        id="redaksjon-ingress" ref={summaryRef} className={s.ingress} rows={2} value={p.summary}
        placeholder="Ingress: en eller to setninger om hva saken handler om"
        onChange={(e) => p.onSummary(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus('start'); } }}
      />

      {editor && <Toolbar editor={editor} onPicture={() => textInput.current?.click()} />}
      {busy === 'text' && <p className={s.inline}>Klargjør bildet …</p>}
      {pending && (
        <form className={s.inline} onSubmit={(e) => { e.preventDefault(); insert(); }}>
          <img src={pending.src} alt="" />
          <label htmlFor="redaksjon-bilde-alt">Bildebeskrivelse</label>
          <input id="redaksjon-bilde-alt" autoFocus value={pending.alt} placeholder="Hva viser bildet?" required
            onChange={(e) => setPending({ ...pending, alt: e.target.value })} />
          <button type="submit" className={`${s.btn} ${s.go}`} disabled={!pending.alt.trim()}>Sett inn</button>
          <button type="button" className={`${s.btn} ${s.quiet}`} onClick={() => setPending(null)}>Avbryt</button>
        </form>
      )}
      <div className={s.body}><EditorContent editor={editor} /></div>
    </article>
  );
}
