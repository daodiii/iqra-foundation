import Markdoc, { type Config } from '@markdoc/markdoc';
import React from 'react';
import { anchorHeadings } from '@/lib/outline';
import { BodyImage } from './BodyImage';
import styles from './body.module.css';

const config: Config = {
  nodes: {
    image: {
      render: 'BodyImage',
      attributes: { src: { type: String, required: true }, alt: { type: String }, title: { type: String } },
    },
    /* A heading carries the anchor `anchorHeadings` gave it, so the article's contents can link to it. */
    heading: {
      children: ['inline'],
      attributes: { level: { type: Number, required: true }, anchor: { type: String } },
      transform(node, cfg) {
        const level = node.attributes.level as number;
        return new Markdoc.Tag(`h${level}`, node.attributes.anchor ? { id: node.attributes.anchor } : {}, node.transformChildren(cfg));
      },
    },
  },
};

/**
 * A post's full text: Markdoc, as Keystatic writes it, rendered to React on the server.
 * Markdoc has no raw HTML — a tag in the text is printed as text. Its document renders as an
 * <article>; the page is the article, so only what is inside it is drawn. `root` is where a
 * picture's file is read from: the site's `public/`, unless a test says otherwise.
 */
export function Body({ source, root, className }: { source: string; root?: string; className?: string }) {
  const ast = Markdoc.parse(source);
  anchorHeadings(ast);
  const tree = Markdoc.transform(ast, config);
  const inside = Markdoc.Tag.isTag(tree) ? tree.children : [tree];
  const components = { BodyImage: (props: { src: string; alt?: string }) => <BodyImage {...props} root={root} /> };
  return <div className={className ? `${styles.body} ${className}` : styles.body}>{Markdoc.renderers.react(inside, React, { components })}</div>;
}
