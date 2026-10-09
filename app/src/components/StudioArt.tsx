import { BookOpen, FileText, KeyRound, Mail, Music2, Palette, Pencil, Shapes, Type, Clock3 } from 'lucide-react'
import type { PassionId } from '@scroll-up/shared'
export function StudioArt({passion,index=0,large=false}:{passion:PassionId;index?:number;large?:boolean}){
 if(passion==='logique')return <img className={`studio-case-art${large?' studio-case-art-large':''}`} src={`/art/logic-case-${index+1}.webp`} alt="" loading="lazy"/>
 const icons=passion==='francais'?[BookOpen,Type,FileText,Pencil,Mail]:passion==='piano'?[Music2,Music2,Music2,Music2,Music2]:passion==='dessin'?[Pencil,Shapes,Palette,Shapes,Pencil]:[FileText,Type,Pencil,Mail,Clock3]
 const Icon=icons[index%5]??KeyRound
 const words=passion==='francais'?['Présent','Je ferai…','a / à','Les accords','Une phrase…']:passion==='ecriture'?['Une histoire…','Aa','Mes idées','Cher…','Un dialogue']:passion==='dessin'?['Croquis','Formes','Ombres','Personnage','Motifs']:['♪','♫','♪','♫','♪']
 return <span className="studio-paper-art" data-passion={passion}><span className="studio-paper-sheet"><Icon size={30}/><i>{words[index%5]}</i><span/><span/></span><span className="studio-paper-pen"/></span>
}
export function ApprovedMinuton({size=64}:{size?:number}){return <img className="studio-approved-minuton" src="/art/minuton-approved.webp" alt="" style={{width:size,height:size}}/>}
