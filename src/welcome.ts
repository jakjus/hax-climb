import { sendMessage } from "./message"
import { serverInfo, defaultTeam } from "./config"

export const welcomePlayer = (room: RoomObject, p: PlayerObject) => {
    room.setPlayerTeam(p.id, defaultTeam)
    sendMessage(room, p, `${serverInfo}\nUse "!help" to see all commands.`)
    sendMessage(room, p, `This project is Open Source. Visit: https://github.com/jakjus/hax-climb`)
}
