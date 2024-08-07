import { isInGame, msToHhmmss, getStats, setStats, sleep } from "./utils"
import { defaultTeam } from "./settings"
import { sendMessage } from "./message"
import { room, db, idToAuth } from "../index"
import { currentMap } from "./mapchooser"

export const saveCheckpoint = async (p: PlayerObject) => {
    if (!isInGame(p)) {
        sendMessage(p, "❌ You have to be in game to save a checkpoint.")
        return
    }
    const stats = await getStats(p)
    if (!stats.started) {
        sendMessage(p, "❌ You have finished this map. You have to !resetclimb to save a checkpoint.")
        return
    }

    let props = room.getPlayerDiscProperties(p.id)
    if ((Math.abs(props.xspeed) + Math.abs(props.yspeed)) > 0.25) {
        sendMessage(p, "❌ You cannot move while saving a checkpoint.")
        return
    }
    let oldprops = props
    sendMessage(p, "⏳ Saving checkpoint...")

    for (let i = 0; i < 5; i++) {
        await sleep(1000)
        sendMessage(p, "⏳ ...")
        props = room.getPlayerDiscProperties(p.id)
        if (!props) { return }
        if ((Math.abs(props.xspeed) + Math.abs(props.yspeed)) > 0.25) {
            sendMessage(p, "❌ You cannot move while saving a checkpoint.")
            return
        }
    }

    if ((Math.abs(oldprops.x - props.x) + Math.abs(oldprops.y - props.y)) > 1) {
        sendMessage(p, "❌ You cannot move while saving a checkpoint.")
        return
    }

    setStats(p, "cpX", props.x)
    setStats(p, "cpY", props.y)
    sendMessage(p, "✅ Checkpoint saved.")
}

export const loadCheckpoint = async (p: PlayerObject) => {
    room.setPlayerTeam(p.id, defaultTeam)
    const stats = await getStats(p)
    if (stats && stats.cpX) {
        // @ts-ignore
        room.setPlayerDiscProperties(p.id, { x: stats.cpX, y: stats.cpY })
        sendMessage(p, "Checkpoint loaded.")
    } else {
        sendMessage(p, `No checkpoint found. Make a checkpoint with "!save"`)
    }
}

export const handleAllFinish = () => {
    room.getPlayerList().filter(p => p.team !== 0).forEach(async p => {
        if (!inEndZone(p)){
            return
        }
        finishedIds.add(p.id)
        let now = new Date().getTime()
        const stats = await getStats(p)
        let started = stats.started
        let totalMiliseconds = now-started
        let timeDiff = (currentMap.estimatedTimeMins*60*1000-totalMiliseconds)/(currentMap.estimatedTimeMins*60*1000)  // will be positive if good time, negative if bad time
        let getPoints = Math.ceil(10*(5**(timeDiff)))
        db.run('UPDATE players SET points = points + ? WHERE auth=?', [getPoints, idToAuth[p.id]])
        sendMessage(null, `🏁 ${p.name} has finished the climb. Final Time: ${msToHhmmss(totalMiliseconds)} [+⛰️ ${getPoints}] `)
        let pBestTime = stats.bestTime
        if (!pBestTime || (totalMiliseconds < pBestTime)) {
            setStats(p, "bestTime", totalMiliseconds)
            sendMessage(null, `🏁 ${p.name} has a New Personal Best!`)
        }

        // Delete checkpoint and times
        setStats(p, "cpX", null)
        setStats(p, "cpY", null)
        setStats(p, "started", null)
        setStats(p, "stopped", null)
    })
}

export const finishedIds = new Set()  // id's of players in endzone

export const inEndZone = (p: PlayerObject) => {
    const pos = room.getPlayerDiscProperties(p.id)
    return ((pos.x > currentMap.bounds.x[0]) && (pos.x < currentMap.bounds.x[1])
        && (pos.y > currentMap.bounds.y[0]) && (pos.y < currentMap.bounds.y[1]) && (!finishedIds.has(p.id)))
}
