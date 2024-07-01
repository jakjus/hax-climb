import { PlayerAugmented, PlayerMapStats, players } from "../index"
import { currentMap } from "./mapchooser"
import { room, db } from "../index"

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const isInGame = (p: PlayerObject) => p.team == 1 || p.team == 2
export const toAug = (p: PlayerObject): PlayerAugmented => players[p.id]
export const getStats = async (p: PlayerAugmented): PlayerMapStats => {
  const playerInDb = await db.get('SELECT id FROM players WHERE auth=?', [p.auth])
  const stats = await db.run('SELECT * FROM stats WHERE playerId=?', [playerInDb.id])
  return stats.length > 0 ? stats[0] : null
}

export const updateTime = async (pAug: PlayerAugmented): void => {
  const stats = await getStats(pAug)
    let stopped = stats.stopped
    let started = stats.started
    if (started && stopped) {
        let dateNow = new Date().getTime()
        let timeSpent = new Date(stopped).getTime() - new Date(started).getTime()
        setStats(pAug, "started", dateNow - timeSpent) 
        setStats(pAug, "stopped", undefined)
    }
}

export const setStats = async (p: PlayerAugmented, key: keyof PlayerMapStats, value: PlayerMapStats[typeof key]): Promise<any> => {
  const playerInDb = await db.get('SELECT id FROM players WHERE auth=?', [p.auth])
  return await db.run('UPDATE stats SET ?=? WHERE playerId=? WHERE mapSlug=?', [key, value, playerInDb.id, currentMap.slug])
}
export const msToHhmmss = (ms: number | undefined): string => {
    if (!ms) { return '-' }
    let hours = Math.floor(ms/(1000*60*60))
    let minutes = Math.floor(ms/(1000*60)) - hours*60
    let seconds = Math.floor(ms/(1000)) - minutes*60 - hours*60*60
    let miliseconds = ms - seconds*1000 - minutes*60*1000 - hours*60*60*1000
    let hoursStr = hours.toString()
    if (hoursStr.length < 2) {
        hoursStr = "0"+hoursStr
    }
    let minutesStr = minutes.toString()
    if (minutesStr.length < 2) {
        minutesStr = "0"+minutesStr
    }
    let secondsStr = seconds.toString()
    if (secondsStr.length < 2) {
        secondsStr = "0"+secondsStr
    }
    let milisecondsStr = miliseconds.toString().slice(0,2)
    let timeString = `${hoursStr}h ${minutesStr}m ${secondsStr}.${milisecondsStr}s`
    return timeString
}

export const addTransparency = (p: PlayerObject) => {
    let cf = room.CollisionFlags
    // @ts-ignore
    room.setPlayerDiscProperties(p.id, {cGroup: cf.c1})
}
