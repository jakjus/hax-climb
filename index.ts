import { Headless } from "haxball.js"
import { isCommand, handleCommand } from "./src/command"
import { playerMessage } from "./src/message"
import { loadCheckpoint, handleAllFinish } from "./src/checkpoint"
import { toAug, addTransparency, getStats, setStats, updateTime } from "./src/utils"
import { welcomePlayer } from "./src/welcome"
import { keyv } from "./src/db"
import { initMapCycle, currentMap } from "./src/mapchooser"

export interface PlayerMapStats {
    started: Date,
    checkpoint?: DiscPropertiesObject,
    finished: boolean,
    bestTime?: number,
    stopped?: Date,
}

export interface PlayerAugmented extends PlayerObject {
    mapStats: { [mapName: string]: PlayerMapStats },
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
}

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
    })

    room.setTimeLimit(0)
    room.setScoreLimit(0)
    initMapCycle()


    setInterval(() => handleAllFinish(), 200)


    room.onPlayerJoin = async p => {
        let pAug: PlayerAugmented;
        // load from db
        let data = await keyv.get(p.auth)
        if (data) {
            pAug = {...data, ...p}
            if (!pAug.points) {
                pAug.points = 0
            }
            if (!getStats(pAug).started) {
                setStats(pAug, "started", new Date())
            }
            if (getStats(pAug).finished === undefined) {
                setStats(pAug, "finished", false)
            }
            updateTime(pAug)
            loadCheckpoint(pAug)
        } else {
            pAug = {mapStats: {[currentMap.slug]: {started: new Date(), finished: false}}, points: 0, ...p}
        }
        players[p.id] = pAug
        welcomePlayer(room, p)
    }

    room.onPlayerLeave = async p => {
        let pAug = toAug(p)
        await setStats(pAug, "stopped", new Date())
        // save to db
        keyv.set(pAug.auth, toAug(p))
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
        addTransparency(room, p)
    }

    room.onRoomLink = url => {
        console.log(`Room link: ${url}`)
    }
}

export default roomBuilder;
