import * as maps from "./maps/maplist";
import { room } from "../index";
import { toAug, getStats } from "./utils";
import { loadCheckpoint } from "./checkpoint";
import { sendMessage } from "./message";
import { mapDurationMins } from "./settings";


export interface ClimbMap {
    slug: string,
    estimatedTimeMins: number,
    bounds: { x: [left: number, right: number], y: [left: number, right: number] },
    map: any,
}

console.log("loaded maps are", maps)

let loadedMaps: Array<ClimbMap> = []

export let currentMap: ClimbMap; 
let mapCounter: number;
let mapStarted: Date;
let maxMaps = loadedMaps.length

let getCurrentMap = () => loadedMaps[mapCounter%maxMaps]
let getNextMap = () => loadedMaps[(mapCounter+1)%maxMaps]

export const initMapCycle = () => {
    Object.values(maps).forEach((m: ClimbMap) => console.log(m))
    mapCounter = 0;
    mapStarted = new Date()
}

export const changeMap = () => {
    mapCounter += 1
    currentMap = getCurrentMap()
    mapStarted = new Date()
    room.stopGame()
    room.setCustomStadium(JSON.stringify(currentMap.map))
    room.startGame()
    room.getPlayerList().forEach(po => {
        let pAug = toAug(po)
        if (!getStats(pAug)) {
            pAug = {...pAug, mapStats: {[currentMap.slug]: {started: new Date(), finished: false}}}
        }
        loadCheckpoint(pAug)
    })
    announced = 0
}

let announced = 0
const checkTimer = () => {
    console.log('check timer', new Date())
    let diffSecs = mapDurationMins*60 - ((new Date().getTime() - mapStarted.getTime())/1000)
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
    if (diffSecs < 0) {
        sendMessage(null, `Changing map: ${getNextMap().map.name}`)
        changeMap()
    }
}

setInterval(checkTimer, 5000)
