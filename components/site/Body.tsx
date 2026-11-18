import Markdoc, { type Config } from '@markdoc/markdoc';
import React from 'react';
import { BodyImage } from './BodyImage';
import styles from './body.module.css';

const config: Config = {
  nodes: {
    image: {
      render: 'BodyImage',
      attributes: { src: { type: String, required: true }, alt: { type: String }, title: { type: String } },
    },
  },
};

/**
 * A post's full text: Markdoc, as Keystatic writes it, rendered to React on the server.
 * Markdoc has no raw HTML — a tag in the text is printed as text. Its document renders as an
 * <article>; the page is the article, so only what is inside it is drawn. `root` is where a
 * picture's file is read from: the site's `public/`, unless a test says otherwise.
 */
export function Body({ source, root }: { source: string; root?: string }) {
  const tree = Markdoc.transform(Markdoc.parse(source), config);
  const inside = Markdoc.Tag.isTag(tree) ? tree.children : [tree];
  const components = { BodyImage: (props: { src: string; alt?: string }) => <BodyImage {...props} root={root} /> };
  return <div className={styles.body}>{Markdoc.renderers.react(inside, React, { components })}</div>;
}
