import type { Activity, Duration, PassionId } from './types.ts'

export const WORKSHOP_IDS = ['rythme', 'logique', 'francais'] as const
export type WorkshopId = typeof WORKSHOP_IDS[number]
export const isWorkshop = (id: PassionId): id is WorkshopId => WORKSHOP_IDS.includes(id as WorkshopId)
export const TRACKS = ['Grosse caisse', 'Caisse claire', 'Charleston', 'Percussion'] as const
export const BEAT_PALETTES = ['hip-hop', 'électro', 'acoustique', 'lo-fi'] as const
export type Beat = { name: string; tempo: number; palette: typeof BEAT_PALETTES[number]; patterns: boolean[][][] }
export const emptyPattern = (): boolean[][] => TRACKS.map(() => Array<boolean>(16).fill(false))
export function referencePattern(): boolean[][] {
  const p = emptyPattern(); [0, 4, 8, 12].forEach(i => p[0]![i] = true); [4, 12].forEach(i => p[1]![i] = true); [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => p[2]![i] = true); return p
}
export const BEAT_TASKS = [
  {title:'Reproduire une boucle', instruction:'Écoute le modèle puis reproduis exactement ses trois pistes.', mode:'copy'},
  {title:'Compléter un beat', instruction:'Garde la grosse caisse sur 1, 2, 3, 4 et place la caisse claire sur 2 et 4. Ajoute le charleston à ta façon.', mode:'complete'},
  {title:'Deux instruments seulement', instruction:'Compose avec exactement deux pistes actives et au moins quatre pas au total.', mode:'two'},
  {title:'Créer une variation', instruction:'Pars du modèle et change au moins deux pas, en gardant au moins deux pistes actives.', mode:'vary'},
  {title:'Composition libre', instruction:'Crée une boucle avec au moins deux instruments et quatre pas. Le style t’appartient.', mode:'free'},
] as const

export type FrenchRule = { id: string; title: string; category: string; explanation: string; example: string }
export const FRENCH_RULES: FrenchRule[] = [
 {id:'conditionnel', title:'Futur ou conditionnel ?', category:'Conjugaison', explanation:'Avec « si » + imparfait, la conséquence s’exprime au conditionnel présent. Le futur présente un événement à venir.', example:'Si j’avais le temps, je terminerais. Demain, je terminerai.'},
 {id:'infinitif', title:'-er ou -é ?', category:'Orthographe', explanation:'Remplace le verbe par « vendre » ou « vendu » : vendre indique l’infinitif (-er), vendu le participe passé (-é).', example:'Je vais parler → vendre. J’ai parlé → vendu.'},
 {id:'a', title:'a ou à ?', category:'Orthographe', explanation:'« a » est le verbe avoir : tu peux le remplacer par « avait ». « à » est une préposition.', example:'Il a (avait) rendez-vous à midi.'},
 {id:'sujet', title:'Accorder le verbe', category:'Grammaire et accords', explanation:'Le verbe s’accorde avec son sujet, même si un complément s’intercale entre les deux.', example:'Le groupe de visiteurs arrive. Les visiteurs du groupe arrivent.'},
 {id:'etre', title:'Le participe avec être', category:'Grammaire et accords', explanation:'Dans ces phrases, le participe passé employé avec être s’accorde en genre et en nombre avec le sujet.', example:'Elles sont arrivées. Ils sont arrivés.'},
 {id:'avoir', title:'Le participe avec avoir', category:'Grammaire et accords', explanation:'Avec avoir, le participe s’accorde avec le complément direct si celui-ci est placé avant le verbe. S’il est après, il reste invariable.', example:'J’ai écrit les lettres. Les lettres que j’ai écrites.'},
 {id:'ces', title:'ces ou ses ?', category:'Orthographe', explanation:'« ses » indique la possession (les siens). « ces » désigne ce que l’on montre (ceux-ci).', example:'Il prend ses clés. Regarde ces montagnes !'},
 {id:'present', title:'Le présent sans hésiter', category:'Conjugaison', explanation:'Les terminaisons changent selon la personne et le groupe. Pour prendre : je prends, tu prends, il prend, nous prenons.', example:'Tu prends le train. Nous prenons le train.'},
 {id:'imparfait', title:'Les terminaisons de l’imparfait', category:'Conjugaison', explanation:'À l’imparfait : -ais, -ais, -ait, -ions, -iez, -aient. Le radical vient en général de « nous » au présent.', example:'Nous finissons → je finissais, vous finissiez.'},
 {id:'ponctuation', title:'Ponctuer sans couper le sujet', category:'Ponctuation et syntaxe', explanation:'On ne sépare pas le sujet de son verbe par une virgule. Une incise entre eux doit être délimitée par deux virgules.', example:'Ce dossier est prêt. Ce dossier, à mon avis, est prêt.'},
 {id:'on', title:'on ou ont ?', category:'Orthographe', explanation:'« ont » est avoir et se remplace par « avaient ». « on » est un pronom sujet.', example:'On arrive. Ils ont (avaient) le temps.'},
 {id:'tout', title:'tout, tous, toute, toutes', category:'Grammaire et accords', explanation:'Devant un nom, « tout » s’accorde en genre et en nombre avec ce nom.', example:'Tous les jours, toute la semaine, toutes les idées.'},
]
export type FrenchQuestion = {id:string; rule:string; prompt:string; options:[string,string]; answer:0|1}
const RAW_FRENCH: [string,string,string,string,0|1][] = [
 ['conditionnel','Si j’avais le temps, je … ce dossier.','terminerai','terminerais',1],
 ['conditionnel','Demain, je … ce dossier.','terminerai','terminerais',0],
 ['conditionnel','Si nous avions le choix, nous … demain.','partirons','partirions',1],
 ['conditionnel','Si tu viens, nous … ensemble.','mangerons','mangerions',0],
 ['infinitif','Je vais … mon message.','envoyer','envoyé',0],
 ['infinitif','Elle a … son dossier.','terminer','terminé',1],
 ['infinitif','Il faut … avant vendredi.','réserver','réservé',0],
 ['infinitif','Nous avons … le film.','regarder','regardé',1],
 ['a','Elle … un rendez-vous.','a','à',0], ['a','Je pars … Lyon.','a','à',1], ['a','Il … oublié ses clés.','a','à',0], ['a','Ce livre est … toi.','a','à',1],
 ['sujet','Le groupe de visiteurs … demain.','arrive','arrivent',0], ['sujet','Les pages de ce livre … jaunies.','est','sont',1], ['sujet','Chacun des participants … une place.','a','ont',0], ['sujet','La liste des courses … prête.','est','sont',0],
 ['etre','Nora et Léa sont … tôt.','arrivé','arrivées',1], ['etre','Les garçons sont … hier.','parti','partis',1], ['etre','Elle est … en avance.','venu','venue',1], ['etre','Les lettres sont … ce matin.','arrivées','arrivés',0],
 ['avoir','Les lettres que j’ai … sont courtes.','écrit','écrites',1], ['avoir','J’ai … des lettres.','écrit','écrites',0], ['avoir','Les films qu’elle a … sont récents.','vu','vus',1], ['avoir','Elle a … ces films.','vu','vus',0],
 ['ces','Léa range … propres affaires.','ces','ses',1], ['ces','Regarde … montagnes devant nous !','ces','ses',0], ['ces','Il cherche … clés à lui.','ces','ses',1], ['ces','Prends … deux livres que je te montre.','ces','ses',0],
 ['present','Tu … le train.','prends','prend',0], ['present','Nous … la réponse.','savons','savez',0], ['present','Vous … le temps.','avez','avons',0], ['present','Elle … un livre.','lit','lis',0],
 ['imparfait','Vous … votre travail.','finissiez','finissiais',0], ['imparfait','Nous … tous les jours.','marchions','marchaient',0], ['imparfait','Elles … ensemble.','était','étaient',1], ['imparfait','Tu … souvent ici.','venais','venait',0],
 ['ponctuation','Choisis la phrase correctement ponctuée.','Ce dossier, est prêt.','Ce dossier est prêt.',1], ['ponctuation','Choisis la phrase correctement ponctuée.','Cette réponse, à mon avis, est juste.','Cette réponse, à mon avis est juste.',0], ['ponctuation','Choisis la phrase correctement ponctuée.','Les amis de Nora, arrivent.','Les amis de Nora arrivent.',1], ['ponctuation','Choisis la phrase correctement ponctuée.','Son projet, semble intéressant.','Son projet semble intéressant.',1],
 ['on','Ils … déjà répondu.','on','ont',1], ['on','… commence demain.','On','Ont',0], ['on','Elles … le choix.','on','ont',1], ['on','… prend le temps de lire.','On','Ont',0],
 ['tout','… les idées sont intéressantes.','Tous','Toutes',1], ['tout','Je travaille … la semaine.','tout','toute',1], ['tout','… les jours, je lis.','Tous','Toutes',0], ['tout','Il a lu … le livre.','tout','tous',0],
]
export const FRENCH_QUESTIONS: FrenchQuestion[] = RAW_FRENCH.map(([rule,prompt,a,b,answer],i)=>({id:`fr-q-${i+1}`,rule,prompt,options:[a,b],answer}))
export const TEXT_CORRECTIONS: FrenchQuestion[] = [
 {id:'text-1',rule:'conditionnel',prompt:'Corrige cet extrait : « Si j’avais plus de temps, je terminerai cette lettre. »',options:['Si j’avais plus de temps, je terminerais cette lettre.','Si j’aurais plus de temps, je terminerais cette lettre.'],answer:0},
 {id:'text-2',rule:'avoir',prompt:'Corrige cet extrait : « Les notes que j’ai pris sont utiles. »',options:['Les notes que j’ai prises sont utiles.','Les notes que j’ai prise sont utiles.'],answer:0},
 {id:'text-3',rule:'sujet',prompt:'Corrige cet extrait : « La liste des exercices sont sur le bureau. »',options:['La liste des exercices sont sur les bureaux.','La liste des exercices est sur le bureau.'],answer:1},
]

export type Assignment = { rooms:number[]; times:number[] }
export type LogicClue = { text:string; accepts:(s:Assignment)=>boolean }
export type LogicCase = {id:string; title:string; family:string; kind:'grid'; people:string[]; rooms:string[]; times:string[]; clues:LogicClue[]; solution:Assignment; hints:string[]}
export type CodeCase = {id:string; title:string; family:string; kind:'code'; prompt:string; answer:string; hints:string[]; explanation:string}
export type Puzzle = LogicCase | CodeCase
export function permutations(values:number[]):number[][] { return values.length===0?[[]]:values.flatMap((v,i)=>permutations(values.filter((_,j)=>i!==j)).map(p=>[v,...p])) }
const PERMS=permutations([0,1,2,3])
export function solveCase(clues:LogicClue[]):Assignment[] { return PERMS.flatMap(rooms=>PERMS.map(times=>({rooms,times}))).filter(s=>clues.every(c=>c.accepts(s))) }
function dossier(seed:number, family:string):LogicCase {
 const people=['Ari','Nora','Sam','Léa'], rooms=['Bureau','Atelier','Archives','Salon'], times=['18 h 00','18 h 10','18 h 20','18 h 30']
 const solution={rooms:PERMS[(seed*7+3)%24]!,times:PERMS[(seed*11+8)%24]!}
 const ri=(room:number,s:Assignment)=>s.rooms.indexOf(room)
 const candidates:LogicClue[]=[]
 for(let a=0;a<4;a++) for(let b=a+1;b<4;b++) {
  if(solution.times[a]!<solution.times[b]!) candidates.push({text:`${people[a]} est arrivé avant ${people[b]}.`,accepts:s=>s.times[a]!<s.times[b]!})
  else candidates.push({text:`${people[b]} est arrivé avant ${people[a]}.`,accepts:s=>s.times[b]!<s.times[a]!})
 }
 for(let a=0;a<4;a++) for(let b=0;b<4;b++) if(solution.rooms[a]!==b) candidates.push({text:`${people[a]} n’est pas entré dans la salle « ${rooms[b]} ».`,accepts:s=>s.rooms[a]!==b})
 for(let r=0;r<4;r++) for(let p=0;p<4;p++) if(solution.rooms[p]!==r) {
  const gap=solution.times[ri(r,solution)]!-solution.times[p]!
  candidates.push({text:`L’accès à la salle « ${rooms[r]} » a eu lieu ${Math.abs(gap)*10} minutes ${gap>0?'après':'avant'} l’arrivée de ${people[p]}.`,accepts:s=>(s.times[ri(r,s)]! - s.times[p]!) === gap})
 }
 // Prefer relational clues. Add only clues that shrink the solution set, then remove redundant clues.
 const rotated=[...candidates.slice(18),...candidates.slice(0,18)].sort((a,b)=>((a.text.length*17+seed)%31)-((b.text.length*17+seed)%31))
 let clues:LogicClue[]=[],count=576
 for(const clue of rotated){const n=solveCase([...clues,clue]).length;if(n<count){clues.push(clue);count=n}if(n===1)break}
 for(let i=clues.length-1;i>=0;i--)if(solveCase(clues.filter((_,j)=>i!==j)).length===1)clues.splice(i,1)
 if(solveCase(clues).length!==1) throw new Error('Dossier ambigu')
 return {id:`case-${seed}`,title:['L’accès de trop','Les quatre rendez-vous','Le document déplacé','Dernière ouverture','Le registre incomplet','Les salles échangées'][seed%6]!,family,kind:'grid',people,rooms,times,clues,solution,hints:['Transforme les délais en positions dans la chronologie. Il n’y a qu’un accès par personne, salle et horaire.','Croise chaque relation d’heure avec les exclusions de salles. Une valeur confirmée exclut toute sa ligne et sa colonne.',people.map((p,i)=>`${p} → ${rooms[solution.rooms[i]!]} → ${times[solution.times[i]!]}`).join('\n')]}
}
function cipher(word:string,shift:number,i:number):CodeCase {
 const encoded=word.replace(/[A-Z]/g,c=>String.fromCharCode(65+(c.charCodeAt(0)-65+shift)%26))
 return {id:`cipher-${i}`,title:'Le message décalé',family:'Cryptographie',kind:'code',prompt:`Le chiffrement décale chaque lettre du même nombre de places dans l’alphabet (après Z, on revient à A). Le mot CLE devient ${'CLE'.replace(/[A-Z]/g,c=>String.fromCharCode(65+(c.charCodeAt(0)-65+shift)%26))}. Déchiffre : ${encoded}.`,answer:word,hints:['Compare les positions de C et de sa lettre chiffrée.','Le décalage vaut '+shift+'. Pour lire le message, soustrais ce décalage à chaque lettre.',`Le message est ${word}.`],explanation:`Chaque lettre a été avancée de ${shift} places ; il faut revenir de ${shift} places pour retrouver ${word}.`}
}
const LOCK_CASES:CodeCase[] = [
 {
  "id": "lock-0",
  "title": "Le coffre à contraintes",
  "family": "Contraintes",
  "kind": "code",
  "prompt": "Trouve le code de quatre chiffres distincts, choisis entre 1 et 7. Les deux comptes de chaque essai sont exclusifs : un chiffre bien placé n’est pas compté dans les mal placés.\n\n1374 : 2 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).\n1237 : 1 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).",
  "answer": "1473",
  "hints": [
   "Commence par les essais qui excluent le plus de chiffres. Un chiffre absent ne peut apparaître nulle part.",
   "Croise les ensembles de chiffres possibles, puis teste leurs positions. Respecte simultanément tous les essais.",
   "Le code est 1473."
  ],
  "explanation": "Avec 1473, chaque essai donne exactement les deux comptes annoncés. Parmi les 840 codes autorisés, c’est le seul qui satisfait tous les essais."
 },
 {
  "id": "lock-1",
  "title": "Le coffre à contraintes",
  "family": "Contraintes",
  "kind": "code",
  "prompt": "Trouve le code de quatre chiffres distincts, choisis entre 1 et 7. Les deux comptes de chaque essai sont exclusifs : un chiffre bien placé n’est pas compté dans les mal placés.\n\n2465 : 2 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).\n1256 : 2 chiffre(s) bien placé(s), 1 chiffre(s) présent(s) mais mal placé(s).",
  "answer": "2456",
  "hints": [
   "Commence par les essais qui excluent le plus de chiffres. Un chiffre absent ne peut apparaître nulle part.",
   "Croise les ensembles de chiffres possibles, puis teste leurs positions. Respecte simultanément tous les essais.",
   "Le code est 2456."
  ],
  "explanation": "Avec 2456, chaque essai donne exactement les deux comptes annoncés. Parmi les 840 codes autorisés, c’est le seul qui satisfait tous les essais."
 },
 {
  "id": "lock-2",
  "title": "Le coffre à contraintes",
  "family": "Contraintes",
  "kind": "code",
  "prompt": "Trouve le code de quatre chiffres distincts, choisis entre 1 et 7. Les deux comptes de chaque essai sont exclusifs : un chiffre bien placé n’est pas compté dans les mal placés.\n\n1437 : 2 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).\n1234 : 0 chiffre(s) bien placé(s), 3 chiffre(s) présent(s) mais mal placé(s).",
  "answer": "3417",
  "hints": [
   "Commence par les essais qui excluent le plus de chiffres. Un chiffre absent ne peut apparaître nulle part.",
   "Croise les ensembles de chiffres possibles, puis teste leurs positions. Respecte simultanément tous les essais.",
   "Le code est 3417."
  ],
  "explanation": "Avec 3417, chaque essai donne exactement les deux comptes annoncés. Parmi les 840 codes autorisés, c’est le seul qui satisfait tous les essais."
 },
 {
  "id": "lock-3",
  "title": "Le coffre à contraintes",
  "family": "Contraintes",
  "kind": "code",
  "prompt": "Trouve le code de quatre chiffres distincts, choisis entre 1 et 7. Les deux comptes de chaque essai sont exclusifs : un chiffre bien placé n’est pas compté dans les mal placés.\n\n1274 : 2 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).\n1324 : 0 chiffre(s) bien placé(s), 3 chiffre(s) présent(s) mais mal placé(s).",
  "answer": "4271",
  "hints": [
   "Commence par les essais qui excluent le plus de chiffres. Un chiffre absent ne peut apparaître nulle part.",
   "Croise les ensembles de chiffres possibles, puis teste leurs positions. Respecte simultanément tous les essais.",
   "Le code est 4271."
  ],
  "explanation": "Avec 4271, chaque essai donne exactement les deux comptes annoncés. Parmi les 840 codes autorisés, c’est le seul qui satisfait tous les essais."
 },
 {
  "id": "lock-4",
  "title": "Le coffre à contraintes",
  "family": "Contraintes",
  "kind": "code",
  "prompt": "Trouve le code de quatre chiffres distincts, choisis entre 1 et 7. Les deux comptes de chaque essai sont exclusifs : un chiffre bien placé n’est pas compté dans les mal placés.\n\n2543 : 2 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).\n1234 : 1 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).",
  "answer": "5243",
  "hints": [
   "Commence par les essais qui excluent le plus de chiffres. Un chiffre absent ne peut apparaître nulle part.",
   "Croise les ensembles de chiffres possibles, puis teste leurs positions. Respecte simultanément tous les essais.",
   "Le code est 5243."
  ],
  "explanation": "Avec 5243, chaque essai donne exactement les deux comptes annoncés. Parmi les 840 codes autorisés, c’est le seul qui satisfait tous les essais."
 },
 {
  "id": "lock-5",
  "title": "Le coffre à contraintes",
  "family": "Contraintes",
  "kind": "code",
  "prompt": "Trouve le code de quatre chiffres distincts, choisis entre 1 et 7. Les deux comptes de chaque essai sont exclusifs : un chiffre bien placé n’est pas compté dans les mal placés.\n\n1265 : 2 chiffre(s) bien placé(s), 2 chiffre(s) présent(s) mais mal placé(s).\n1362 : 0 chiffre(s) bien placé(s), 3 chiffre(s) présent(s) mais mal placé(s).",
  "answer": "6215",
  "hints": [
   "Commence par les essais qui excluent le plus de chiffres. Un chiffre absent ne peut apparaître nulle part.",
   "Croise les ensembles de chiffres possibles, puis teste leurs positions. Respecte simultanément tous les essais.",
   "Le code est 6215."
  ],
  "explanation": "Avec 6215, chaque essai donne exactement les deux comptes annoncés. Parmi les 840 codes autorisés, c’est le seul qui satisfait tous les essais."
 }
]
export const LOGIC_CASES:Puzzle[]=[...Array.from({length:6},(_,i)=>dossier(i,'Déduction')),...['ARCHIVES','RENDEZVOUS','DOCUMENT','BUREAU','INDICES','TEMOIN'].map((w,i)=>cipher(w,3+i*2,i)),...LOCK_CASES,...Array.from({length:6},(_,i)=>dossier(i+6,'Enquêtes'))]

export const WORKSHOP_LESSONS:Record<WorkshopId,{title:string;rule:string;example:string}[]> = {
 rythme:[{title:'Placer quatre temps',rule:'Une mesure à quatre temps se divise ici en 16 pas : quatre pas pour chaque temps.',example:'Place une grosse caisse aux pas 1, 5, 9 et 13.'},{title:'Construire le contretemps',rule:'La caisse claire sur les temps 2 et 4 donne un repère régulier.',example:'Grosse caisse : 1, 5, 9, 13. Caisse claire : 5 et 13.'},{title:'Faire vivre une boucle',rule:'Une variation conserve les repères tout en changeant quelques accents.',example:'Change deux pas du modèle puis écoute les deux versions.'}],
 logique:[{title:'Éliminer les impossibilités',rule:'Chaque personne a une seule salle et un seul horaire. Une exclusion réduit les choix ; une confirmation élimine sa ligne et sa colonne.',example:'« Sam n’est pas aux Archives » : marque cette case d’une croix.'},{title:'Croiser les indices',rule:'Deux indices peuvent contraindre une même valeur. Compare les délais aux horaires disponibles.',example:'Un accès 20 minutes avant 18 h 30 doit être à 18 h 10.'},{title:'Vérifier une hypothèse',rule:'Une solution doit satisfaire tous les indices. Un seul indice contredit suffit à éliminer une hypothèse.',example:'Relis chaque témoignage et vérifie les affectations une à une.'}],
 francais:[{title:'Futur ou conditionnel ?',rule:FRENCH_RULES[0]!.explanation,example:FRENCH_RULES[0]!.example},{title:'Accorder avec le sujet',rule:FRENCH_RULES[3]!.explanation,example:FRENCH_RULES[3]!.example},{title:'Le participe passé',rule:FRENCH_RULES[5]!.explanation,example:FRENCH_RULES[5]!.example}],
}
export const WORKSHOP_ACTIVITIES:Activity[]=WORKSHOP_IDS.flatMap(passion=>[
 ...([5,15,30] as Duration[]).flatMap((duration,di)=>Array.from({length:5},(_,i)=>({id:`${passion}-${duration}-${di*5+i+1}`,passion,duration,number:di*5+i+1,text:passion==='rythme'?BEAT_TASKS[i]!.title+(duration===15?' · deux variations':duration===30?' · intro, thème et final':''):passion==='logique'?['Déduction : croiser les indices','Cryptographie : lire entre les lettres','Contraintes : ouvrir le coffre','Enquêtes : reconstituer les accès','Dossier surprise'][i]!:['Conjugaison : reprendre les bases','Orthographe : lever les doutes','Grammaire : trouver les accords','Ponctuation : clarifier la phrase','Révision mixte'][i]!}))),
 ...WORKSHOP_LESSONS[passion].map((lesson,i)=>({id:`${passion}-lesson-${i+1}`,passion,duration:5 as Duration,number:16+i,text:lesson.title})),
])
export function workshopConfig(activityId:string) {
 const a=WORKSHOP_ACTIVITIES.find(a=>a.id===activityId);if(!a)return undefined
 const lesson=activityId.includes('-lesson-')?a.number-16:undefined
 const variant=lesson??((a.number-1)%5)
 const base=lesson!==undefined?lesson:variant===0?0:variant===1?6:variant===2?12:variant===3?18:3
 const count=a.duration===30?3:a.duration===15?2:1
 const cases=Array.from({length:count},(_,i)=>LOGIC_CASES[(base+(variant===4?i*6:i)+(a.duration===15?2:a.duration===30?3:0))%LOGIC_CASES.length]!)
 const categories=['Conjugaison','Orthographe','Grammaire et accords','Ponctuation et syntaxe']
 const rule=lesson===0?'conditionnel':lesson===1?'sujet':'avoir'
 const bank=FRENCH_QUESTIONS.filter(q=>lesson!==undefined?q.rule===rule:variant===4||FRENCH_RULES.find(r=>r.id===q.rule)?.category===categories[variant])
 const questions=lesson!==undefined?bank:bank.slice(0,a.duration===5?6:a.duration===15?12:18)
 return {activity:a,lesson,variant,cases,questions:a.duration===30?[...questions,...TEXT_CORRECTIONS]:questions,task:BEAT_TASKS[lesson===0?0:lesson===1?1:lesson===2?3:variant]!}
}
export type WorkshopSubmission = {version:1; passion:WorkshopId; beat?:Beat; answers?:Record<string,unknown>; savedRules?:string[]}
export type WorkshopResult = WorkshopSubmission & {summary:string; reviewRules?:string[]; logicResults?:{id:string;correct:boolean}[]}
export function normalizeCode(value:unknown):string {return typeof value==='string'?value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s/g,'').toUpperCase():''}
export function puzzleCorrect(p:Puzzle,value:unknown):boolean {
 if(p.kind==='code')return normalizeCode(value)===p.answer
 const s=value as Assignment|undefined
 return !!s&&Array.isArray(s.rooms)&&Array.isArray(s.times)&&s.rooms.length===4&&s.times.length===4&&s.rooms.every((v,i)=>v===p.solution.rooms[i])&&s.times.every((v,i)=>v===p.solution.times[i])
}
export function validateWorkshop(activityId:string,input:unknown):WorkshopResult {
 const config=workshopConfig(activityId);const data=input as WorkshopSubmission|undefined
 if(!config||!data||data.version!==1||data.passion!==config.activity.passion)throw new Error('Atelier invalide.')
 if(data.passion==='rythme') {
  const b=data.beat
  const expected=config.activity.duration===30?3:config.activity.duration===15?2:1
  if(!b||typeof b.name!=='string'||!b.name.trim()||b.name.length>80||!Number.isInteger(b.tempo)||b.tempo<50||b.tempo>180||!BEAT_PALETTES.includes(b.palette)||!Array.isArray(b.patterns)||b.patterns.length!==expected)throw new Error('Nomme ton beat et vérifie ses paramètres.')
  for(const [section,pattern] of b.patterns.entries()){
   if(!Array.isArray(pattern)||pattern.length!==4||pattern.some(row=>!Array.isArray(row)||row.length!==16||row.some(v=>typeof v!=='boolean')))throw new Error('Séquence illisible.')
   const active=pattern.filter(row=>row.some(Boolean)).length,hits=pattern.flat().filter(Boolean).length
   const ref=referencePattern(),mode=section>0&&config.task.mode==='copy'?'free':config.task.mode
   if(mode==='copy'&&config.lesson!==0&&JSON.stringify(pattern)!==JSON.stringify(ref))throw new Error('La boucle ne correspond pas encore au modèle.')
   if(config.lesson===0&&(pattern[0]!.some((v,i)=>v!==[0,4,8,12].includes(i))||pattern.slice(1).some(row=>row.some(Boolean))))throw new Error('Place seulement quatre grosses caisses : 1, 5, 9, 13.')
   if(mode==='complete'&&(pattern[0]!.some((v,i)=>v!==[0,4,8,12].includes(i))||pattern[1]!.some((v,i)=>v!==[4,12].includes(i))))throw new Error('Vérifie la grosse caisse et la caisse claire.')
   if(mode==='two'&&(active!==2||hits<4))throw new Error('Il faut exactement deux pistes et au moins quatre pas.')
   if(mode==='vary'&&(active<2||pattern.flat().filter((v,i)=>v!==ref.flat()[i]).length<2))throw new Error('Change au moins deux pas du modèle, avec deux pistes actives.')
   if(mode==='free'&&(active<2||hits<4))throw new Error('Ajoute au moins deux instruments et quatre pas.')
  }
  if(expected>1&&new Set(b.patterns.map(p=>JSON.stringify(p))).size!==expected)throw new Error('Chaque section doit proposer une variation différente.')
  return {version:1,passion:'rythme',beat:{...b,name:b.name.trim()},summary:`${b.name.trim()} · ${b.tempo} BPM · ${b.palette}`}
 }
 if(!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers))throw new Error('Réponses manquantes.')
 if(data.passion==='logique'){
  const answers=Object.fromEntries(config.cases.map(p=>{
   const value=data.answers![p.id]
   if(value===undefined||value===null)return [p.id,null]
   if(p.kind==='code') {
    if(typeof value!=='string'||value.length>80)throw new Error('Réponse illisible.')
    return [p.id,value.trim()]
   }
   const assignment=value as Assignment
   if(!assignment||!Array.isArray(assignment.rooms)||!Array.isArray(assignment.times)||assignment.rooms.length!==4||assignment.times.length!==4||[...assignment.rooms,...assignment.times].some(v=>!Number.isInteger(v)||v < -1||v > 3))throw new Error('Répartition illisible.')
   return [p.id,{rooms:assignment.rooms,times:assignment.times}]
  }))
  const logicResults=config.cases.map(p=>({id:p.id,correct:puzzleCorrect(p,answers[p.id])}))
  const correct=logicResults.filter(r=>r.correct).length,count=config.cases.length
  return {version:1,passion:'logique',answers,logicResults,summary:correct===count?`${count} dossier${count>1?'s':''} résolu${count>1?'s':''}`:`${count} dossier${count>1?'s':''} étudié${count>1?'s':''} · ${correct}/${count} résolu${correct>1?'s':''}`}
 }
 if(config.questions.some(q=>data.answers![q.id]!==0&&data.answers![q.id]!==1))throw new Error('Termine tous les exercices avant d’enregistrer.')
 const answers=Object.fromEntries(config.questions.map(q=>[q.id,data.answers![q.id]]))
 const correct=config.questions.filter(q=>answers[q.id]===q.answer).length
 return {version:1,passion:'francais',answers,summary:`${correct}/${config.questions.length} réponses justes`,reviewRules:[...new Set([...config.questions.filter(q=>answers[q.id]!==q.answer).map(q=>q.rule),...(Array.isArray(data.savedRules)?data.savedRules.filter(id=>FRENCH_RULES.some(r=>r.id===id)):[])])]}
}
