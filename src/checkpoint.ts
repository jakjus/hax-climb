import { isInGame, defaultTeam } from "./utils"
import { sendMessage } from "./message"

let checkpoints: { [key: number]: DiscPropertiesObject } = {}

export const saveCheckpoint = (room: RoomObject, p: PlayerObject) => {
    if (!isInGame(p)) {
        sendMessage(room, p, "You have to be in game to save a checkpoint.")
    }

    let props = room.getPlayerDiscProperties(p.id)
    checkpoints[p.id] = props
}

export const loadCheckpoint = (room: RoomObject, p: PlayerObject) => {
    room.setPlayerTeam(p.id, defaultTeam)
    let props = checkpoints[p.id]
    if (props) {
        room.setPlayerDiscProperties(p.id, props)
        sendMessage(room, p, "Checkpoint loaded.")
    }
}
