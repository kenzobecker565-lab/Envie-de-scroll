import {it,expect} from 'vitest'
import {advanceSportClock,restoredSportTime} from './sportClock.ts'
it('compte le temps actif, fige les pauses et reprend sans compter leur durée',()=>{
 let clock={elapsedMs:0,running:true,lastTickMs:1000}
 clock=advanceSportClock(clock,11000,300000);expect(clock.elapsedMs).toBe(10000)
 clock.running=false;clock=advanceSportClock(clock,60000,300000);expect(clock.elapsedMs).toBe(10000)
 clock.running=true;clock.lastTickMs=60000;clock=advanceSportClock(clock,61000,300000);expect(clock.elapsedMs).toBe(11000)
})
it('termine exactement à la limite et ignore les décalages en arrière',()=>{
 expect(advanceSportClock({elapsedMs:299000,running:true,lastTickMs:1000},99999,300000)).toMatchObject({elapsedMs:300000,running:false})
 expect(advanceSportClock({elapsedMs:1000,running:true,lastTickMs:1000},0,300000).elapsedMs).toBe(1000)
})
it('restaure une durée bornée et ignore les brouillons illisibles',()=>{
 expect(restoredSportTime(999999,300000)).toBe(300000)
 for(const value of [NaN,-1,Infinity,'500',null,{}])expect(restoredSportTime(value,300000)).toBe(0)
})
