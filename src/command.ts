import { sendMessage } from "./message"
import { PlayerAugmented } from "../index"
import { saveCheckpoint, loadCheckpoint } from "./checkpoint"
import { defaultTeam } from "./settings"
import config from "../config"
import { msToHhmmss } from "./utils"
import { keyv } from "./db"

export const isCommand = (msg: string) => msg.trim().startsWith("!")
export const handleCommand = (room: RoomObject, p: PlayerAugmented, msg: string) => {
    let commandText = msg.trim().slice(1)
    let commandName = commandText.split(" ")[0]
    let commandArgs = commandText.split(" ").slice(1)
    if (commands[commandName]) {
        commands[commandName](room, p, commandArgs)
    } else {
        sendMessage(room, p, "Command not found.")
    }
}

type commandFunc = (room: RoomObject, p: PlayerAugmented, args: Array<string>) => void
const commands: { [key: string]: commandFunc } = {
    save: (room, p) => saveCheckpoint(room, p),
    s: (room, p) => saveCheckpoint(room, p),
    load: (room, p) => loadCheckpoint(room, p),
    l: (room, p) => loadCheckpoint(room, p),
    time: (room, p) => showTime(room, p),
    t: (room, p) => showTime(room, p),
    resetclimb: (room, p) => reset(room, p),
    top: (room, p) => showLeaderboardsPoints(room, p),
    topmap: (room, p) => showLeaderboards(room, p),
    bb: (room, p) => bb(room, p),
    help: (room, p) => showHelp(room, p),
    //testEnd: (room, p) => testEnd(room, p),
}

const showHelp = (room: RoomObject, p: PlayerObject) => {
    sendMessage(room, p, `${config.roomName}. Commands: ${Object.keys(commands)
                    .map(k => "!"+k)
                    .join(", ")}`)
}

const showTime = (room: RoomObject, p: PlayerAugmented) => {
    let now = new Date().getTime()
    let started = new Date(p.started).getTime()
    let totalMiliseconds = now-started

    sendMessage(room, null, `${p.name} - Current Time: ${msToHhmmss(totalMiliseconds)}`)
}

const reset = (room: RoomObject, p: PlayerAugmented) => {
    p.started = new Date()
    p.checkpoint = undefined
    p.finished = false
    room.setPlayerTeam(p.id, 0)
    room.setPlayerTeam(p.id, defaultTeam)
    sendMessage(room, p, `Your climb was reset.`)
}

const showLeaderboards = async (room: RoomObject, p: PlayerAugmented) => {
    let leaderboards = []
    for await (const [_, value] of keyv.iterator()) {
        if (value.bestTime) {
            leaderboards.push({name: value.name, time: value.bestTime})
        }
    };
    if (leaderboards.length == 0) {
        sendMessage(room, p, `Noone has completed the map.`)
        return
    }
    let leaderboardsStr = leaderboards.sort((a, b) => a.time - b.time).slice(0,10).map((v, i) => `${i+1}. ${v.name} [${msToHhmmss(v.time)}]`)
    sendMessage(room, p, `Leaderboards:`)
    for (let leader of leaderboardsStr) {
        sendMessage(room, p, `${leader}`)
    }
}

const showLeaderboardsPoints = async (room: RoomObject, p: PlayerAugmented) => {
    let leaderboards = []
    for await (const [_, value] of keyv.iterator()) {
        if (value.points) {
            leaderboards.push({name: value.name, points: value.points})
        }
    };
    if (leaderboards.length == 0) {
        sendMessage(room, p, `Noone has any points.`)
        return
    }
    let leaderboardsStr = leaderboards.sort((a, b) => a.points - b.points).slice(0,10).map((v, i) => `${i+1}. ${v.name} [${Math.floor(p.points)}⛰️]`)
    sendMessage(room, p, `Points leaderboards:`)
    for (let leader of leaderboardsStr) {
        sendMessage(room, p, `${leader}`)
    }
}


const bb = (room: RoomObject, p: PlayerAugmented) => {
    room.kickPlayer(p.id, "Bye!", false)
}

/*
 * Test leaderboards by teleporting to the end of the room.
 *
const testEnd = (room: RoomObject, p: PlayerAugmented) => {
    // @ts-ignore
    room.setPlayerDiscProperties(p.id, {x: 630, y: 220})
}
*/
