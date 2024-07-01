import { Headless } from "haxball.js"
import { isCommand, handleCommand } from "./src/command"
import { playerMessage } from "./src/message"
import { loadCheckpoint, handleAllFinish } from "./src/checkpoint"
import { toAug, addTransparency, getStats, setStats, updateTime } from "./src/utils"
import { welcomePlayer } from "./src/welcome"
import { initMapCycle, currentMap } from "./src/mapchooser"
import { AsyncDatabase as Database } from "promised-sqlite3";

export interface PlayerAugmented extends PlayerObject {
    bestTime: number,
    points: number,
}

export let players: { [playerId: number]: PlayerAugmented } = {}

export let room: RoomObject;

interface RoomArgs {
    roomName: string,
    token: string,
    geo?: { code: string; lat: number; lon: number; },
    password?: string,
    private?: boolean,
    proxy?: string,
}

export const db = Database.open('db.sqlite')


const roomBuilder = (HBInit: Headless, args: RoomArgs) => {
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
        const player = await db.get('SELECT id, name, points FROM players WHERE auth=?', [p.auth])
        const playerDefaults = { points: 0 }
        // @ts-ignore
        const stats = await db.get('SELECT bestTime, finished FROM stats WHERE playerId=?', [player.id])
        const playerMapDefaults = { started: new Date().getTime(), stopped: null, bestTime: null, finished: 0 }
        // @ts-ignore
        const pAug: PlayerAugmented = {...playerDefaults, ...playerMapDefaults, ...player[0], ...stats[0]}
        updateTime(pAug)
        loadCheckpoint(pAug)
        players[p.id] = pAug
        welcomePlayer(room, p)
    }

    room.onPlayerLeave = async p => {
        const db = await Database.open('db.sqlite')
        const playerInDb = await db.get('SELECT id FROM players WHERE auth=?', [p.auth])
        // save to db
        // @ts-ignore
        await db.run('UPDATE stats SET stopped=? WHERE playerId=?', [new Date().getTime(), playerInDb.id])
        delete players[p.id]
    }

    room.onPlayerChat = (p, msg) => {
        if (isCommand(msg)){
            handleCommand(toAug(p), msg)
            return false
        }
        playerMessage(toAug(p), msg)
        return false
    }

    room.onPlayerTeamChange = p => {
        toAug(p).team = p.team
        addTransparency(p)
    }

    room.onRoomLink = url => {
        console.log(`Room link: ${url}`)
    }
}

export default roomBuilder;
