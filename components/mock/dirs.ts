/** The directions for the hero and the film, shared by the route (server) and the strip (client). */
export type Dir = '1' | '2' | '3';

export const DIRS: readonly { key: Dir; name: string; note: string }[] = [
  {
    key: '1',
    name: '1 Flommen',
    note: 'Filmen har hele båndet. Mens den går, tegner pennen navnets omriss på den i hvitt, bokstav for bokstav, og de to røde kommer på til slutt. Når filmen har gått én gang, flommer det hvite ut fra bokstavenes kanter over hele båndet til siden er hvit og filmen står igjen inne i bokstavene; overskriften og knappene stiger opp under. Filmen flytter seg aldri – bare det hvite gjør det.',
  },
  {
    key: '2',
    name: '2 Gjennom',
    note: 'Landingen er navnet på hvitt med filmen inne i bokstavene og teksten under, som nå. Rullingen åpner vinduet: platen zoomer om Q-en til filmen har hele skjermen, og overskriften og knappene kommer opp i hvitt på filmen. Rull tilbake, og navnet lukker seg om den igjen. Ingen klokke – leseren styrer det. Havet følger rett under.',
  },
  {
    key: '3',
    name: '3 Speilet',
    note: 'Filmen over den øvre delen av skjermen, en vannlinje, og under den filmens levende speilbilde som kruser og faller ned i sidens marineblå. Navnet står hvitt på vannlinjen med sitt eget speilbilde i vannet; overskriften og knappene står på vannet under. Havet overtar vannet rett etter.',
  },
];

export const ROUNDS: readonly (readonly Dir[])[] = [['1', '2', '3']];

export function isDir(s: string): s is Dir {
  return DIRS.some((d) => d.key === s);
}
