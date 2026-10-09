/**
 * Soft hyphens (U+00AD) at the joints of the long compounds the site's text uses, so a narrow
 * column breaks «Samfunns-deltakelse» where a Norwegian reader expects it and nowhere else —
 * `hyphens: manual` on the body means the browser breaks only here, and only when the word does
 * not fit. The text a reader copies or a screen reader reads is unchanged: a soft hyphen is
 * invisible unless the line breaks at it.
 *
 * The joints are written out, not guessed: a dictionary of the compounds in content/brief.no.ts and
 * content/site.no.ts long enough to need one (13 letters and up). Running text only: a title and a
 * link keep their words whole, so the name a screen reader is given is the word as written.
 */
const JOINTS: Record<string, string> = {
  samfunnsdeltakelse: 'samfunns|deltakelse',
  skjæringspunktet: 'skjærings|punktet',
  meningsutveksling: 'menings|utveksling',
  kunnskapsformidling: 'kunnskaps|formidling',
  kunnskapsdeling: 'kunnskaps|deling',
  kunnskapsbasert: 'kunnskaps|basert',
  samfunnssamtale: 'samfunns|samtale',
  samfunnsaktører: 'samfunns|aktører',
  styringsdokumenter: 'styrings|dokumenter',
  organisasjonsnummer: 'organisasjons|nummer',
  allmennyttig: 'allmenn|yttig',
  inkluderende: 'inklu|derende',
  arrangementer: 'arrange|menter',
  ambisjonen: 'ambi|sjonen',
};

const WORDS = new RegExp(`(${Object.keys(JOINTS).join('|')})`, 'gi');

/** The text with a soft hyphen at each known compound's joint, the case of every letter kept. */
export function soft(text: string): string {
  return text.replace(WORDS, (word) => {
    const at = JOINTS[word.toLowerCase()].indexOf('|');
    return `${word.slice(0, at)}­${word.slice(at)}`;
  });
}
