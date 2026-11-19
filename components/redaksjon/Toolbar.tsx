'use client';

import { useEditorState, type Editor } from '@tiptap/react';
import { useState } from 'react';
import { Icon, type IconName } from './Icon';
import s from './editor.module.css';

/**
 * The text's tools: headings, bold, italic | link, list, quote, picture | undo, redo. The link
 * asks for its address in a line under the toolbar, not in a pop-up.
 */
export function Toolbar({ editor, onPicture }: { editor: Editor; onPicture: () => void }) {
  const st = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      link: e.isActive('link'),
      list: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      undo: e.can().undo(),
      redo: e.can().redo(),
    }),
  });
  const [linking, setLinking] = useState<string | null>(null);

  const c = () => editor.chain().focus();
  const b = (icon: IconName, label: string, pressed: boolean | undefined, run: () => void, disabled = false) => (
    <button type="button" aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={run}>
      <Icon name={icon} />
    </button>
  );

  const openLink = () => setLinking((editor.getAttributes('link').href as string | undefined) ?? 'https://');
  const applyLink = () => {
    const href = (linking ?? '').trim();
    if (!href || href === 'https://') c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: /^(https?:|mailto:|\/)/.test(href) ? href : `https://${href}` }).run();
    setLinking(null);
  };

  return (
    <>
      <div className={s.tools} role="toolbar" aria-label="Tekstverktøy">
        {b('h', 'Mellomoverskrift', st.h2, () => c().toggleHeading({ level: 2 }).run())}
        {b('h3', 'Liten overskrift', st.h3, () => c().toggleHeading({ level: 3 }).run())}
        {b('bold', 'Fet', st.bold, () => c().toggleBold().run())}
        {b('italic', 'Kursiv', st.italic, () => c().toggleItalic().run())}
        <i className={s.sep} aria-hidden="true" />
        {b('link', 'Lenke', st.link, openLink)}
        {b('list', 'Punktliste', st.list, () => c().toggleBulletList().run())}
        {b('quote', 'Sitat', st.quote, () => c().toggleBlockquote().run())}
        {b('img', 'Bilde', undefined, onPicture)}
        <i className={s.sep} aria-hidden="true" />
        {b('undo', 'Angre', undefined, () => c().undo().run(), !st.undo)}
        {b('redo', 'Gjør om', undefined, () => c().redo().run(), !st.redo)}
      </div>
      {linking !== null && (
        <form className={s.inline} onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
          <label htmlFor="redaksjon-lenke">Adresse</label>
          <input id="redaksjon-lenke" type="url" inputMode="url" value={linking} autoFocus onChange={(e) => setLinking(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setLinking(null); editor.commands.focus(); } }} />
          <button type="submit" className={`${s.btn} ${s.go}`}>Sett inn lenke</button>
          {st.link && <button type="button" className={s.btn} onClick={() => { c().extendMarkRange('link').unsetLink().run(); setLinking(null); }}>Fjern lenken</button>}
          <button type="button" className={`${s.btn} ${s.quiet}`} onClick={() => { setLinking(null); editor.commands.focus(); }}>Avbryt</button>
        </form>
      )}
    </>
  );
}
