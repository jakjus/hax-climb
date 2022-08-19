import { PlayerAugmented, room } from "../index"
import { msToHhmmss, getStats } from "./utils"

export const sendMessage = (p: PlayerObject | null, msg: string) => {
    if (p) {
        room.sendAnnouncement(`[DM] ${msg}`, p.id, 0xe6e9f2, "small", 0)
    } else {
        room.sendAnnouncement(`[Server] ${msg}`, undefined, 0xe6e9f2, "small", 0)
    }
}

export const playerMessage = (p: PlayerAugmented, msg: string) => {
    let bestTime = `[Not finished]`
    let color = 0xd6d6d6
    if (getStats(p) && getStats(p).bestTime){
        bestTime = `[${msToHhmmss(getStats(p).bestTime)}]`
        color = 0xf2e5d0
    } 

    room.sendAnnouncement(`${p.name} ${bestTime} [${Math.floor(p.points)}⛰️]: ${msg}`, undefined, color, "normal", 1)
}
