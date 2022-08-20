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
let getNextMapName = () => nextMap?.map?.name || `[Not yet decided]`

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
    nextMap = undefined;
}

let announced = 0

type voteOption = { id: number, option: ClimbMap, votes: number }
export let voteOptions: voteOption[]

export let onlyVoteMessage = false

export const printOption = (vo: voteOption) => {
    if (vo.option.map.name == currentMap.map.name) {
        return `${vo.id}. Current map +10 minutes`
    }
    return `${vo.id}. ${vo.option.map.name}`
}
const startVoting = () => {
    onlyVoteMessage = true
    sendMessage(null, `🗳️ Vote for next map:`)
    let prolongOption = {id: 1, option: currentMap, votes: 0}
    voteOptions = [prolongOption]
    sendMessage(null, printOption(prolongOption))
    for (const [i, haxMap] of loadedMaps.filter(m => m.map.name != currentMap.map.name).entries()) {
        let opt = {id: i+2, option: haxMap, votes: 0}
        voteOptions.push(opt)
        sendMessage(null, printOption(opt))
    }
}

const endVoting = () => {
    let sorted = voteOptions.sort((a, b) => b.votes - a.votes)
    sendMessage(null, `🗳️ Voting ended. Results:`)
    for (let result of sorted) {
        sendMessage(null, `[${result.votes} votes] ${printOption(result)}`)
    }
    if (sorted[0].id == 1) {
        sendMessage(null, `Current map will be prolonged by 10 minutes.`)
        prolong()
    } else {
        sendMessage(null, `Next map has been set to: ${sorted[0].option.map.name}`)
        nextMap = sorted[0].option
    }
}

let nextMap: ClimbMap | undefined;
const prolong = () => {
    diffSecs = 15*60 - ((new Date().getTime() - mapStarted.getTime())/1000)
    announced = 0
    nextMap = undefined;
}

const checkTimer = () => {
    diffSecs = mapDurationMins*60 - ((new Date().getTime() - mapStarted.getTime())/1000)
    let diffMins = Math.ceil(diffSecs/60)
    if (announced == 0 && diffSecs < 10*60) {
        sendMessage(null, `${diffMins} minutes left. Next map: ${getNextMapName()}`)
        announced += 1
    }
    if (announced == 1 && diffSecs < 5*60) {
        sendMessage(null, `${diffMins} minutes left. Next map: ${getNextMapName()}`)
        startVoting()
        setTimeout(() => endVoting(), 20*1000)
        announced += 1
    }
    if (announced == 2 && diffSecs < 1*60) {
        sendMessage(null, `${diffMins} minutes left. Next map: ${getNextMapName()}`)
        announced += 1
    }
    if (announced == 3 && diffSecs < 15) {
        sendMessage(null, `${Math.ceil(diffSecs)} seconds left. Next map: ${getNextMapName()}. "!save" your progress now.`)
        announced += 1
    }
    if (diffSecs < 0) {
        sendMessage(null, `Changing map: ${getNextMapName()}`)
        changeMap()
    }
}

if (loadedMaps.length == 1){
    sendMessage(null, `Only one map loaded. Map chooser disabled.`)
} else {
    setInterval(checkTimer, 5000)
}
