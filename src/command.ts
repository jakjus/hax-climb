import { sendMessage } from "./message"
import { PlayerAugmented, room } from "../index"
import { saveCheckpoint, loadCheckpoint } from "./checkpoint"
import { defaultTeam } from "./settings"
import config from "../config"
import { msToHhmmss, getStats, setStats } from "./utils"
import { db } from "../index"

export const isCommand = (msg: string) => msg.trim().startsWith("!")
export const handleCommand = (p: PlayerAugmented, msg: string) => {
    let commandText = msg.trim().slice(1)
    let commandName = commandText.split(" ")[0]
    let commandArgs = commandText.split(" ").slice(1)
    if (commands[commandName]) {
        commands[commandName](p, commandArgs)
    } else {
        sendMessage(p, "Command not found.")
    }
}

type commandFunc = (p: PlayerAugmented, args: Array<string>) => void
const commands: { [key: string]: commandFunc } = {
    save: (p) => saveCheckpoint(p),
    s: (p) => saveCheckpoint(p),
    load: (p) => loadCheckpoint(p),
    l: (p) => loadCheckpoint(p),
    time: (p) => showTime(p),
    t: (p) => showTime(p),
    resetclimb: (p) => reset(p),
    top: (p) => showLeaderboardsPoints(p),
    topmap: (p) => showLeaderboards(p),
    bb: (p) => bb(p),
    help: (p) => showHelp(p),
    //testEnd: (room, p) => testEnd(p),
}

const showHelp = (p: PlayerObject) => {
    sendMessage(p, `${config.roomName}. Commands: ${Object.keys(commands)
                    .map(k => "!"+k)
                    .join(", ")}`)
}

const showTime = (p: PlayerAugmented) => {
    let now = new Date().getTime()
    let started = new Date(getStats(p).started).getTime()
    let totalMiliseconds = now-started

    sendMessage(null, `${p.name} - Current Time: ${msToHhmmss(totalMiliseconds)}`)
}

const reset = async (p: PlayerAugmented) => {
  const playerInDb = await db.get('SELECT id FROM players WHERE auth=?', [p.auth])
  await db.run('UPDATE stats SET started=?, cpX=?, cpY=?, finished=? WHERE playerId=?', [new Date().getTime(), null, 0, playerInDb.id])
    room.setPlayerTeam(p.id, 0)
    room.setPlayerTeam(p.id, defaultTeam)
    sendMessage(p, `Your climb was reset.`)
}

const showLeaderboards = async (p: PlayerAugmented) => {
    const rows = await db.all("SELECT players.name, bestTime FROM stats INNER JOIN players ON stats.playerId=players.id WHERE players.auth=? ORDER BY bestTime DESC LIMIT 10", [p.auth])
    if (rows.length == 0) {
        sendMessage(p, `Noone has completed the map.`)
        return
    }
    let leaderboards = rows.map((v: any, i: number) => `${i+1}. ${v.name} [${msToHhmmss(v.time)}]`)
    sendMessage(p, `Leaderboards:`)
    for (let leader of leaderboards) {
        sendMessage(p, `${leader}`)
    }
}

const showLeaderboardsPoints = async (p: PlayerAugmented) => {
    const rows = await db.all("SELECT name, points FROM players ORDER BY points DESC LIMIT 10")
    if (rows.length == 0) {
        sendMessage(p, `Noone has any points.`)
        return
    }
    let leaderboards = rows.map((v: any, i: any) => `${i+1}. ${v.name} [${Math.floor(v.points)}⛰️]`)
    sendMessage(p, `Points leaderboards:`)
    for (let leader of leaderboards) {
        sendMessage(p, `${leader}`)
    }
}


const bb = (p: PlayerAugmented) => {
    room.kickPlayer(p.id, "Bye!", false)
}

/*
const testEnd = (p: PlayerAugmented) => {
    room.setPlayerDiscProperties(p.id, {x: 630, y: 220})
}
*/
