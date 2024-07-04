import { Headless } from "haxball.js"
import { isCommand, handleCommand } from "./src/command"
import { playerMessage } from "./src/message"
import { loadCheckpoint, handleAllFinish, finishedIds } from "./src/checkpoint"
import { addTransparency, updateTime, getOrCreatePlayer, getStats, setStats } from "./src/utils"
import { welcomePlayer } from "./src/welcome"
import { initMapCycle, currentMap } from "./src/mapchooser"
import { AsyncDatabase as Database } from "promised-sqlite3";

export let room: RoomObject;

interface RoomArgs {
    roomName: string,
    token: string,
    geo?: { code: string; lat: number; lon: number; },
    password?: string,
    private?: boolean,
    proxy?: string,
}

export let db: any;
export const idToAuth: { [key: number]: string } = {}  // auth in PlayerObject disappears after initial onPlayerJoin, therefore we need to map it

const roomBuilder = async (HBInit: Headless, args: RoomArgs) => {
    db = await Database.open('db.sqlite')
    db.inner.on("trace", (sql: any) => console.log("[TRACE]", sql));

    room = HBInit({
        roomName: args.roomName,
        maxPlayers: 29,
        playerName: "jakjus",
        password: args.password,
        public: !args.private,
        noPlayer: true,
        geo: args.geo,
        token: args.token,
        proxy: args.proxy,
    })

    room.setTimeLimit(0)
    room.setScoreLimit(0)
    initMapCycle()


    setInterval(() => handleAllFinish(), 200)


    room.onPlayerJoin = async p => {
      idToAuth[p.id] = p.auth
        await updateTime(p)
        await loadCheckpoint(p)
        await db.run('UPDATE players SET name=? WHERE auth=?', [p.name, p.auth])
        welcomePlayer(room, p)
    }

    room.onPlayerLeave = async p => {
      delete idToAuth[p.id]
        const stats = await getStats(p)
        if (stats && stats.started && !stats.stopped) {
          setStats(p, "stopped", new Date().getTime())
        }
        finishedIds.delete(p.id)
    }

    room.onPlayerChat = (p, msg) => {
        if (isCommand(msg)){
            handleCommand(p, msg)
            return false
        }
        playerMessage(p, msg)
        return false
    }

    room.onPlayerTeamChange = p => {
        addTransparency(p)
    }

    room.onRoomLink = url => {
        console.log(`Room link: ${url}`)
    }
}

export default roomBuilder;
