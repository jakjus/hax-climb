import { Headless } from "haxball.js"
import { isCommand, handleCommand } from "./src/command"
import { playerMessage } from "./src/message"
import { loadCheckpoint, handleAllFinish } from "./src/checkpoint"
import { toAug, addTransparency } from "./src/utils"
import { welcomePlayer } from "./src/welcome"
import winkysChallenge from "./src/maps/winkys-challenge"
import { keyv } from "./src/db"

export interface PlayerAugmented extends PlayerObject {
    started: Date,
    checkpoint?: DiscPropertiesObject,
    finished: boolean,
    bestTime?: number,
    points: number,
}

export let players: { [playerId: number]: PlayerAugmented } = {}


interface RoomArgs {
    roomName: string,
    token: string,
    geo?: { code: string; lat: number; lon: number; },
    password?: string,
    private?: boolean,
}

const roomBuilder = (HBInit: Headless, args: RoomArgs) => {
    let room = HBInit({
        roomName: args.roomName,
        maxPlayers: 29,
        playerName: "jakjus",
        password: args.password,
        public: !args.private,
        geo: args.geo,
        token: args.token,
    })

    room.setTimeLimit(0)
    room.setScoreLimit(0)
    room.setCustomStadium(JSON.stringify(winkysChallenge))
    room.startGame()
    setInterval(() => handleAllFinish(room), 200)


    room.onPlayerJoin = async p => {
        let pAug: PlayerAugmented;
        // load from db
        let data = await keyv.get(p.auth)
        if (data) {
            pAug = {...data, ...p}
            if (!pAug.points) {
                pAug.points = 0
            }
            loadCheckpoint(room, pAug)
        } else {
            pAug = {started: new Date(), finished: false, points: 0, ...p}
        }
        players[p.id] = pAug
        welcomePlayer(room, p)
    }

    room.onPlayerLeave = p => {
        // save to db
        keyv.set(toAug(p).auth, toAug(p))
        delete players[p.id]
    }

    room.onPlayerChat = (p, msg) => {
        if (isCommand(msg)){
            handleCommand(room, toAug(p), msg)
            return false
        }
        playerMessage(room, toAug(p), msg)
        return false
    }

    room.onPlayerTeamChange = p => {
        toAug(p).team = p.team
        addTransparency(room, p)
    }

    room.onRoomLink = url => console.log(`Room link: ${url}`)
}

export default roomBuilder;
