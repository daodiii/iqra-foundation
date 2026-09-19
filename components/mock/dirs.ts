/** The directions for the hero and the film, shared by the route (server) and the strip (client). */
export type Dir = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

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
  {
    key: '4',
    name: '4 Fortekst',
    note: 'Filmen har hele skjermen, og klippene er takten: det første bildet bærer navnet i hvitt, og hvert av de fire neste tar med seg sitt områdes ord på en plate i områdets farge, inn fra venstre som floen i havet – Kunnskap på marineblått med den lærde, Dialog på turkis med ringen, Møteplasser på lyst med halaqaen, Samfunnsdeltakelse på rødt med håndtrykket. Når filmen har gått én gang, legger den seg inn i bokstavene med teksten under.',
  },
  {
    key: '5',
    name: '5 Hjørnet',
    note: 'Navnet med filmen inni står i heroen som nå. Rulles det, blir merket ikke igjen: det flyr opp i hodet og blir logoen, med filmen fortsatt gående inne i de små bokstavene, resten av siden ned. Rull tilbake, og det vokser ned i heroen igjen. Teksten under står som før.',
  },
  {
    key: '6',
    name: '6 Kornene',
    note: 'Filmen har hele båndet. Når den har gått én gang, går den i tjue tusen korn av seg selv – hvert korn bærer filmens farge der det er – som strømmer over båndet og samler seg i de fire bokstavene mens siden blir hvit bak dem. Kornene smelter sammen, og filmen står inne i navnet med teksten under.',
  },
  {
    key: '7',
    name: '7 Mosaikken',
    note: 'Heroen er en vegg av islamsk geometri i marineblått, og filmen står inne i navnet. Idet du kommer, er veggen lukket; så vipper flisene opp i en bølge ut fra navnet og viser filmen i bokstavene – og teksten, som nå går i bredden under: overskriften til venstre, avsnittet og knappene til høyre – setter seg når bølgen når den. Veggen blir stående som stedet.',
  },
  {
    key: '8',
    name: '8 Havbunnen',
    note: 'Heroen er havet. Navnet med filmen inni ligger på bunnen, og du ser det gjennom den levende overflaten: floen kommer inn med det marineblå over det idet du kommer, en stein faller, og pekerens kjølvann går gjennom bokstavene. Teksten står hvit på vannet, i bredden; knappene slipper en stein der de står.',
  },
  {
    key: '9',
    name: '9 Lyset',
    note: 'Et mørkt rom. Bokstavene er et vindu i bakveggen; filmen slås på inne i dem, bokstav for bokstav som en projektor som varmes opp, og lyset fra den faller gjennom navnet ned på gulvet. Rommet kjører inn; pekeren flytter filmen bak vinduet; lyset sveiper over overskriften og lar den stå tent. Teksten i bredden nederst, i lyset.',
  },
  {
    key: '10',
    name: '10 Glassmaleriet',
    note: 'Fra 9, på hvitt: bokstavene er glassmaleri i en hvit vegg. De tennes én etter én ut av det hvite, og filmens farger faller gjennom dem ned på det hvite gulvet som farget lys – og solen flytter seg: idet du kommer ligger lyset langt og lavt, og det reiser seg mens solen stiger; etterpå er pekeren solen. Teksten i bredden, lyset sveiper over overskriften.',
  },
  {
    key: '11',
    name: '11 Linsen',
    note: 'Fra 9, på hvitt: bokstavene er tykt glass. Filmen inni bøyes mot kantene, deler seg svakt i farger i randen, og et høylys går over glasset idet du kommer, og følger pekeren etterpå. Lyset gjennom glasset faller på gulvet under. Materialet er det som stopper deg. Teksten i bredden.',
  },
  {
    key: '12',
    name: '12 Papirkuttet',
    note: 'Fra 9, på hvitt: navnet skjæres ut av det hvite av en usynlig kniv, bokstav for bokstav, og bitene faller bort og lar vinduene stå igjen med filmen i – og lyset fra den på papiret under. Teksten trykkes av et hode som går over i bredden.',
  },
];

export const ROUNDS: readonly (readonly Dir[])[] = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['10', '11', '12']];

export function isDir(s: string): s is Dir {
  return DIRS.some((d) => d.key === s);
}
