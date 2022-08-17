import { isInGame, msToHhmmss, toAug } from "./utils"
import { defaultTeam } from "./settings"
import { sendMessage } from "./message"
import { PlayerAugmented } from "../index"
import { keyv } from "./db"

export const saveCheckpoint = (room: RoomObject, p: PlayerAugmented) => {
    if (!isInGame(p)) {
        sendMessage(room, p, "❌ You have to be in game to save a checkpoint.")
        return
    }

    let props = room.getPlayerDiscProperties(p.id)

    if ((Math.abs(props.xspeed) + Math.abs(props.yspeed)) > 0.09) {
        sendMessage(room, p, "❌ You cannot move while saving a checkpoint.")
        return
    }

    p.checkpoint = props
    keyv.set(p.auth, p)
    sendMessage(room, p, "Checkpoint saved.")
}

export const loadCheckpoint = async (room: RoomObject, p: PlayerAugmented) => {
    await room.setPlayerTeam(p.id, defaultTeam)
    if (p.checkpoint) {
        room.setPlayerDiscProperties(p.id, p.checkpoint)
        sendMessage(room, p, "Checkpoint loaded.")
    } else {
        sendMessage(room, p, `No checkpoint found. Make a checkpoint with "!save"`)
    }
}

const bounds = {x: [610, 650], y: [220, 255]}

export const handleAllFinish = (room: RoomObject) => {
    room.getPlayerList().filter(p => p.team != 0).forEach(po => {
        let p = toAug(po)
        if (!hasFinished(room, p)){
            return
        }
        let now = new Date().getTime()
        let started = new Date(p.started).getTime()
        let totalMiliseconds = now-started
        let mapEstimatedTimeMins = 60
        let timeDiff = mapEstimatedTimeMins*60*1000-totalMiliseconds
        // will be positive if good time, negative if bad time
        let getPoints = Math.ceil(90*(1.012**(timeDiff/60000)))
        sendMessage(room, null, `🏁 ${p.name} has finished the climb. Final Time: ${msToHhmmss(totalMiliseconds)} [+⛰️ ${getPoints}] `)
        p.points += getPoints
        if (!p.bestTime || (totalMiliseconds < p.bestTime)) {
            p.bestTime = totalMiliseconds
            sendMessage(room, null, `🏁 ${p.name} has a New Personal Best!`)
        }
        p.finished = true
        keyv.set(p.auth, p)
    })
}

export const hasFinished = (room: RoomObject, p: PlayerAugmented) => {
    let pos = room.getPlayerDiscProperties(p.id)
    if ((pos.x > bounds.x[0]) && (pos.x < bounds.x[1])
        && (pos.y > bounds.y[0]) && (pos.y < bounds.y[1])
        && (!p.finished)){
            return true
        }
        else {
            return false
        }
}
