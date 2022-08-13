import { Headless } from "haxball.js"
import { isCommand, handleCommand } from "./src/command"
import { saveCheckpoint, loadCheckpoint } from "./src/checkpoint"

interface RoomArgs {
    roomName: string,
    token: string
}

const roomBuilder = (HBInit: Headless, args: RoomArgs) => {
    let room = HBInit({
        roomName: args.roomName,
        token: args.token
    })

    room.setTimeLimit(0)
    room.setScoreLimit(0)

    let players: { [key: number]: PlayerObject } = {}

    room.onPlayerJoin = p => {
        loadCheckpoint(room, p)
        players[p.id] = p
    }

    room.onPlayerLeave = p => {
        saveCheckpoint(room, p)
        delete players[p.id]
    }

    room.onPlayerChat = (p, msg) => {
        if (isCommand(msg)){
            handleCommand(room, p, msg)
            return false
        }
        return true
    }

    room.onRoomLink = url => console.log(`Room link: ${url}`)
}

export default roomBuilder;
