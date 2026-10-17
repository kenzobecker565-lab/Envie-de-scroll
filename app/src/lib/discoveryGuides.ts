import type {DiscoveryGuide,UserDTO} from '@scroll-up/shared'
import type {Route} from '../state/AppState.tsx'
import type {TourStep} from './tutorial.ts'
export interface DiscoveryTour {anchor:string;steps:readonly TourStep[]}
const step=(title:string,text:string,pose:TourStep['pose']='idea',selectors:readonly string[]=[]):TourStep=>({title,text,pose,chapter:'Découvrir',targets:[],selectors,dim:.4})
export const DISCOVERY_TOURS:Record<DiscoveryGuide,DiscoveryTour>={
 explorer:{anchor:'.explore-passions',steps:[
  step('Explore ce qui te plaît','Tes passions sont réunies ici. Ouvre celle qui te donne envie pour pratiquer ou apprendre.','idea',['.explore-passions']),
  step('Tes passions peuvent évoluer','Gérer ouvre les six passions. Ajoute celles qui te plaisent : elles serviront aussi à choisir tes trois idées.','think',['.explore-section-title'])]},
 passion:{anchor:'.explore-choice',steps:[
  step('Une idée à réaliser','Pratiquer te propose trois activités selon ton temps. Choisis celle qui te plaît, dans l’app ou ailleurs.','draw',['.explore-choice']),
  step('Des repères pour progresser','Apprendre ouvre les leçons de cette passion. Tu peux suivre l’ordre conseillé ou choisir librement.','write',['[data-tour-target="learn"]'])]},
 practice:{anchor:'.explore-duration',steps:[
  step('Une pause à ta mesure','Règle la jauge sur 5, 15 ou 30 minutes : les trois propositions s’adaptent à ce temps.','idea',['.explore-duration']),
  step('Choisis ce qui te donne envie','Ouvre une idée pour voir la consigne avant de commencer. « Trois autres idées » renouvelle les propositions.','draw',['.explore-ideas'])]},
 learning:{anchor:'.explore-chapter',steps:[
  step('Avance à ton rythme','Les leçons sont rangées en trois chapitres. Toutes sont accessibles ; l’ordre est simplement conseillé.','write',['.explore-chapter']),
  step('Reprends quand tu veux','Une leçon commencée se retrouve dans Explorer. Tes essais conservés t’attendent dans les carnets d’apprentissage.','cheer')]},
 lesson:{anchor:'.learning-lesson',steps:[
  step('Comprendre, puis essayer','Chaque leçon avance en quatre temps : comprendre, essai guidé, à toi, puis bilan.','think'),
  step('Garde ta progression','Utilise « Sauvegarder ma progression » pour reprendre plus tard. À la fin, conserve ton essai pour le retrouver dans tes carnets.','write')]},
 gallery:{anchor:'.gallery-passions',steps:[
  step('Une place pour tes créations','Chaque coin de ton atelier ouvre une passion. Retrouve tes dessins, tes textes et tes séances enregistrées.','draw',['.gallery-passions']),
  step('Ton exposition personnelle','Mon exposition rassemble tes créations préférées dans un décor que tu peux personnaliser.','cheer',['.gallery-segment'])]},
 notebook:{anchor:'.notebook-room',steps:[
  step('Ton vrai carnet','Ouvre ton carnet pour relire tes pages conservées. Le sommaire permet de retrouver une entrée directement.','write'),
  step('Feuillette à ta façon','Dans le carnet ouvert, utilise les flèches ou glisse horizontalement pour changer de page. Le sommaire reste disponible pour choisir une autre entrée.','idea')]},
 exhibition:{anchor:'.gallery-exhibition-wall',steps:[
  step('Tes créations à l’honneur','Choisis les créations que tu veux exposer. Elles restent également disponibles dans leur galerie.','draw',['.gallery-exhibition-wall']),
  step('Un décor qui te ressemble','Personnaliser permet de choisir l’ambiance, les cadres et le décor. Enregistre tes choix pour les conserver.','cheer')]},
 shop:{anchor:'.skin-shop-tabs',steps:[
  step('Habille ton Minuton','Explore les collections et ouvre une tenue pour la prévisualiser avant de l’acheter.','welcome'),
  step('Tes minutons, tes choix','Les minutons gagnés pendant tes activités servent aux achats. Les dépenser ne fait pas baisser ton expérience.','cheer',['[data-tour-target="wallet"]']),
  step('Retrouve tes tenues','Mes tenues réunit tes tenues obtenues. Essayage te permet de voir les autres sur Minuton, sans changer ta tenue actuelle.','idea',['.skin-shop-tabs'])]},
 profile:{anchor:'.profile-experience',steps:[
  step('Ton chemin parcouru','Ton profil rassemble ton niveau, ton expérience et tes activités. Les minutes de pratique font progresser ton expérience.','cheer',['.profile-experience']),
  step('Tes réglages à portée de main','La roue dentée ouvre les réglages : rappels, passions et tutoriel de bienvenue. Ton avatar permet de revenir ici.','idea',['[data-tour-target="settings"]'])]},
}
export function guideForRoute(route:Route):DiscoveryGuide|undefined{
 switch(route.name){
  case 'passionHub':return 'explorer'
  case 'passionSpace':return route.mode==='practice'?'practice':route.mode==='learn'?'learning':'passion'
  case 'learnPassion':return 'learning'
  case 'learningLesson':return 'lesson'
  case 'gallery':return route.focus?undefined:!route.passion?'gallery':route.passion==='ecriture'||route.passion==='francais'?'notebook':undefined
  case 'atelier':return route.focus?undefined:'exhibition'
  case 'shop':return 'shop'
  case 'profile':return 'profile'
  default:return undefined
 }
}
const key=(userId:string,id:DiscoveryGuide)=>`scroll-up:discovery:v1:${userId}:${id}`
export function discoverySeen(user:Pick<UserDTO,'id'|'completedGuides'>,id:DiscoveryGuide):boolean{
 if(user.completedGuides?.includes(id))return true
 try{return localStorage.getItem(key(user.id,id))==='done'}catch{return false}
}
export function rememberDiscovery(userId:string,id:DiscoveryGuide){try{localStorage.setItem(key(userId,id),'done')}catch{/* Account flag remains authoritative. */}}
