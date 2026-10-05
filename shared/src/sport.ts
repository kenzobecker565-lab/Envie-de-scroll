import type { Activity, Duration } from './types.ts'

/** Editorial routines, based on the movement descriptions linked below. */
export const SPORT_SOURCES = ['https://www.nhs.uk/live-well/exercise/strength-exercises/', 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/core-strength/art-20546851'] as const
export type SportExercise = {title:string;steps:readonly string[];easier:string;easyExercise?:SportExerciseId;cue:string;mistake:string;pose:'squat'|'wall'|'push'|'plank'|'bridge'|'bird'|'sideplank'|'lunge'|'calf'|'march'|'side'|'leg'|'shoulders';side?:'left'|'right'|'alternate';floor?:boolean;wall?:boolean}
export type SportExerciseId = 'squat'|'wall'|'push'|'plank'|'bridge'|'bird'|'sideplank'|'sideleft'|'sideright'|'lunge'|'lungeleft'|'lungeright'|'calf'|'march'|'side'|'knees'|'leg'|'shoulders'
export const SPORT_EXERCISES:Record<SportExerciseId,SportExercise> = {
 squat:{title:'Squats',steps:['Pieds à largeur des hanches, appuis stables.','Recule les hanches et plie les genoux à ton amplitude.','Remonte doucement, talons posés au sol.'],easier:'Descends moins bas. Tu peux effleurer un mur avec une main pour garder l’équilibre.',cue:'Une descente contrôlée, à ton amplitude.',mistake:'Évite de décoller les talons ou de descendre plus bas que confortable.',pose:'squat'},
 wall:{title:'Pompes au mur',steps:['Mains à hauteur de poitrine, face au mur.','Plie les coudes, en gardant le corps aligné.','Repousse doucement le mur, sans bloquer les coudes.'],easier:'Rapproche tes pieds du mur pour réduire l’effort.',cue:'Garde le corps aligné et respire.',mistake:'Évite de creuser le bas du dos ou de hausser les épaules.',pose:'wall',wall:true},
 push:{title:'Pompes adaptées',steps:['Au sol, mains sous les épaules et genoux posés.','Plie doucement les coudes, bassin et épaules alignés.','Repousse le sol. Souffle en remontant.'],easier:'Choisis les pompes au mur si la version au sol est trop difficile.',easyExercise:'wall',cue:'Genoux au sol, épaules et bassin alignés.',mistake:'Évite de laisser le bassin tomber ou de bloquer ta respiration.',pose:'push',floor:true},
 plank:{title:'Gainage sur les genoux',steps:['Avant-bras et genoux posés, coudes sous les épaules.','Aligne le bassin avec les épaules et les genoux.','Tiens quelques secondes en respirant ; repose-toi dès que nécessaire.'],easier:'Tiens par petites périodes, avec des pauses.',cue:'Respire ; tu peux reposer le bassin quand tu en as besoin.',mistake:'Évite de creuser le dos ou de retenir ta respiration.',pose:'plank',floor:true},
 bridge:{title:'Pont fessier',steps:['Sur le dos, genoux pliés et pieds au sol.','Soulève le bassin jusqu’à aligner épaules, hanches et genoux.','Redescends lentement, sans cambrer davantage.'],easier:'Soulève moins haut et repose le bassin entre chaque répétition.',cue:'Monte doucement, sans creuser le dos.',mistake:'Évite de pousser sur la tête ou de monter en cambrant.',pose:'bridge',floor:true},
 bird:{title:'Bird dog',steps:['À quatre pattes, mains sous les épaules et genoux sous les hanches.','Tends un bras et la jambe opposée, sans tourner le bassin.','Reviens doucement puis change de côté.'],easier:'Bouge seulement un bras ou une jambe à la fois, avec une petite amplitude.',cue:'Un bras et la jambe opposée, bassin stable.',mistake:'Évite de lever la jambe trop haut ou de tourner le bassin.',pose:'bird',side:'alternate',floor:true},
 sideplank:{title:'Gainage latéral · deux côtés',steps:['Sur le côté, avant-bras posé et genoux pliés.','Soulève légèrement le bassin en gardant les épaules alignées.','Change de côté à mi-temps. Repose-toi si nécessaire.'],easier:'Tiens seulement quelques secondes à la fois, avec des pauses.',cue:'15 secondes par côté ; repose-toi si besoin.',mistake:'Évite de t’affaisser sur l’épaule ou de retenir ta respiration.',pose:'sideplank',side:'alternate',floor:true},
 sideleft:{title:'Gainage latéral gauche',steps:['Sur le côté gauche, avant-bras posé et genoux pliés.','Soulève légèrement le bassin en gardant les épaules alignées.','Respire et repose le bassin dès que nécessaire.'],easier:'Alterner quelques secondes de maintien et quelques secondes de repos.',cue:'Épaule au-dessus du coude, sans forcer.',mistake:'Évite de t’affaisser sur l’épaule.',pose:'sideplank',side:'left',floor:true},
 sideright:{title:'Gainage latéral droit',steps:['Sur le côté droit, avant-bras posé et genoux pliés.','Soulève légèrement le bassin en gardant les épaules alignées.','Respire et repose le bassin dès que nécessaire.'],easier:'Alterner quelques secondes de maintien et quelques secondes de repos.',cue:'Épaule au-dessus du coude, sans forcer.',mistake:'Évite de t’affaisser sur l’épaule.',pose:'sideplank',side:'right',floor:true},
 lunge:{title:'Petites fentes alternées',steps:['Décale un pied vers l’arrière, appuis assez larges pour être stable.','Plie légèrement les deux genoux, buste droit.','Reviens debout puis change de jambe.'],easier:'Réduis la descente, ou remplace les fentes par de petits squats.',easyExercise:'squat',cue:'Petite amplitude, appuis stables.',mistake:'Évite de perdre l’équilibre en rapprochant trop les pieds.',pose:'lunge',side:'alternate'},
 lungeleft:{title:'Fentes · gauche devant',steps:['Place le pied gauche devant et le droit derrière.','Plie légèrement les deux genoux, buste droit.','Remonte sans changer de côté pendant cet intervalle.'],easier:'Fais de petites descentes, ou remplace par des mini-squats.',easyExercise:'squat',cue:'Gauche devant, descente douce.',mistake:'Évite de perdre l’équilibre en rapprochant trop les pieds.',pose:'lunge',side:'left'},
 lungeright:{title:'Fentes · droite devant',steps:['Place le pied droit devant et le gauche derrière.','Plie légèrement les deux genoux, buste droit.','Remonte sans changer de côté pendant cet intervalle.'],easier:'Fais de petites descentes, ou remplace par des mini-squats.',easyExercise:'squat',cue:'Droite devant, descente douce.',mistake:'Évite de perdre l’équilibre en rapprochant trop les pieds.',pose:'lunge',side:'right'},
 calf:{title:'Montées sur les pointes',steps:['Debout, pieds à largeur des hanches.','Soulève doucement les talons, sans saut.','Repose les talons avec contrôle.'],easier:'Réduis la hauteur et pose une main sur un mur pour l’équilibre.',cue:'Monte et redescends doucement.',mistake:'Évite de rebondir ou de perdre tes appuis.',pose:'calf'},
 march:{title:'Marche active sur place',steps:['Marche sur place, pieds posés sans saut.','Accompagne le mouvement avec les bras.','Garde une cadence qui te permet de parler.'],easier:'Marche plus lentement avec de petits pas.',cue:'Une cadence confortable, sans saut.',mistake:'Évite de chercher la vitesse au détriment de tes appuis.',pose:'march',side:'alternate'},
 side:{title:'Petits pas de côté',steps:['Fais un petit pas à droite, puis rapproche l’autre pied.','Reviens vers la gauche, sans croiser les jambes.','Pose les pieds doucement, genoux souples.'],easier:'Fais des pas plus petits et plus lents.',cue:'Petits pas, sans saut.',mistake:'Évite de croiser les jambes ou de faire de grands pas.',pose:'side'},
 knees:{title:'Montées de genoux alternées',steps:['Debout, appuis stables et buste droit.','Soulève un genou à une hauteur confortable puis repose le pied.','Change de jambe sans saut.'],easier:'Soulève moins haut et prends ton temps.',cue:'Alterner les jambes sans saut.',mistake:'Évite de te pencher en arrière pour lever le genou.',pose:'march',side:'alternate'},
 leg:{title:'Élévations latérales des jambes',steps:['Debout, une main près d’un mur pour l’équilibre.','Lève légèrement une jambe sur le côté, bassin stable.','Repose-la doucement puis change de côté.'],easier:'Réduis la hauteur et garde une main sur le mur.',cue:'Petite amplitude, bassin stable.',mistake:'Évite de pencher le buste pour monter la jambe.',pose:'leg',side:'alternate'},
 shoulders:{title:'Préparer les épaules',steps:['Debout, pieds stables, bras relâchés.','Fais de petits cercles d’épaules vers l’arrière.','Respire tranquillement et agrandis seulement si c’est confortable.'],easier:'Réduis la taille des mouvements.',cue:'Des mouvements doux pour commencer.',mistake:'Évite de forcer l’amplitude.',pose:'shoulders'},
}
export type SportSession={title:string;exercises:readonly SportExerciseId[]}
export const SPORT_SESSIONS:Record<Duration,readonly SportSession[]>={
 5:[
  {title:'Réveil musculaire',exercises:['squat','wall','bridge','plank']},
  {title:'Jambes express',exercises:['squat','lunge','calf','bridge']},
  {title:'Haut du corps express',exercises:['wall','bird','push','plank']},
  {title:'Découvrir le gainage',exercises:['plank','bird','bridge','sideplank']},
  {title:'Bouger sans aller au sol',exercises:['squat','wall','calf','side']},
 ],
 15:[
  {title:'Corps complet',exercises:['squat','push','bridge','bird']},
  {title:'Jambes et fessiers',exercises:['squat','lunge','bridge','calf']},
  {title:'Haut du corps et stabilité',exercises:['push','bird','plank','wall']},
  {title:'Renforcer son centre',exercises:['plank','bridge','sideleft','sideright']},
  {title:'Cardio sans saut',exercises:['march','side','squat','knees']},
 ],
 30:[
  {title:'Circuit complet',exercises:['squat','push','lunge','bridge','plank','march']},
  {title:'Bas du corps',exercises:['squat','lungeleft','lungeright','bridge','leg','calf']},
  {title:'Haut du corps et gainage',exercises:['push','bird','plank','sideleft','sideright','wall']},
  {title:'Cardio et renforcement',exercises:['march','squat','side','wall','knees','bridge']},
  {title:'Posture et stabilité',exercises:['bird','bridge','sideleft','sideright','plank','leg']},
 ],
}
export const SPORT_LESSONS=[
 {title:'Bien faire un squat',exercise:'squat',practice:['squat','calf','squat','march'],rule:'Des pieds stables, une descente contrôlée et une amplitude confortable.'},
 {title:'Trouver ses pompes',exercise:'push',practice:['wall','push','wall','bird'],rule:'Choisis une version qui te permet de garder le corps aligné : au mur ou sur les genoux.'},
 {title:'Comprendre le gainage',exercise:'plank',practice:['plank','bird','bridge','plank'],rule:'Le but est de rester stable en respirant, même avec de courts temps de maintien.'},
 {title:'Maîtriser les fentes',exercise:'lunge',practice:['lungeleft','lungeright','squat','calf'],rule:'Des appuis assez larges et une petite descente permettent de contrôler chaque côté.'},
 {title:'Découvrir le pont fessier',exercise:'bridge',practice:['bridge','bird','bridge','march'],rule:'Soulève le bassin avec contrôle, sans creuser davantage le bas du dos.'},
 {title:'Construire sa petite séance',exercise:'squat',practice:['squat','wall','bridge','plank'],rule:'Alterner jambes, haut du corps et centre, avec des récupérations entre les mouvements.'},
] as const
export const SPORT_ACTIVITIES:Activity[]=[...([5,15,30] as Duration[]).flatMap((duration,d)=>SPORT_SESSIONS[duration].map((session,i)=>({id:`sport-${duration}-${d*5+i+1}`,number:d*5+i+1,passion:'sport' as const,duration,text:session.title}))),...SPORT_LESSONS.map((lesson,i)=>({id:`sport-lesson-${i+1}`,number:i+16,passion:'sport' as const,duration:5 as const,text:lesson.title}))]
export type SportSegment={kind:'warmup'|'exercise'|'rest';seconds:number;title:string;instruction:string;exercise?:SportExerciseId;round?:number;movement?:number}
export function sportProgram(activityId:string){
 const activity=SPORT_ACTIVITIES.find(a=>a.id===activityId);if(!activity)return undefined
 const lesson=activity.id.includes('-lesson-')?activity.number-16:undefined
 const session:SportSession=lesson===undefined?SPORT_SESSIONS[activity.duration][(activity.number-1)%5]!:{title:SPORT_LESSONS[lesson]!.title,exercises:SPORT_LESSONS[lesson]!.practice}
 const warm=activity.duration===5?1:activity.duration===15?2:3,rounds=activity.duration===5?1:activity.duration===15?3:4
 const segments:SportSegment[]=[]
 const prep:SportExerciseId[]=['march','shoulders','squat']
 for(let i=0;i<warm;i++){const exercise=prep[i]!;segments.push({kind:'warmup',seconds:60,title:'Préparation · '+SPORT_EXERCISES[exercise].title,instruction:SPORT_EXERCISES[exercise].cue,exercise})}
 for(let round=0;round<rounds;round++){
  session.exercises.forEach((exercise,movement)=>segments.push({kind:'exercise',seconds:30,title:SPORT_EXERCISES[exercise].title,instruction:SPORT_EXERCISES[exercise].cue,exercise,round:round+1,movement:movement+1},{kind:'rest',seconds:30,title:'Récupération',instruction:'Relâche les muscles et respire tranquillement. Prépare-toi pour le mouvement suivant.',round:round+1}))
  if((activity.duration===15&&round===1)||(activity.duration===30&&round<rounds-1))segments.push({kind:'rest',seconds:60,title:'Pause entre les tours',instruction:'Prends cette minute pour récupérer et boire si besoin.'})
 }
 return {activity,lesson,session,segments,totalSeconds:activity.duration*60,rounds,equipment:session.exercises.some(id=>SPORT_EXERCISES[id].wall)?'Un mur libre ; un tapis est facultatif.':'Aucun accessoire de sport ; un tapis est facultatif.'}
}
export function sportPosition(segments:readonly SportSegment[],elapsedMs:number){
 let offset=0
 for(let index=0;index<segments.length;index++){const segment=segments[index]!;if(elapsedMs<(offset+segment.seconds)*1000)return {index,segment,remainingSeconds:Math.ceil(offset+segment.seconds-elapsedMs/1000),segmentElapsedMs:Math.max(0,elapsedMs-offset*1000)};offset+=segment.seconds}
 return {index:segments.length,segment:undefined,remainingSeconds:0,segmentElapsedMs:0}
}
export type SportSubmission={version:1;activeSeconds:number;easy?:boolean}
export type SportResult=SportSubmission & {passion:'sport';summary:string;lesson?:number}
export function validateSport(activityId:string,input:unknown):SportResult{
 const program=sportProgram(activityId),data=input as SportSubmission|undefined
 if(!program||!data||data.version!==1||!Number.isInteger(data.activeSeconds)||data.activeSeconds!==program.totalSeconds||data.easy!==undefined&&typeof data.easy!=='boolean')throw new Error('Termine la séance chronométrée avant de l’enregistrer.')
 return {version:1,passion:'sport',activeSeconds:program.totalSeconds,easy:data.easy===true,summary:`${program.session.title} · ${program.activity.duration} min`,...(program.lesson!==undefined?{lesson:program.lesson}:{})}
}
