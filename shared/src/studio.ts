import type { Duration } from './types.ts'
import { powerAnswerWellFormed, powerGridStatus, portLabel, type PowerGridSpec } from './powerGrid.ts'
import { ADVANCED_LOGIC_STUDIO } from './logicAdvanced.ts'

export type Evidence = { title:string; text:string }
export type StudioTask = {
 id:string; title:string; kind:'choice'|'input'|'order'|'circuit'|'repair'|'rewrite'|'deduction'|'selection'|'route'|'power'; prompt:string;
 options?:string[]; solution:string|number|number[]|string[]; alternatives?:string[]; evidence:Evidence[];
 explanation:string[]; hints:string[]; rule?:string;
 evidenceLayout?:'all'; cards?:{title:string;lines:string[]}[]; power?:PowerGridSpec;
 fields?:{label:string;options?:string[]}[];
 route?:{labels:string[];edges:[number,number,number][];windows:{node:number;from:number;to:number;service:number}[];deadline:number};
 repairs?:{wrong:string;right:string;rule:string}[];
 circuit?:{nodes:{label:string;x:number;y:number;cost:number}[];edges:[number,number][];targets:number[];budget:number};
}
export type StudioConfig = { id:string; passion:'logique'|'francais'; duration:Duration; title:string; description:string; difficulty:'Accessible'|'Corsé'|'Expert'; art:number; tasks:StudioTask[]; revision?:number; lesson?:{rule:string;example:string} }
const task=(id:string,title:string,kind:StudioTask['kind'],prompt:string,solution:StudioTask['solution'],evidence:Evidence[],explanation:string[],options?:string[],rule?:string):StudioTask=>({id,title,kind,prompt,solution,evidence,explanation,options,rule,hints:[explanation[0]!,explanation.slice(0,2).join(' '),explanation.join(' ')]})
const ev=(title:string,text:string):Evidence=>({title,text})
const choice=(id:string,title:string,prompt:string,options:string[],solution:number,evidence:Evidence[],steps:string[])=>task(id,title,'choice',prompt,solution,evidence,steps,options)
const code=(id:string,title:string,prompt:string,solution:string,evidence:Evidence[],steps:string[])=>task(id,title,'input',prompt,solution,evidence,steps)
const order=(id:string,title:string,options:string[],solution:number[],evidence:Evidence[],steps:string[])=>task(id,title,'order','Replace les événements dans leur ordre chronologique. Tous les événements ont lieu à des moments distincts.',solution,evidence,steps,options)
const circuit=(id:string,title:string,budget=6):StudioTask=>({...task(id,title,'circuit','Alimente les trois terminaux depuis la source S. Chaque nœud activé consomme son coût ; tous les terminaux doivent être reliés à S par des nœuds actifs. Respecte le budget.',[0,1,2,4,5,8],[],['La source S est fixe. Cherche une branche qui dessert plusieurs terminaux.','Le nœud central E relie B au terminal C, puis au terminal F et au terminal I.','Active B, C, E, F et I : ils forment avec S un réseau continu de 6 unités. Les autres branches dépassent le budget.']),circuit:{nodes:['S','B','C','D','E','F','G','H','I'].map((label,i)=>({label,x:i%3,y:Math.floor(i/3),cost:i===0?1:[3,6,7].includes(i)?3:1})),edges:[[0,1],[0,3],[1,2],[1,4],[3,6],[4,5],[4,7],[5,8],[6,7],[7,8]],targets:[2,5,8],budget}})
const quick:StudioTask[][]=[
 [choice('witness','Le témoignage impossible','Une seule déclaration est incompatible avec les preuves. Laquelle ?', ['Ari : « J’ai rendu le badge à 20 h 12. »','Nora : « J’ai ouvert le local à 20 h 16. »','Sam : « J’ai utilisé le badge de Nora à 20 h 18. »'],2,[ev('Règlement','Un seul badge existe. Après sa remise à l’accueil, il ne peut être retiré qu’à partir de 20 h 30.'),ev('Registre','Ari remet le badge à 20 h 12. Nora le retire à 20 h 30. Nora possède aussi une clé personnelle, qui permet d’ouvrir le local sans badge.')],['Distingue le badge de la clé personnelle : ouvrir le local ne prouve pas qu’on détient le badge.','Entre 20 h 12 et 20 h 30, le badge reste à l’accueil.','Sam ne peut pas l’avoir utilisé à 20 h 18. La déclaration de Nora reste compatible avec sa clé.'])],
 [code('intercept','Le message intercepté','Quel lieu est caché ? Écris un seul mot.','GARE',[ev('Instruction','Lis la première lettre de chaque ligne, de haut en bas.'),ev('Message','Garde les yeux ouverts.\nAttends avant de partir.\nReste près des voyageurs.\nEntre sans bruit.')],['Les mots complets ne constituent pas le message.','Prends les initiales des quatre lignes, dans l’ordre.','G, A, R et E donnent GARE.'])],
 [choice('photo','La photo qui trahit','Quel récit est contredit par les documents ?', ['« La photo a été prise dans la salle A. »','« La photo a été prise après 19 h. »','« L’œuvre exposée est la version rouge. »'],1,[ev('Photo décrite','La photo montre l’œuvre rouge et une horloge synchronisée indiquant 18 h 42. Le panneau de la salle porte la lettre A.'),ev('Vérification','La date et l’heure de l’horloge ont été vérifiées. Aucune retouche n’a été faite.')],['Une preuve doit contredire directement la déclaration.','La salle et la couleur correspondent à la photo.','18 h 42 est avant 19 h : la deuxième déclaration est impossible.'])],
 [circuit('power','Rétablir le courant')],
 [choice('parcel','Le colis introuvable','Dans quel casier le colis a-t-il été déposé ?', ['Casier A','Casier B','Casier C','Casier D'],2,[ev('Étiquette','Le colis pèse 4 kg et doit être placé dans un casier réfrigéré.'),ev('Plan','A : réfrigéré, limite 2 kg. B : non réfrigéré, limite 8 kg. C : réfrigéré, limite 6 kg. D : réfrigéré, limite 3 kg.'),ev('Suivi','Le livreur confirme avoir respecté les deux contraintes.')],['Vérifie la température et le poids, pas une seule condition.','A et D sont trop petits. B n’est pas réfrigéré.','C est le seul casier réfrigéré qui accepte 4 kg.'])],
]
const medium:StudioTask[][]=[
 [choice('metro-route','Comparer les trajets','Quel trajet permet d’attraper un départ à 22 h 20 ?', ['Par la gare','Par le jardin','Par la place'],1,[ev('Messages','Nora quitte la galerie à 22 h 10. Elle doit être sur le quai avant la fermeture de l’accès.'),ev('Horaires','Gare : accès fermé à 22 h 17. Jardin : fermé à 22 h 19. Place : fermé à 22 h 18.'),ev('Plan','Galerie → gare : 8 min. Galerie → jardin : 7 min. Galerie → place : 9 min. Ces durées incluent l’accès au quai.')],['Additionne chaque trajet à 22 h 10.','Arrivées : gare 22 h 18, jardin 22 h 17, place 22 h 19.','Seul le jardin permet d’arriver avant la fermeture du quai.']),code('metro-code','Lire le ticket','Quel numéro de ligne relie le jardin au port ?','7',[ev('Réseau','Ligne 3 : gare → centre. Ligne 7 : jardin → port. Ligne 9 : place → musée.')],['Le trajet retenu passe par le jardin.','Cherche la destination port dans le réseau.','La ligne 7 relie le jardin au port.']),order('metro-order','Reconstituer le trajet',['Monter dans le métro','Quitter la galerie','Entrer sur le quai'],[1,2,0],[ev('Journal','Départ de la galerie : 22 h 10. Accès au quai : 22 h 17. Départ du métro : 22 h 20.')],['Utilise les trois horaires confirmés.','22 h 10 précède 22 h 17, puis 22 h 20.','Départ de la galerie → entrée sur le quai → montée dans le métro.'])],
 [choice('art-difference','Comparer les œuvres','Quel détail prouve que les photographies montrent deux œuvres différentes ?', ['La lumière','La signature','La position du cadre'],1,[ev('Photo à 14 h','Signature ML en bas à droite. Cadre doré. Éclairage naturel.'),ev('Photo à 16 h','Signature LM en bas à droite. Même cadre. Éclairage artificiel.'),ev('Inventaire','La signature ML est celle de l’original. Les variations d’éclairage et de cadrage ne changent pas une signature.')],['Cherche un détail propre à l’œuvre, qui ne dépend pas de la prise de vue.','Le cadre et la lumière peuvent changer sans échange.','La signature passe de ML à LM : l’œuvre a été remplacée.']),choice('art-window','Trouver le créneau','Quel passage a permis l’échange ?', ['Visite à 13 h','Maintenance à 15 h','Fermeture à 17 h'],1,[ev('Accès','13 h : visiteurs derrière une barrière. 15 h : cadre décroché pour maintenance. 17 h : local fermé.'),ev('Chronologie','Original confirmé à 14 h. Copie confirmée à 16 h. Seul un cadre décroché permet l’échange.')],['L’échange est entre les deux photographies.','Il faut un accès au cadre entre 14 h et 16 h.','La maintenance à 15 h satisfait les deux conditions.']),code('art-inventory','Retrouver l’original','Quel carton contient l’original ?','C2',[ev('Cartons','C1 : signature LM. C2 : signature ML. C3 : sans signature.'),ev('Bon de transport','Le carton portant la signature de l’original doit être isolé.')],['Réutilise la signature identifiée au départ.','L’original porte ML.','Le carton C2 contient l’œuvre signée ML.'])],
 [choice('phone-owner','Identifier le propriétaire','À qui appartient le téléphone ?', ['Léa','Nora','Sam'],0,[ev('Agenda','Mardi : répétition de violon. Mercredi : permanence à la médiathèque.'),ev('Contacts','Léa joue du violon et travaille à la médiathèque. Nora joue du piano et travaille à la galerie. Sam joue du violon et travaille à la galerie.')],['Croise les deux activités.','Le violon laisse Léa et Sam ; la médiathèque exclut Sam.','Léa est la seule personne qui correspond aux deux indices.']),choice('phone-meeting','Retrouver le rendez-vous','Où et quand aura lieu le rendez-vous final ?', ['Galerie à 17 h','Médiathèque à 18 h','Café à 18 h'],2,[ev('Conversation','10 h : rendez-vous galerie 17 h. 11 h : report à 18 h, même lieu. 12 h : la galerie est fermée, retrouvons-nous au café. 12 h 10 : d’accord, horaire inchangé.')],['Applique les modifications dans l’ordre des messages.','11 h change l’heure, 12 h change le lieu.','Le dernier accord fixe le café à 18 h.']),order('phone-order','Classer les messages',['Changement de lieu','Confirmation finale','Report de l’heure','Premier rendez-vous'],[3,2,0,1],[ev('Horodatages','Premier rendez-vous 10 h ; report 11 h ; changement de lieu 12 h ; confirmation 12 h 10.')],['Appuie-toi sur les horodatages.','10 h → 11 h → 12 h → 12 h 10.','Premier rendez-vous → report → changement de lieu → confirmation.'])],
 [code('lighthouse-code','Déchiffrer le signal','Quelle balise est indiquée ?','B2',[ev('Légende','Un flash court vaut un point. Un long vaut un tiret. B = −··· ; C = −·−· ; 2 = ··−−− ; 3 = ···−−.'),ev('Transmission','−··· / ··−−−')],['Les deux groupes codent deux caractères.','Le premier groupe correspond à B, le second à 2.','Le signal indique B2.']),choice('lighthouse-position','Lire la carte','À quelle position se trouve B2 ?', ['Nord-ouest','Centre','Sud-est'],1,[ev('Carte','Grille de 3 × 3 : colonnes A, B, C de gauche à droite ; lignes 1, 2, 3 de haut en bas.')],['Sépare la colonne et la ligne.','B est la deuxième colonne, 2 la deuxième ligne.','B2 est au centre de la carte.']),choice('lighthouse-route','Choisir la route','Quel trajet rejoint B2 en évitant les zones fermées ?', ['A1 → B1 → B2','A1 → A2 → B2','A1 → A2 → B1 → B2'],1,[ev('Navigation','Départ A1. Déplacements horizontaux ou verticaux d’une case. B1 est fermé. Toutes les autres cases sont ouvertes.')],['Un trajet doit respecter les fermetures et la proximité des cases.','Le premier passe par B1 ; le troisième comporte une diagonale A2 → B1.','A1 → A2 → B2 respecte toutes les règles.'])],
 [choice('workshop-gears','Comprendre les engrenages','Trois roues A, B, C se touchent en chaîne. Si A tourne à droite, dans quel sens tourne C ?', ['À gauche','À droite','Elle reste immobile'],1,[ev('Mécanisme','Deux roues en contact tournent dans des sens opposés. A touche B, B touche C. A ne touche pas C.')],['Applique la règle à chaque contact.','A à droite entraîne B à gauche.','B à gauche entraîne C à droite.']),code('workshop-lock','Ouvrir le compartiment','Trouve le code de trois chiffres.','426',[ev('Plaque','Le chiffre central vaut 2. Le premier est son double. Le dernier est la somme des deux premiers.')],['Commence par la valeur connue au centre.','Le premier vaut 2 × 2 = 4.','Le dernier vaut 4 + 2 = 6 : code 426.']),choice('workshop-tool','Choisir l’outil','Quel outil ouvre la fixation sans dépasser le couple autorisé ?', ['Clé A : 8 mm, 4 Nm','Clé B : 8 mm, 2 Nm','Clé C : 6 mm, 2 Nm'],1,[ev('Fixation','Tête de 8 mm. Couple maximal autorisé : 3 Nm.'),ev('Sécurité','Respecte simultanément la taille et le couple.')],['Il faut satisfaire les deux contraintes.','A dépasse le couple ; C n’a pas la bonne taille.','B offre 8 mm avec un couple de 2 Nm.'])],
]
export const LOGIC_STUDIO:StudioConfig[]=ADVANCED_LOGIC_STUDIO

export const STUDIO_FRENCH_RULES=[
 {id:'passe',title:'Imparfait ou passé composé ?',category:'Conjugaison',explanation:'L’imparfait présente notamment le cadre ou une habitude passée. Le passé composé présente un événement achevé. Le contexte guide le choix.',example:'Il pleuvait quand le téléphone a sonné.'},
 {id:'imperatif',title:'L’impératif au quotidien',category:'Conjugaison',explanation:'À l’impératif, le sujet n’est pas exprimé. Les verbes en -er n’ont généralement pas de s à la deuxième personne du singulier, sauf notamment devant en ou y : parle, parles-en.',example:'Écoute ce message. Prends ton carnet.'},
 {id:'son',title:'son ou sont ?',category:'Orthographe',explanation:'« son » est un déterminant possessif. « sont » est le verbe être et peut se remplacer par « étaient ».',example:'Son dossier est prêt. Les dossiers sont prêts.'},
 {id:'adjectif',title:'Accorder l’adjectif',category:'Grammaire et accords',explanation:'Un adjectif ou un participe employé comme adjectif s’accorde avec le nom qu’il qualifie.',example:'Les documents demandés sont prêts.'},
 {id:'votre',title:'votre ou vôtre ?',category:'Orthographe',explanation:'Le déterminant votre accompagne un nom sans accent. Le pronom le vôtre porte un accent circonflexe.',example:'Merci pour votre aide. Ce dossier est le vôtre.'},
 {id:'style',title:'Clarifier sans changer le sens',category:'Ponctuation et syntaxe',explanation:'Une réécriture peut avoir plusieurs solutions. Vérifie les faits, la cohérence et la ponctuation ; une préférence de style n’est pas une faute.',example:'J’étais en déplacement, donc je réponds aujourd’hui.'},
]
// Every item is authored with its own context and explanation; free rewriting is never graded as a unique answer.
type FrenchSeed=[rule:string,prompt:string,answer:string,wrong:string,explanation:string]
const frenchSeeds:FrenchSeed[]=[
 ['adjectif','Complète : Les documents … sont joints.','demandés','demandé','Demandés qualifie documents, masculin pluriel : on ajoute un s.'],
 ['votre','Complète : Merci pour … aide.','votre','vôtre','Devant le nom aide, le déterminant votre ne prend pas d’accent.'],
 ['present','Conjugue « envoyer » : Je … le dossier ce matin.','envoie','envoi','À la première personne du singulier, le verbe envoyer s’écrit « j’envoie ». « Envoi » est un nom.'],
 ['present','Conjugue « prendre » : Vous … la parole.','prenez','prennez','Au présent, prendre donne « vous prenez », avec un seul n.'],
 ['present','Conjugue « pouvoir » : Elles … participer.','peuvent','peuves','Pouvoir est irrégulier : elles peuvent.'],
 ['present','Conjugue « choisir » : Nous … une date.','choisissons','choisons','Choisir est un verbe du deuxième groupe : nous choisissons.'],
 ['present','Conjugue « faire » : Vous … une pause.','faites','faisez','Au présent, faire donne vous faites.'],
 ['present','Conjugue « appeler » : Tu … le responsable.','appelles','appeles','Avec tu au présent, appeler s’écrit appelles : deux l et un s final.'],
 ['conditionnel','Si j’avais plus de temps, je … ce dossier.','terminerais','terminerai','La condition est à l’imparfait : la conséquence est au conditionnel présent.'],
 ['conditionnel','Demain, je … le responsable.','contacterai','contacterais','Demain situe une action future annoncée : futur simple.'],
 ['conditionnel','Si nous avions les documents, nous … la demande.','enverrions','enverrons','Si + imparfait appelle ici le conditionnel présent : nous enverrions.'],
 ['conditionnel','Si tu viens demain, nous … ensemble.','travaillerons','travaillerions','Si + présent peut introduire une conséquence au futur : nous travaillerons.'],
 ['conditionnel','Si elle pouvait, elle … plus tôt.','partirait','partira','Pouvait est à l’imparfait : partirait exprime la conséquence hypothétique.'],
 ['conditionnel','Lundi prochain, vous … la confirmation.','recevrez','recevriez','La phrase annonce un événement à venir, sans hypothèse au passé : futur.'],
 ['a','Complète : Elle … confirmé le rendez-vous.','a','à','On peut dire elle avait confirmé : il s’agit du verbe avoir.'],
 ['a','Complète : Le rendez-vous est … dix heures.','à','a','À introduit l’heure. On ne peut pas le remplacer par avait.'],
 ['son','Complète : Les pièces jointes … complètes.','sont','son','On peut remplacer sont par étaient : verbe être.'],
 ['son','Complète : Elle retrouve … carnet.','son','sont','Son accompagne le nom carnet et exprime la possession.'],
 ['on','Complète : Ils … envoyé la réponse.','ont','on','Ils avaient envoyé est possible : verbe avoir.'],
 ['on','Complète : … commence à neuf heures.','On','Ont','On est le sujet du verbe commence.'],
 ['ces','Complète : Nora cherche … propres clés.','ses','ces','Propres indique qu’elles lui appartiennent : ses clés.'],
 ['ces','Complète : Regarde … affiches devant nous.','ces','ses','On désigne les affiches montrées : ces affiches.'],
 ['sujet','Complète : La liste des participants … prête.','est','sont','Le sujet est la liste, au singulier ; des participants est un complément.'],
 ['sujet','Complète : Les résultats de l’équipe … publiés.','sont','est','Le sujet est les résultats, au pluriel.'],
 ['etre','Complète : Nora et Léa sont … à l’heure.','arrivées','arrivé','Avec être, le participe s’accorde ici avec Nora et Léa : féminin pluriel.'],
 ['avoir','Complète : Les lettres que j’ai … sont sur le bureau.','écrites','écrit','Que reprend les lettres, COD placé avant avoir : féminin pluriel.'],
 ['avoir','Complète : J’ai … les lettres ce matin.','écrit','écrites','Le COD les lettres est après avoir : pas d’accord du participe.'],
 ['tout','Complète : … les propositions ont été lues.','Toutes','Tous','Propositions est féminin pluriel : toutes.'],
 ['ponctuation','Choisis la phrase correctement ponctuée.','Cette réponse, à mon avis, est claire.','Cette réponse, à mon avis est claire.','L’incise à mon avis doit être encadrée par deux virgules.'],
 ['ponctuation','Choisis la phrase correctement ponctuée.','Les documents demandés sont joints.','Les documents demandés, sont joints.','Une virgule ne sépare pas le sujet les documents demandés du verbe sont.'],
 ['ponctuation','Choisis la phrase correctement ponctuée.','Nora, peux-tu relire ce message ?','Nora peux-tu relire ce message.','L’apostrophe Nora est séparée par une virgule ; la question prend un point d’interrogation.'],
 ['ponctuation','Choisis la phrase correctement ponctuée.','J’apporte trois objets : un livre, un carnet et un stylo.','J’apporte trois objets un livre un carnet et un stylo.','Les deux-points annoncent l’énumération ; la virgule sépare ses premiers éléments.'],
 ['ponctuation','Choisis la phrase correctement ponctuée.','Le dossier est complet ; nous pouvons l’envoyer.','Le dossier ; est complet nous pouvons l’envoyer.','Le point-virgule sépare ici deux propositions complètes liées par le sens.'],
 ['ponctuation','Choisis la phrase correctement ponctuée.','La réunion est terminée. Nous partons.','La réunion est terminée nous partons.','Deux phrases indépendantes peuvent être séparées par un point.'],
 ['passe','Une habitude : Chaque été, nous … chez nos grands-parents.','allions','sommes allés','Chaque été présente ici une habitude passée : imparfait.'],
 ['passe','Un événement achevé : Hier à midi, elle … le document.','a signé','signait','Le contexte présente la signature comme un événement achevé : passé composé.'],
 ['passe','Le cadre : Il … quand le train est arrivé.','pleuvait','a plu','Pleuvait décrit la situation en cours au moment de l’arrivée.'],
 ['passe','Un événement : Soudain, le téléphone … .','a sonné','sonnait','Soudain introduit ici un événement ponctuel dans le récit : passé composé.'],
 ['passe','Une description : La salle … vide à notre arrivée.','était','a été','Était présente l’état de la salle au moment de l’arrivée.'],
 ['passe','Un événement achevé : Elle … la porte, puis elle est partie.','a fermé','fermait','La phrase présente deux événements successifs et achevés.'],
 ['imparfait','Conjugue « finir » à l’imparfait : Vous … .','finissiez','finissiais','Avec vous à l’imparfait, la terminaison est -iez.'],
 ['imparfait','Conjugue « marcher » à l’imparfait : Nous … .','marchions','marchaient','Avec nous à l’imparfait : -ions.'],
 ['imparfait','Conjugue « être » à l’imparfait : Elles … .','étaient','était','Avec elles à l’imparfait : étaient, au pluriel.'],
 ['imparfait','Conjugue « venir » à l’imparfait : Tu … .','venais','venait','Avec tu à l’imparfait : -ais.'],
 ['imperatif','À l’impératif, pour une personne : … ton carnet.','Prends','Prend','Prendre conserve un s à la deuxième personne de l’impératif : prends.'],
 ['imperatif','À l’impératif, pour une personne : … ce message.','Écoute','Écoutes','Un verbe en -er perd généralement le s avec tu à l’impératif, sans en ou y après.'],
 ['imperatif','À l’impératif, pour plusieurs personnes : … une date.','Choisissez','Choisisez','Choisir prend -issez avec vous : choisissez.'],
 ['imperatif','À l’impératif : …-en à Nora.','Parles','Parle','Le s est ajouté devant en : parles-en.'],
 ['imperatif','À l’impératif, pour nous : … ensemble.','Allons','Allont','L’impératif à la première personne du pluriel est allons.'],
 ['imperatif','À l’impératif, pour vous : … attentifs.','Soyez','Êtes','Être a un impératif irrégulier : sois, soyons, soyez.'],
 ['infinitif','Complète : Il faut … la réservation.','confirmer','confirmé','Après il faut, le verbe est à l’infinitif ; remplacer par vendre aide à vérifier.'],
 ['infinitif','Complète : Elle a … la réservation.','confirmé','confirmer','Avec a, on forme le passé composé : participe passé confirmé.'],
 ['sujet','Complète : Chacun des invités … une place.','a','ont','Chacun est singulier, malgré le complément des invités.'],
 ['sujet','Complète : Le groupe de visiteurs … demain.','arrive','arrivent','Le noyau du sujet est groupe : singulier.'],
 ['etre','Complète : Les documents sont … ce matin.','arrivés','arrivé','Documents est masculin pluriel ; avec être, arrivés s’accorde.'],
 ['avoir','Complète : Les photos qu’elle a … sont nettes.','prises','pris','Le COD photos est repris par que avant avoir : prises.'],
 ['avoir','Complète : Elle a … des photos.','pris','prises','Le COD des photos vient après le verbe : pris reste invariable.'],
 ['tout','Complète : Il a relu … le dossier.','tout','tous','Dossier est masculin singulier : tout.'],
]
const frenchBank:StudioTask[]=frenchSeeds.map(([rule,prompt,answer,wrong,explanation],i)=>{
 const input=i%3===0&&rule!=='ponctuation';return {...task(`fr-st-${i}`,input?'Conjuguer ou compléter':'Choisir la bonne forme',input?'input':'choice',prompt,input?answer:(i%2===0?0:1),[],[explanation,`Exemple correct : ${prompt.replace('…',answer)}`],input?undefined:(i%2===0?[answer,wrong]:[wrong,answer]),rule),hints:['Repère le sujet et le contexte de la phrase.','Relis la règle avant de choisir une forme.',explanation]}
})
const repair=(id:string,title:string,text:string,repairs:NonNullable<StudioTask['repairs']>):StudioTask=>({...task(id,title,'repair','Repère puis corrige les mots signalés dans ce texte. Chaque correction doit conserver le sens.','', [ev('Texte à corriger',text)],repairs.map(r=>`« ${r.wrong} » → « ${r.right} ».`)),repairs,rule:repairs[0]!.rule})
const repairs:StudioTask[]=[
 repair('fr-mail','Un message impeccable','Bonjour,\nJe vous envoi les documents demandé.\nVous trouverez les pièces jointes dans ce message.\nBonne journée.',[{wrong:'envoi',right:'envoie',rule:'present'},{wrong:'demandé',right:'demandés',rule:'adjectif'}]),
 repair('fr-past','Raconter au passé','Hier, nous avons visiter la galerie. Nora et Léa sont arrivé avant nous. Les œuvres que nous avons admiré étaient magnifiques.',[{wrong:'visiter',right:'visité',rule:'infinitif'},{wrong:'arrivé',right:'arrivées',rule:'etre'},{wrong:'admiré',right:'admirées',rule:'avoir'}]),
 repair('fr-agreement','Les accords en contexte','La liste des pièces sont complète. Marc et Sami sont parti. Les notes que j’ai pris sont utiles.',[{wrong:'sont complète',right:'est complète',rule:'sujet'},{wrong:'parti',right:'partis',rule:'etre'},{wrong:'pris',right:'prises',rule:'avoir'}]),
 repair('fr-project','Un projet à venir','Si nous avions les moyens, nous lancerons ce projet. Demain, je contacterais notre partenaire. Si tu es disponible, nous discuterions ensemble.',[{wrong:'lancerons',right:'lancerions',rule:'conditionnel'},{wrong:'contacterais',right:'contacterai',rule:'conditionnel'},{wrong:'discuterions',right:'discuterons',rule:'conditionnel'}]),
 repair('fr-instructions','Des consignes claires','Écoutes le message. Prend ton carnet. Vous pouvez noter les informations à garder.',[{wrong:'Écoutes',right:'Écoute',rule:'imperatif'},{wrong:'Prend',right:'Prends',rule:'imperatif'}]),
 repair('fr-notice','Un avis à corriger','Les horaires on changé. Nora a oublié ces propres clés. Le rendez-vous est a midi.',[{wrong:'on',right:'ont',rule:'on'},{wrong:'ces',right:'ses',rule:'ces'},{wrong:'a midi',right:'à midi',rule:'a'}]),
 repair('fr-story','Un récit à relire','Chaque jour, nous marchaient au bord du fleuve. Ce matin-là, nous avons décider de partir. Les rues étaient désertes.',[{wrong:'marchaient',right:'marchions',rule:'imparfait'},{wrong:'décider',right:'décidé',rule:'infinitif'}]),
 repair('fr-reply','Une réponse professionnelle','Bonjour,\nLes fichiers que vous avez envoyé sont bien reçus. Je vous répondrai dès que possible.\nMerci pour vôtre aide.',[{wrong:'envoyé',right:'envoyés',rule:'avoir'},{wrong:'vôtre',right:'votre',rule:'votre'}]),
 repair('fr-invitation','Une invitation','Les participants sont tous invité à la réunion. Chacun des participants ont reçu le lien. Pensez à confirmé votre présence.',[{wrong:'invité',right:'invités',rule:'etre'},{wrong:'ont',right:'a',rule:'sujet'},{wrong:'confirmé',right:'confirmer',rule:'infinitif'}]),
 repair('fr-review','Un bilan à corriger','Toute les propositions ont été étudiées. Nous avons retenu celle que vous avez présenté. Les résultats de l’équipe est encourageants.',[{wrong:'Toute',right:'Toutes',rule:'tout'},{wrong:'présenté',right:'présentée',rule:'avoir'},{wrong:'est',right:'sont',rule:'sujet'}]),
]
const rewrite=(i:number):StudioTask=>task(`fr-rewrite-${i}`,'Clarifier sans changer le sens','rewrite','Propose une reformulation. Plusieurs versions sont possibles : compare ensuite ton texte aux pistes, sans note automatique.','',[ev('Texte de départ',[
 'Il pleuvait. Nous avons attendu dix minutes. Le bus est arrivé. Nous sommes montés.',
 'J’ai reçu votre message hier. Je vous réponds maintenant parce que j’étais en déplacement.',
 'La réunion était prévue mardi. Elle aura finalement lieu jeudi, à la même heure. Le lieu reste inchangé.',
 'Merci de relire le document. Vous pouvez ensuite envoyer vos remarques avant vendredi.',
 'Nous avons reçu trois propositions. La deuxième respecte le budget et le délai. Nous la retenons.',
][i]!)],[ 'Vérifie que les personnes, les dates et les faits restent identiques.','Relie les phrases si cela rend le message plus clair ; ce n’est pas obligatoire.','Relis la ponctuation et les accords. Une autre formulation correcte reste valable.'],undefined,'style')
const frenchTitles=[['Présent sans hésiter','Futur ou conditionnel ?','Les mots qui se confondent','Trouver le bon accord','Ponctuer pour être compris'],['Raconter au passé','Les accords en contexte','Un message impeccable','Les pièges de conjugaison','Comprendre ses erreurs'],['Rédiger un récit','La chasse aux fautes','Un mail qui fait bonne impression','Le dossier conjugaison','L’atelier de réécriture']]
const ruleGroups=[['present'],['conditionnel'],['a','son','on','ces'],['sujet','etre','avoir','tout'],['ponctuation']]
const selected=(rules:string[],count:number,offset=0)=>{const bank=frenchBank.filter(t=>rules.includes(t.rule!));return [...bank.slice(offset),...bank.slice(0,offset)].slice(0,count)}
export function frenchStudioConfig(duration:Duration,variant:number):StudioConfig{
 const di=duration===5?0:duration===15?1:2
 let tasks:StudioTask[]
 if(duration===5)tasks=selected(ruleGroups[variant]!,6)
 else if(duration===15){const groups=[['passe','imparfait'],['sujet','etre','avoir','tout'],['a','son','on','ces','present','infinitif'],['conditionnel','imperatif','present'],['avoir','infinitif','a','sujet','conditionnel']];tasks=[...selected(groups[variant]!,10,2),repairs[[1,2,0,4,5][variant]!]!]}
 else {const groups=[['passe','imparfait','etre','avoir'],['a','on','ces','son','sujet','avoir','infinitif','tout'],['conditionnel','present','avoir','ponctuation'],['present','imparfait','passe','imperatif','conditionnel'],['ponctuation','sujet','conditionnel','infinitif']];tasks=[...selected(groups[variant]!,12,3),...([6,7,8,9,0].slice(variant).concat([6,7,8,9,0].slice(0,variant))).slice(0,2).map(i=>repairs[i]!),rewrite(variant)]}
 return {id:`francais-${duration}-${di*5+variant+1}`,passion:'francais',duration,title:frenchTitles[di]![variant]!,description:duration===5?'Une règle, des exemples et une correction.':duration===15?'Des exercices variés, puis un texte à corriger.':'Réviser, corriger et reformuler en contexte.',difficulty:'Accessible',art:variant,tasks}
}
export const STUDIO_LESSONS={
 logique:[
 {title:'Éliminer les impossibilités',rule:'Une hypothèse doit respecter toutes les contraintes. Un seul fait contradictoire suffit à l’écarter.',example:'Un casier réfrigéré trop petit ne peut pas accueillir le colis.',tasks:quick[4]!},
 {title:'Croiser les preuves',rule:'Deux informations indépendantes permettent de réduire les possibilités. Distingue fait confirmé et hypothèse.',example:'Le violon ne suffit pas à identifier Léa ; la médiathèque fournit le deuxième indice.',tasks:medium[2]!.slice(0,1)},
 {title:'Reconstituer une chronologie',rule:'Note les heures et les relations avant/après, puis cherche un ordre qui respecte toutes les informations.',example:'22 h 10 → 22 h 17 → 22 h 20.',tasks:medium[0]!.slice(2)},
 {title:'Décoder avec une clé',rule:'Identifie la méthode indiquée, puis applique la même règle à chaque symbole.',example:'Une première lettre par ligne peut former un message.',tasks:quick[1]!},
 {title:'Raisonner sur un réseau',rule:'Les connexions et le budget doivent être vérifiés ensemble. Réutiliser une branche peut économiser des ressources.',example:'Un nœud commun peut desservir plusieurs terminaux.',tasks:quick[3]!},
 ],
 francais:[
 {title:'Présent : les verbes courants',rule:'Repère le sujet, puis conjugue selon la personne. Les verbes irréguliers ont des formes à mémoriser.',example:'Je prends, vous prenez, ils prennent.',tasks:selected(['present'],4)},
 {title:'Futur ou conditionnel ?',rule:'Avec si + imparfait, la conséquence s’exprime ici au conditionnel. Le futur annonce une action à venir.',example:'Si j’avais le temps, je terminerais. Demain, je terminerai.',tasks:selected(['conditionnel'],4)},
 {title:'Imparfait ou passé composé ?',rule:'Le contexte distingue le cadre ou l’habitude de l’événement présenté comme achevé.',example:'Il pleuvait quand le téléphone a sonné.',tasks:selected(['passe'],4)},
 {title:'L’impératif au quotidien',rule:'Le sujet n’est pas exprimé. Les verbes en -er perdent généralement le s avec tu, sauf notamment devant en ou y.',example:'Parle doucement. Parles-en à Nora.',tasks:selected(['imperatif'],4)},
 {title:'Les participes passés',rule:'Avec être, on accorde ici avec le sujet. Avec avoir, on repère le COD et sa position.',example:'Elles sont arrivées. Les lettres que j’ai écrites.',tasks:selected(['etre','avoir'],5)},
 ],
}
export function studioConfig(id:string):StudioConfig|undefined{
 const match=/^(logique|francais)-(5|15|30)-(\d+)$/.exec(id)
 if(match){const passion=match[1] as 'logique'|'francais',d=Number(match[2]) as Duration,n=Number(match[3]),offset=d===5?0:d===15?5:10;if(n<=offset||n>offset+5)return undefined;return passion==='logique'?LOGIC_STUDIO.find(c=>c.id===id):frenchStudioConfig(d,n-offset-1)}
 const lesson=/^(logique|francais)-lesson-(\d+)$/.exec(id)
 if(!lesson)return undefined;const passion=lesson[1] as 'logique'|'francais',i=Number(lesson[2])-1,l=STUDIO_LESSONS[passion][i];if(!l)return undefined
 return {id,passion,duration:5,title:l.title,description:'Comprendre, essayer, pratiquer.',difficulty:'Accessible',art:passion==='logique'?i:0,tasks:l.tasks,lesson:{rule:l.rule,example:l.example}}
}
export function reviewStudioConfig(ruleIds:string[]):StudioConfig{
 const tasks=[...frenchBank.filter(t=>ruleIds.includes(t.rule!)).slice().reverse(),...(ruleIds.includes('style')?[rewrite(1)]:[])].slice(0,6)
 return {id:'francais-review',passion:'francais',duration:5,title:'Mes révisions',description:'De nouveaux exemples pour appliquer les règles.',difficulty:'Accessible',art:0,tasks}
}
export function normalizeFrench(value:string):string{return value.normalize('NFC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLocaleLowerCase('fr')}
export function studioCorrect(t:StudioTask,value:unknown):boolean|null{
 if(t.kind==='rewrite')return null
 if(t.kind==='power')return !!t.power&&powerGridStatus(t.power,value).valid
 if(t.kind==='circuit'){
  if(!Array.isArray(value)||!t.circuit)return false;const {nodes,edges,targets,budget}=t.circuit
  if(value.some(v=>!Number.isInteger(v)||v<0||v>=nodes.length)||new Set(value).size!==value.length||!value.includes(0)||value.reduce((s:number,i:number)=>s+nodes[i]!.cost,0)>budget)return false
  const seen=new Set([0]);let changed=true;while(changed){changed=false;for(const [a,b] of edges){if(value.includes(a)&&value.includes(b)){if(seen.has(a)&&!seen.has(b)){seen.add(b);changed=true}if(seen.has(b)&&!seen.has(a)){seen.add(a);changed=true}}}}
  return targets.every(i=>seen.has(i))&&value.every(i=>seen.has(i))
 }
 if(t.kind==='deduction')return Array.isArray(value)&&value.length===t.fields!.length&&(t.solution as string[]).every((s,i)=>typeof value[i]==='string'&&normalizeFrench(value[i])===normalizeFrench(s))
 if(t.kind==='selection')return Array.isArray(value)&&value.every(v=>Number.isInteger(v)&&v>=0&&v<t.options!.length)&&new Set(value).size===value.length&&JSON.stringify([...value].sort((a,b)=>a-b))===JSON.stringify([...(t.solution as number[])].sort((a,b)=>a-b))
 if(t.kind==='route')return routeResult(t,value).valid
 if(t.kind==='repair')return Array.isArray(value)&&value.length===t.repairs!.length&&t.repairs!.every((r,i)=>typeof value[i]==='string'&&normalizeFrench(value[i])===normalizeFrench(r.right))
 if(t.kind==='choice')return value===t.solution
 if(t.kind==='order')return Array.isArray(value)&&JSON.stringify(value)===JSON.stringify(t.solution)
 return typeof value==='string'&&[String(t.solution),...(t.alternatives??[])].some(a=>normalizeFrench(a)===normalizeFrench(value))
}
export function studioAnswerLabel(t:StudioTask,value:unknown):string{
 if(value===undefined||value===null)return 'Sans réponse'
 if(t.kind==='power')return Array.isArray(value)?t.power!.nodes.flatMap((n,i)=>Number.isInteger(value[i])&&value[i]>=0&&value[i]<n.ports.length?[`${n.label} : ${portLabel(n.ports[value[i]]!)}`]:[]).join('\n'):'Sans réponse'
 if(t.kind==='choice')return t.options?.[Number(value)]??'Sans réponse'
 if(t.kind==='deduction')return Array.isArray(value)?t.fields!.map((f,i)=>`${f.label} : ${value[i]||'Sans réponse'}`).join('\n'):'Sans réponse'
 if(t.kind==='route')return Array.isArray(value)?value.map(i=>t.route!.labels[Number(i)]??'?').join(' → '):'Sans réponse'
 if(t.kind==='selection')return Array.isArray(value)?value.map(i=>t.options?.[Number(i)]??'?').join(' · '):'Sans réponse'
 if(t.kind==='order')return Array.isArray(value)?value.map(i=>t.options?.[Number(i)]??'?').join(' → '):'Sans réponse'
 if(t.kind==='circuit')return Array.isArray(value)?value.map(i=>t.circuit?.nodes[Number(i)]?.label??'?').join(', '):'Sans réponse'
 if(t.kind==='repair')return Array.isArray(value)?value.join(' · '):'Sans réponse'
 return String(value)
}
export type StudioSavedStep={task:StudioTask;response:string|number|number[]|string[]|null;correct:boolean|null}
export type StudioValidated={version:2;contentRevision?:number;passion:'logique'|'francais';answers:Record<string,unknown>;summary:string;reviewRules:string[];studio:{title:string;steps:StudioSavedStep[];notebook?:string}}
export function validateStudio(id:string,input:unknown):StudioValidated{
 const c=studioConfig(id),d=input as {version?:number;passion?:string;answers?:Record<string,unknown>;savedRules?:unknown;contentRevision?:number;notebook?:unknown}|undefined
 if(!c||!d||d.version!==2||d.passion!==c.passion||!d.answers||typeof d.answers!=='object'||Array.isArray(d.answers))throw new Error('Atelier invalide.')
 if(c.revision&&d.contentRevision!==c.revision)throw new Error('Cette énigme a été renouvelée. Ferme puis rouvre l’application pour charger sa nouvelle version.')
 if(d.notebook!==undefined&&(typeof d.notebook!=='string'||d.notebook.length>6000))throw new Error('Carnet illisible.')
 const rules=new Set<string>(),answers:Record<string,unknown>={}
 const steps=c.tasks.map(t=>{let v=d.answers![t.id]
  if(v===undefined||v===null){if(c.passion==='francais')throw new Error('Termine tous les exercices avant d’enregistrer.');v=null}
  else if(t.kind==='power'){if(!powerAnswerWellFormed(t.power!,v))throw new Error('Réseau illisible.')}
  else if(t.kind==='choice'){if(!Number.isInteger(v)||Number(v)<0||Number(v)>=t.options!.length)throw new Error('Choix illisible.')}
  else if(t.kind==='route'){const max=t.route!.labels.length;if(!Array.isArray(v)||v.length>max+1||v.some(n=>!Number.isInteger(n)||n<0||n>=max))throw new Error('Parcours illisible.')}
  else if(t.kind==='deduction'){if(!Array.isArray(v)||v.length!==t.fields!.length||v.some((s,i)=>typeof s!=='string'||s.length>120||(s!==''&&t.fields![i]!.options?.length&&!t.fields![i]!.options!.includes(s))))throw new Error('Tableau illisible.')}
  else if(t.kind==='order'||t.kind==='circuit'||t.kind==='selection'){const max=t.kind==='circuit'?t.circuit!.nodes.length:t.options!.length;if(!Array.isArray(v)||v.length>max||v.some(n=>!Number.isInteger(n)||n<0||n>=max)||new Set(v).size!==v.length)throw new Error('Répartition illisible.');if(c.passion==='francais'&&v.length!==max)throw new Error('Termine la chronologie.')}
  else if(t.kind==='repair'){if(!Array.isArray(v)||v.length!==t.repairs!.length||v.some(s=>typeof s!=='string'||!s.trim()||s.length>120))throw new Error('Termine les corrections du texte.')}
  else if(typeof v!=='string'||v.length>(t.kind==='rewrite'?6000:200)||(c.passion==='francais'&&!v.trim())||(t.kind==='rewrite'&&v.trim().length<15))throw new Error('Réponse illisible ou trop courte.')
  const correct=studioCorrect(t,v);if(c.passion==='francais'&&correct===false)studioReviewRules(t,v).forEach(r=>rules.add(r))
  answers[t.id]=v;return {task:t,response:v as StudioSavedStep['response'],correct}
 })
 const allowed=new Set([...frenchSeeds.map(s=>s[0]),...STUDIO_FRENCH_RULES.map(r=>r.id)])
 if(Array.isArray(d.savedRules))d.savedRules.filter((r):r is string=>typeof r==='string'&&allowed.has(r)).forEach(r=>rules.add(r))
 const scored=steps.filter(s=>s.correct!==null),correct=scored.filter(s=>s.correct).length
 return {version:2,contentRevision:c.revision,passion:c.passion,answers,summary:c.passion==='logique'?`${c.title} · ${correct}/${scored.length} étapes résolues`:`${c.title} · ${correct}/${scored.length} exercices justes${steps.some(s=>s.task.kind==='rewrite')?' · texte enregistré':''}`,reviewRules:[...rules],studio:{title:c.title,steps,...(typeof d.notebook==='string'&&d.notebook.trim()?{notebook:d.notebook}: {})}}
}

export function studioReviewRules(t:StudioTask,value:unknown):string[]{
 if(t.repairs)return [...new Set(t.repairs.filter((r,i)=>!Array.isArray(value)||normalizeFrench(String(value[i]??''))!==normalizeFrench(r.right)).map(r=>r.rule))]
 return studioCorrect(t,value)===false&&t.rule?[t.rule]:[]
}

// Validate the route against its actual constraints, not only against a stored order.
export function routeResult(t:StudioTask,value:unknown):{valid:boolean;elapsed:number;visits:{node:number;start:number}[]}{
 const r=t.route,visits:{node:number;start:number}[]=[];let elapsed=0
 if(!r||!Array.isArray(value)||value.length<2||value.length>r.labels.length+1||value[0]!==0||value.at(-1)!==0||value.some(n=>!Number.isInteger(n)||n<0||n>=r.labels.length))return {valid:false,elapsed,visits}
 const middle=value.slice(1,-1);if(middle.includes(0)||new Set(middle).size!==middle.length)return {valid:false,elapsed,visits}
 for(let i=1;i<value.length;i++){const a=value[i-1],b=value[i];const edge=r.edges.find(([x,y])=>(x===a&&y===b)||(x===b&&y===a));if(!edge)return {valid:false,elapsed,visits};elapsed+=edge[2];const window=r.windows.find(w=>w.node===b);if(window){elapsed=Math.max(elapsed,window.from);visits.push({node:b,start:elapsed});if(elapsed>window.to)return {valid:false,elapsed,visits};elapsed+=window.service}}
 return {valid:elapsed<=r.deadline&&r.windows.every(w=>visits.some(v=>v.node===w.node)),elapsed,visits}
}
