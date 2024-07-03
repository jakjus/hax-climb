import { Headless } from "haxball.js"
import { isCommand, handleCommand } from "./src/command"
import { playerMessage } from "./src/message"
import { loadCheckpoint, handleAllFinish } from "./src/checkpoint"
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
        // load from db
        const playerInDb = await getOrCreatePlayer(p)
        await db.run('UPDATE players SET name=? WHERE auth=?', [p.name, p.auth])
        // @ts-ignore
        const stats = await db.get('SELECT bestTime, started, stopped, finished FROM stats WHERE playerId=? AND mapSlug=?', [playerInDb.id, currentMap.slug])
        const playerMapDefaults = { started: new Date().getTime(), stopped: null, bestTime: null, finished: 0 }
        // @ts-ignore
        const pAug: PlayerAugmented = {...playerMapDefaults, ...playerInDb, ...stats, ...p}
        if (!stats.started && !stats.finished) {
            setStats(pAug, "started", new Date().getTime())
        }
        updateTime(pAug, stats)
        loadCheckpoint(pAug)
        welcomePlayer(room, p)
    }

    room.onPlayerLeave = async p => {
        const stats = await getStats(p)
        if (!stats.finished && stats?.started && stats?.stopped) {
          // if he finished, no need to update "stopped".
          setStats(p, "stopped", new Date().getTime())
        }
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
