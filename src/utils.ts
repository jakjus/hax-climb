import { PlayerAugmented, players } from "../index"

export const isInGame = (p: PlayerObject) => p.team == 1 || p.team == 2
export const toAug = (p: PlayerObject): PlayerAugmented => players[p.id]
export const msToHhmmss = (ms: number): string => {
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

export const addTransparency = (room: RoomObject, p: PlayerObject) => {
    let cf = room.CollisionFlags
    let props = room.getPlayerDiscProperties(p.id)
    // @ts-ignore
    room.setPlayerDiscProperties(p.id, {...props, cGroup: cf.c1})
}