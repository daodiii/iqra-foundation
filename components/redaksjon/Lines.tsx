'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import s from './editor.module.css';

/** Grows a text area with its text where `field-sizing` is not supported. */
function grow(el: HTMLTextAreaElement | null) {
  if (!el || CSS.supports('field-sizing', 'content')) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

type Props = {
  id: string;
  /** The field's name, read out to screen readers. */
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** The look: the headline, the ingress under it, or running text. */
  look: 'headline' | 'ingress' | 'text';
  /** Where Enter goes. Without it, Enter does nothing: the site shows these as one paragraph. */
  onEnter?: () => void;
  invalid?: boolean;
};

/**
 * A line of the sheet that grows with its text: the headline, the ingress, an event's
 * description, a person's bio. The site prints each as a single paragraph, so a line break typed
 * here would vanish there; it is taken out as it is typed (pasted text included).
 */
export const Line = forwardRef<HTMLTextAreaElement | null, Props>(function Line(p, ref) {
  const el = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle<HTMLTextAreaElement | null, HTMLTextAreaElement | null>(ref, () => el.current);
  useEffect(() => { grow(el.current); }, [p.value]);
  const cls = p.look === 'headline' ? s.headline : p.look === 'ingress' ? s.ingress : s.plain;
  return (
    <>
      <label className={s.srOnly} htmlFor={p.id}>{p.label}</label>
      <textarea
        id={p.id} ref={el} className={cls} rows={p.look === 'text' ? 4 : p.look === 'ingress' ? 2 : 1}
        value={p.value} placeholder={p.placeholder} aria-invalid={p.invalid || undefined}
        onChange={(e) => p.onChange(e.target.value.replace(/\s*\n+\s*/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); p.onEnter?.(); } }}
      />
    </>
  );
});
