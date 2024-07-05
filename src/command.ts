import { sendMessage } from "./message"
import { room, idToAuth } from "../index"
import { saveCheckpoint, loadCheckpoint, finishedIds } from "./checkpoint"
import { defaultTeam } from "./settings"
import config from "../config"
import { currentMap } from "./mapchooser"
import { msToHhmmss, getStats } from "./utils"
import { db } from "../index"

export const isCommand = (msg: string) => msg.trim().startsWith("!")
export const handleCommand = (p: PlayerObject, msg: string) => {
    let commandText = msg.trim().slice(1)
    let commandName = commandText.split(" ")[0]
    let commandArgs = commandText.split(" ").slice(1)
    if (commands[commandName]) {
        commands[commandName](p, commandArgs)
    } else {
        sendMessage(p, "Command not found.")
    }
}

type commandFunc = (p: PlayerObject, args: Array<string>) => void
const commands: { [key: string]: commandFunc } = {
    save: (p) => saveCheckpoint(p),
    s: (p) => saveCheckpoint(p),
    load: (p) => loadCheckpoint(p),
    l: (p) => loadCheckpoint(p),
    time: (p) => showTime(p),
    t: (p) => showTime(p),
    resetclimb: (p) => reset(p),
    top: (p) => showLeaderboards(p),
    topall: (p) => showLeaderboardsPoints(p),
    discord: (p) => showDiscord(p),
    bb: (p) => bb(p),
    help: (p) => showHelp(p),
}

const showHelp = (p: PlayerObject) => {
    sendMessage(p, `${config.roomName}. Commands: ${Object.keys(commands)
                    .map(k => "!"+k)
                    .join(", ")}`)
}

const showDiscord = (p: PlayerObject) => {
    sendMessage(p, `HaxClimb Global Discord: discord.gg/ZaarExwMjf`)
}

const showTime = async (p: PlayerObject) => {
    const stats = await getStats(p)
    let now = new Date().getTime()
    let started = stats.started
    let totalMiliseconds = now-started
    if (!started) { totalMiliseconds = 0 }
    const timeStr = "Current Time"

    sendMessage(null, `${p.name} - ${timeStr}: ${msToHhmmss(totalMiliseconds)}`)
}

const reset = async (p: PlayerObject) => {
  const auth = idToAuth[p.id]
    const playerInDb = await db.get('SELECT id FROM players WHERE auth=?', [auth])
    await db.run('UPDATE stats SET started=?, stopped=?, cpX=?, cpY=? WHERE playerId=? AND mapSlug=?', [new Date().getTime(), null, null, 0, playerInDb.id, currentMap.slug])
    finishedIds.delete(p.id)
    room.setPlayerTeam(p.id, 0)
    room.setPlayerTeam(p.id, defaultTeam)
    sendMessage(p, `Your climb was reset.`)
}

const showLeaderboards = async (p: PlayerObject) => {
    const rows = await db.all("SELECT players.name, bestTime FROM stats INNER JOIN players ON stats.playerId=players.id WHERE stats.mapSlug=? AND bestTime IS NOT NULL ORDER BY bestTime ASC LIMIT 10", [currentMap.slug])
    if (rows.length == 0) {
        sendMessage(p, `Noone has completed the map.`)
        return
    }
    let leaderboards = rows.map((v: any, i: number) => `${i+1}. ${v.name} [${msToHhmmss(v.bestTime)}]`)
    sendMessage(p, `Leaderboards:`)
    for (let leader of leaderboards) {
        sendMessage(p, `${leader}`)
    }
}

const showLeaderboardsPoints = async (p: PlayerObject) => {
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


const bb = (p: PlayerObject) => {
    room.kickPlayer(p.id, "Bye!", false)
}
