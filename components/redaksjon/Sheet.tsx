'use client';

import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import { useRef, useState } from 'react';
import { EXTENSIONS, fromMarkdown, toMarkdown } from '@/lib/redaksjon/markdown';
import type { Pic } from '@/lib/redaksjon/schema';
import { Cover } from './Cover';
import { Line } from './Lines';
import { Toolbar } from './Toolbar';
import s from './editor.module.css';

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

  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [pending, setPending] = useState<{ src: string; alt: string } | null>(null);

  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setProblem('');
    try {
      setPending({ src: await p.addPicture(file), alt: '' });
    } catch (e) {
      setProblem((e as Error).message || 'Kunne ikke bruke bildet.');
    } finally {
      setBusy(false);
    }
  };

  const insert = () => {
    if (!editor || !pending || !pending.alt.trim()) return;
    editor.chain().focus().setImage({ src: pending.src, alt: pending.alt.trim() }).run();
    setPending(null);
  };

  return (
    <article className={s.sheet}>
      <input ref={textInput} type="file" accept="image/*" hidden onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
      <Cover image={p.image} onImage={p.onImage} addPicture={p.addPicture} missing={p.missing.has('image')} hint="Vises øverst i saken og på Aktuelt" />

      <Line id="redaksjon-tittel" label="Overskrift" look="headline" value={p.title} onChange={p.onTitle} placeholder="Overskrift" onEnter={() => summaryRef.current?.focus()} />
      <Line
        id="redaksjon-ingress" ref={summaryRef} label="Ingress" look="ingress" value={p.summary} onChange={p.onSummary}
        placeholder="Ingress: en eller to setninger om hva saken handler om" onEnter={() => editor?.commands.focus('start')}
      />

      {editor && <Toolbar editor={editor} onPicture={() => textInput.current?.click()} />}
      {busy && <p className={s.inline}>Klargjør bildet …</p>}
      {problem && <p className={`${s.hint} ${s.danger} ${s.coverProblem}`} role="alert">{problem}</p>}
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
