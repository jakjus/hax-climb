import * as maps from "./maps/maplist";
import { room } from "../index";
import { toAug, getStats, updateTime } from "./utils";
import { loadCheckpoint } from "./checkpoint";
import { sendMessage } from "./message";
import { mapDurationMins } from "./settings";


export interface ClimbMap {
    slug: string,
    estimatedTimeMins: number,
    bounds: { x: number[], y: number[] },
    map: any,
}

let loadedMaps: Array<ClimbMap> = []

export let currentMap: ClimbMap; 
let mapCounter: number;
let mapStarted: Date;
let maxMaps: number;

let getCurrentMap = () => loadedMaps[mapCounter%maxMaps]
let getNextMap = () => loadedMaps[(mapCounter+1)%maxMaps]

export const initMapCycle = () => {
    Object.values(maps).forEach((m: ClimbMap) => loadedMaps.push(m))
    maxMaps = loadedMaps.length
    mapCounter = -1;
    changeMap()
}

let diffSecs: number;
export const changeMap = async () => {
    room.getPlayerList().forEach(po => {
        let pAug = toAug(po)
        getStats(pAug).stopped = new Date()
    })
    mapCounter += 1
    currentMap = await getCurrentMap()
    mapStarted = new Date()
    room.stopGame()
    room.setCustomStadium(JSON.stringify(currentMap.map))
    room.startGame()
    room.getPlayerList().forEach(po => {
        let pAug = toAug(po)
        if (!getStats(pAug) || !getStats(pAug).started) {
            pAug.mapStats = {...pAug.mapStats, [currentMap.slug]: {started: new Date(), finished: false}}
        }
        updateTime(pAug)
        loadCheckpoint(pAug)
    })
    announced = 0
}

let announced = 0
const checkTimer = () => {
    diffSecs = mapDurationMins*60 - ((new Date().getTime() - mapStarted.getTime())/1000)
    if (process.env.DEBUG) {
        console.log(diffSecs)
    }
    let diffMins = Math.ceil(diffSecs/60)
    if (announced == 0 && diffSecs < 15*60) {
        sendMessage(null, `${diffMins} minutes left. Next map: ${getNextMap().map.name}`)
        announced += 1
    }
    if (announced == 1 && diffSecs < 5*60) {
        sendMessage(null, `${diffMins} minutes left. Next map: ${getNextMap().map.name}`)
        announced += 1
    }
    if (announced == 2 && diffSecs < 1*60) {
        sendMessage(null, `${diffMins} minutes left. Next map: ${getNextMap().map.name}`)
        announced += 1
    }
    if (announced == 3 && diffSecs < 15) {
        sendMessage(null, `${Math.ceil(diffSecs)} seconds left. Next map: ${getNextMap().map.name}. "!save" your progress now.`)
        announced += 1
    }
    if (diffSecs < 0) {
        sendMessage(null, `Changing map: ${getNextMap().map.name}`)
        changeMap()
    }
}

setInterval(checkTimer, 5000)
