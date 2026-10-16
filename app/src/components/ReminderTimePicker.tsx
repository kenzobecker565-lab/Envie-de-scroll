import { useId } from 'react'
import { formatClock } from '@scroll-up/shared'
import { MinutonFigure } from './Mascot.tsx'
import './ReminderTimePicker.css'

const PALETTE = [
  { hour: 0, sky: ['#352251','#6B548A'], hills: ['#514062','#736080','#594E78'] },
  { hour: 5, sky: ['#766495','#F2C7BE'], hills: ['#9098AC','#BCC5B3','#A89BB8'] },
  { hour: 8, sky: ['#B8DFF1','#FFF0CB'], hills: ['#80AA9C','#B1CC9F','#98B2C4'] },
  { hour: 12, sky: ['#A8DDEC','#E9F5D8'], hills: ['#78A78C','#B5D29E','#89ADB6'] },
  { hour: 18.5, sky: ['#BAA1D5','#FFD0A8'], hills: ['#839A9B','#B6BB91','#A597BB'] },
  { hour: 21, sky: ['#433064','#806099'], hills: ['#5E4A76','#80708D','#71618C'] },
  { hour: 24, sky: ['#352251','#6B548A'], hills: ['#514062','#736080','#594E78'] },
] as const
function blend(a: string, b: string, t: number) {
  const channels = [1,3,5].map(i => Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t))
  return `rgb(${channels.join(',')})`
}

/** Le paysage reste décoratif ; le curseur natif et la saisie d’heure sont accessibles. */
export function ReminderTimePicker({ value, onChange, disabled = false }: { value: number; onChange: (minutes: number) => void; disabled?: boolean }) {
  const id = useId(), hour = value / 60
  const index = PALETTE.findIndex((point,i) => i < PALETTE.length-1 && hour >= point.hour && hour < PALETTE[i+1]!.hour)
  const a = PALETTE[Math.max(0,index)]!, b = PALETTE[Math.max(0,index)+1]!
  const t = (hour-a.hour)/(b.hour-a.hour)
  const sky = a.sky.map((color,i) => blend(color,b.sky[i]!,t)), hills = a.hills.map((color,i) => blend(color,b.hills[i]!,t))
  const daylight = Math.max(0,Math.min(1,(hour-5)/2,(21-hour)/2)), night = 1-daylight
  const sunPhase = Math.max(0,Math.min(1,(hour-6)/14))
  const time = `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`
  return <div className="reminder-time-picker">
    <div className="reminder-landscape" aria-hidden="true">
      <svg viewBox="0 0 420 235" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={sky[0]}/><stop offset="1" stopColor={sky[1]}/></linearGradient><linearGradient id={`${id}-lake`} x2="0" y2="1"><stop stopColor={blend('#B7DBD5','#73668F',night)}/><stop offset="1" stopColor={hills[0]}/></linearGradient></defs>
        <rect width="420" height="235" fill={`url(#${id}-sky)`}/>
        <g opacity={night} fill="#FFF5DC">{[[30,26],[101,39],[173,21],[232,53],[277,27],[372,46],[330,80],[73,73]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?1.8:1}/>)}</g>
        <circle cx={45+sunPhase*330} cy={150-Math.sin(sunPhase*Math.PI)*115} r="23" fill="#FFE19B" opacity={daylight}/>
        <g opacity={night}><path d="M337 25a22 22 0 1 0 23 33A22 22 0 0 1 337 25" fill="#FFF1C3"/></g>
        <g fill="#FFF6EB" opacity={daylight*.4}><path d="M0 72h89c-8-18-24-16-29-11-9-27-41-23-48-4C5 52 0 61 0 72"/><path d="M285 63h110c-6-14-25-16-33-9-8-23-38-24-47-4-11-8-24-1-30 13"/></g>
        <path d="M0 141Q48 105 95 136T191 127T295 128T420 122V235H0Z" fill={hills[2]}/>
        <path d="M0 157Q72 126 160 155T310 149T420 151V235H0Z" fill={hills[0]}/>
        <path d="M226 151Q314 160 420 152V191Q354 179 272 182L144 167Z" fill={`url(#${id}-lake)`}/>
        <path d="M0 187Q67 152 155 173T330 198T420 194V235H0Z" fill={hills[1]}/>
        <g fill={blend('#577F76','#453450',night)}><path d="M19 175q-15-83 0-88 16 5 0 88M37 173q-12-62 0-67 13 5 0 67M390 203q-14-67 0-73 14 6 0 73"/></g>
        <g fill={blend('#B89CD0','#A78DC1',night)}>{[24,130,152,350,369].map((x,i)=><g key={x}><path d={`M${x} 235v-${22+i*3}`} stroke={hills[0]} strokeWidth="2"/><ellipse cx={x} cy={209-i*3} rx="3" ry="8"/><ellipse cx={x+3} cy={217-i*2} rx="3" ry="6"/></g>)}</g>
      </svg>
      <div className="reminder-landscape-minuton"><MinutonFigure pose={night>.5?'wait':'welcome'} size={94} animated={false}/></div>
    </div>
    <label className="reminder-clock" htmlFor={`${id}-clock`}><span className="sr-only">Heure du rappel</span><input id={`${id}-clock`} type="time" step="60" value={time} disabled={disabled} onChange={event=>{const [h,m]=event.target.value.split(':').map(Number);if(h !== undefined && m !== undefined && Number.isInteger(h)&&Number.isInteger(m) && h >= 0 && h < 24 && m >= 0 && m < 60)onChange(h*60+m)}}/></label>
    <p className="reminder-caption">Un petit rappel, une fois par jour au maximum.</p>
    <label className="sr-only" htmlFor={`${id}-slider`}>Choisir l’heure du rappel</label>
    <input id={`${id}-slider`} className="reminder-slider" type="range" min="0" max="1439" step="1" value={value} disabled={disabled} aria-valuetext={formatClock(value)} onChange={event=>onChange(Number(event.target.value))} style={{ '--time-progress': `${value/1439*100}%` } as React.CSSProperties}/>
    <div className="reminder-hour-marks" aria-hidden="true"><span>00 h</span><span>06 h</span><span>12 h</span><span>18 h</span><span>23 h</span></div>
  </div>
}
