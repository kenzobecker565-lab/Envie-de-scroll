import type { Activity } from './types.ts'
import { keyboardMelody } from './guides.ts'
import { studioConfig } from './studio.ts'
import { sportProgram } from './sport.ts'

export interface ActivityBrief {
 title: string
 outcome: string
 materials: string
 /** Indicative pacing, never a completion requirement. Sport uses its real timed program. */
 steps: readonly { title: string; text: string; minutes?: number }[]
}
type CreativeBrief = readonly [title:string, outcome:string, prepare:string, practice:string, finish:string]
const DRAWING: readonly CreativeBrief[] = [
 ['Un objet, quelques traits','Un croquis d’un objet de ton bureau.','Pose devant toi un objet simple : tasse, clé ou lampe.','Trace sa silhouette, puis ajoute deux ou trois détails qui le rendent reconnaissable.','Ajoute une ombre ou une couleur, puis garde ton croquis tel qu’il est.'],
 ['Ton animal en formes simples','Un animal construit avec des ronds et des triangles.','Choisis un animal et repère la forme de sa tête et de son corps.','Assemble les grandes formes, puis place les oreilles, les pattes et la queue.','Ajoute un détail qui lui donne du caractère.'],
 ['Trois objets, trois croquis','Une petite collection de trois dessins rapides.','Choisis trois petits objets et réserve trois espaces sur ta feuille.','Consacre une minute à chaque objet. Cherche sa silhouette plutôt que tous ses détails.','Regarde les trois croquis et entoure celui que tu préfères.'],
 ['Une idée en image','Une petite scène sur le thème de ton choix.','Choisis un thème simple : une fenêtre, un café ou une promenade.','Dessine un élément principal et deux indices qui situent la scène.','Ajoute un titre pour garder une trace de ton idée.'],
 ['Une page de motifs','Une page rythmée par des motifs répétés.','Choisis deux formes : vagues, feuilles, points ou spirales.','Répète-les en faisant varier leur taille et leur espacement.','Remplis un dernier espace ou laisse volontairement du blanc.'],
 ['Un sujet, un autre style','Une étude dans un style que tu pratiques peu.','Choisis un sujet simple et un style : cartoon, manga ou réaliste.','Dessine le même sujet en accentuant un trait du style choisi : proportions, contours ou ombres.','Repère une chose que tu aimerais réutiliser dans un prochain dessin.'],
 ['Le personnage inattendu','Un personnage inspiré des trois mots tirés.','Au démarrage, lis les trois mots proposés et trouve un lien entre eux.','Construis une silhouette et fais apparaître chaque mot dans un détail du personnage.','Donne-lui un nom ou une courte légende.'],
 ['L’ombre d’un objet','Une étude avec une zone claire et une zone sombre.','Place un objet près d’une source de lumière et observe son ombre.','Dessine ses grandes formes. Pose ensuite les valeurs les plus sombres, sans tout remplir.','Compare les zones claires et sombres et ajuste un contraste.'],
 ['Ton univers, ta version','Une interprétation personnelle d’un personnage ou d’un univers.','Choisis un personnage et deux signes qui permettent de le reconnaître.','Dessine-le avec tes propres proportions, vêtements ou couleurs.','Ajoute un élément qui n’appartient qu’à ta version.'],
 ['Une couverture à ta façon','Une proposition de pochette ou de couverture.','Choisis un livre ou un album et l’ambiance que tu veux évoquer.','Compose une image simple avec un élément principal et une place pour le titre.','Ajoute le titre et vérifie qu’il reste lisible.'],
 ['Un visage, ton regard','Un portrait stylisé, même inachevé.','Choisis un visage et les traits que tu veux accentuer.','Pose les grandes proportions, puis dessine les yeux, le nez et la bouche à ta façon.','Renforce un trait expressif et conserve cette version.'],
 ['Une image réinterprétée','Une étude personnelle à partir d’une illustration.','Choisis une image de référence et un seul élément à étudier.','Reprends sa composition ou ses formes en changeant la palette, le sujet ou les proportions.','Note la référence et ce que tu as choisi de transformer.'],
 ['Ta journée en trois cases','Une mini-BD avec un début, un moment et une chute.','Trace trois cases et choisis un petit événement de ta journée.','Raconte-le avec des personnages simples et peu de texte.','Relis les cases dans l’ordre et clarifie la dernière action.'],
 ['Un personnage et son décor','Une scène qui situe un personnage dans un lieu.','Choisis un personnage, un lieu et leur position sur la feuille.','Dessine d’abord les grandes masses du décor, puis le personnage et quelques détails proches.','Ajoute un indice d’ambiance : lumière, météo ou objet.'],
 ['Un portrait d’après photo','Une étude de visage à partir d’une photo.','Choisis une photo bien lisible et observe l’orientation du visage.','Pose les volumes et les grandes ombres avant les petits détails.','Compare les proportions principales ; une étude partielle suffit.'],
]
const WRITING: readonly CreativeBrief[] = [
 ['L’instant en trois phrases','Trois phrases ancrées dans ce que tu observes.','Choisis une chose que tu vois, une que tu entends et une que tu ressens.','Écris trois phrases avec au moins un détail concret.','Relis et remplace un mot vague par un mot plus précis.'],
 ['Cinq façons de commencer','Cinq fins différentes pour une même phrase.','Recopie « Aujourd’hui, j’ai remarqué que… ».','Complète la phrase cinq fois, en changeant de sujet à chaque essai.','Souligne la version qui te donne le plus envie de poursuivre.'],
 ['Un personnage en dix mots','Le portrait très court d’un personnage.','Imagine une allure, une habitude et une particularité.','Choisis dix mots qui font apparaître ce personnage.','Compte les mots et remplace ceux qui apportent peu.'],
 ['L’histoire qui commence','Un titre et une première phrase.','Choisis un lieu ou une situation inhabituelle.','Écris une première phrase qui soulève une question, puis trouve un titre.','Lis l’ensemble et garde la version qui t’intrigue.'],
 ['L’objet inconnu','Une description qui fait redécouvrir un objet ordinaire.','Choisis un objet près de toi et imagine que tu ignores son nom.','Décris sa forme, sa matière et son usage supposé sans le nommer.','Ajoute une sensation ou une comparaison.'],
 ['Une histoire en cent mots','Une micro-fiction autour du mot tiré.','Au démarrage, découvre le mot et imagine un personnage qui veut quelque chose.','Écris une situation, un obstacle et une petite bascule en visant cent mots.','Resserre la fin ; le nombre de mots reste un repère pour pratiquer.'],
 ['Un souvenir en dix lignes','Un bon souvenir raconté avec des détails concrets.','Choisis un moment précis, plutôt qu’une période entière.','Raconte-le en une dizaine de lignes : lieu, geste, voix et sensation.','Garde le détail qui rend ce souvenir personnel.'],
 ['Une lettre à la fiction','Une lettre adressée à un personnage que tu aimes.','Choisis le personnage et ce que tu voudrais lui dire.','Écris-lui directement : une question, un désaccord ou un remerciement.','Termine par une phrase qui appelle une réponse.'],
 ['La suite t’appartient','Un début de récit prolongé à ta façon.','Au démarrage, lis la première phrase proposée et choisis qui raconte.','Poursuis avec une action et un imprévu, sans chercher toute l’histoire.','Relis le passage pour garder la même voix.'],
 ['Un lieu vu autrement','Un lieu réel découvert par un personnage.','Choisis un lieu autour de toi et une personne qui ne le connaît pas.','Décris ce qu’elle remarque, dans l’ordre où elle le découvre.','Ajoute un détail qui révèle ce qu’elle ressent.'],
 ['Deux voix qui se répondent','Une courte scène de dialogue.','Au démarrage, découvre les deux traits et donne un objectif à chaque personnage.','Écris leur échange autour d’un désaccord concret. Distingue leurs façons de parler.','Lis à voix basse et retire une réplique qui explique trop.'],
 ['L’interview de ton futur','Une interview imaginaire de toi dans dix ans.','Choisis un contexte et prépare quatre ou cinq questions.','Réponds avec des exemples : une journée, un projet et une difficulté surmontée.','Termine par un conseil que ce futur toi donnerait aujourd’hui.'],
 ['Un événement, tes mots','Un récit personnel d’un événement marquant.','Choisis un événement que tu as envie de raconter maintenant.','Raconte ce qui se passe avant, pendant et après, avec les détails qui te reviennent.','Relis seulement si tu en as envie et donne un titre à ce passage.'],
 ['Ton avis, avec des exemples','Une courte critique d’une œuvre que tu apprécies.','Choisis un livre, un film ou un album et l’idée principale de ton avis.','Explique deux points précis en citant une scène, une ambiance ou un passage.','Conclus en disant à qui tu conseillerais cette œuvre et pourquoi.'],
 ['Une scène ailleurs','Une scène située dans un lieu que tu aimerais visiter.','Choisis le lieu, un personnage et une action simple.','Écris la scène avec quelques sensations ; tu peux inventer les détails qui te manquent.','Vérifie que quelque chose change entre le début et la fin.'],
]

/** Presentation only: stable activity IDs, canonical instructions and grading stay intact. */
export function activityBrief(activity:Activity):ActivityBrief|undefined {
 const creative=(activity.passion==='dessin'?DRAWING:activity.passion==='ecriture'?WRITING:undefined)
 const item=creative?.[activity.number-1]
 if(item&&activity.id===`${activity.passion}-${activity.duration}-${activity.number}`){
  const [title,outcome,prepare,practice,finish]=item
  const minutes=activity.duration===5?[1,3,1]:activity.duration===15?[2,11,2]:[3,23,4]
  const materials=activity.passion==='dessin'?'Papier et crayon, ou la feuille de l’app.': 'Un carnet et un stylo, ou l’éditeur de l’app.'
  return {title,outcome,materials,steps:[{title:'Préparer',text:prepare,minutes:minutes[0]},{title:'Explorer',text:practice,minutes:minutes[1]},{title:'Garder une trace',text:finish,minutes:minutes[2]}]}
 }
 if(activity.passion==='piano'){
  const melody=keyboardMelody(activity.id)
  if(!melody)return undefined
  return {title:melody.title,outcome:activity.duration===5?'Découvrir une première phrase, à ton rythme.':activity.duration===15?'Travailler quelques phrases et essayer de les relier.':'Approfondir un passage et tenter un enchaînement, sans chercher la vitesse.',materials:'Le clavier de l’app, ou ton piano. Aucun instrument externe obligatoire.',steps:[{title:'Repérer',text:'Observe les premières notes et retrouve-les sur le clavier.'},{title:'Répéter',text:'Joue une phrase lentement, puis recommence. Passe à la suivante quand tu te sens prêt.'},{title:'Faire le point',text:'Rejoue le passage travaillé. Tu peux poursuivre le morceau lors d’une prochaine séance.'}]}
 }
 const studio=studioConfig(activity.id)
 if(studio)return {title:studio.title,outcome:studio.description,materials:'Les outils de l’app suffisent. Un brouillon est facultatif.',steps:[{title:'Comprendre',text:'Lis la consigne et observe les documents avant de répondre.'},{title:'Essayer',text:activity.passion==='logique'?'Teste une piste à la fois et vérifie les contraintes.':'Réponds aux exercices en repérant la règle utilisée.'},{title:'Revenir sur ta réponse',text:activity.passion==='logique'?'Vérifie ta solution et reprends les étapes qui bloquent.':'Dans l’app, consulte les corrections et retiens une règle à réutiliser.'}]}
 const sport=sportProgram(activity.id)
 if(sport)return {title:sport.session.title,outcome:`Une séance guidée de ${activity.duration} minutes, récupérations comprises.`,materials:sport.equipment,steps:[{title:'Préparer ton espace',text:'Consulte les mouvements et les variantes proposées avant de commencer.'},{title:'Suivre la séance',text:'Le programme alterne préparation, mouvements et récupérations. Garde une allure confortable.'},{title:'Terminer à ton rythme',text:'Utilise les pauses prévues et adapte les mouvements si nécessaire.'}]}
 return undefined
}
