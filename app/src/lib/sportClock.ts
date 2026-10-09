export type SportClock={elapsedMs:number;running:boolean;lastTickMs:number}
export function advanceSportClock(clock:SportClock,now:number,totalMs:number):SportClock {
 if(!clock.running)return clock
 const elapsedMs=Math.min(totalMs,clock.elapsedMs+Math.max(0,now-clock.lastTickMs))
 return {elapsedMs,lastTickMs:now,running:elapsedMs<totalMs}
}
export function restoredSportTime(value:unknown,totalMs:number):number {
 return typeof value==='number'&&Number.isFinite(value)&&value>=0?Math.min(totalMs,value):0
}
