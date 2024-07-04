import { currentMap } from "./mapchooser"
import { room, db, idToAuth } from "../index"

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const isInGame = (p: PlayerObject) => p.team == 1 || p.team == 2
interface ReadPlayer {
  id: number,
  name: string,
  points: number,
}

export const getOrCreatePlayer = async (p: PlayerObject): Promise<ReadPlayer> => {
  const auth = idToAuth[p.id]
  const playerInDb = await db.get('SELECT * FROM players WHERE auth=?', [auth])
  if (!playerInDb) {
      const res = await db.run('INSERT INTO players(auth, name, points) VALUES (?, ?, ?)', [p.auth, p.name, 0]) 
      const newPlayer = { id: res.lastID, name: p.name, points: 0 }
      return newPlayer
  }
  return playerInDb
}

export const getStats = async (p: PlayerObject) => {
  const playerInDb = await getOrCreatePlayer(p)
  const stats = await db.get('SELECT * FROM stats WHERE playerId=? AND mapSlug=?', [playerInDb.id, currentMap.slug])
  return stats
}

export const updateTime = async (p: PlayerObject): Promise<void> => {
    const stats = await getStats(p)
    const dateNow = new Date().getTime()
    if (stats.started && stats.stopped) {
      console.log('there is started and stopped')
        const timeSpent = stats.stopped - stats.started
        console.log('timeSpent', timeSpent)
        await setStats(p, "started", dateNow - timeSpent) 
        await setStats(p, "stopped", null)
    } else if (!stats.started) {
        await setStats(p, "started", dateNow) 
    }
}

export const setStats = async (p: PlayerObject, key: string, value: any): Promise<void> => {
  const auth = idToAuth[p.id]
  const playerInDb = await db.get('SELECT id FROM players WHERE auth=?', [auth])
  const query = 'UPDATE stats SET '+key+'=? WHERE playerId=? AND mapSlug=?'
  await db.run(query, [value, playerInDb.id, currentMap.slug])
}

export const msToHhmmss = (ms: number | undefined): string => {
    if (!ms) { return '-' }
    const hours = Math.floor(ms / (1000 * 60 * 60));
    ms %= (1000 * 60 * 60);
    
    const minutes = Math.floor(ms / (1000 * 60));
    ms %= (1000 * 60);
    
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;

    // Ensure two digits for hours, minutes, and seconds, and three digits for milliseconds
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    // Return the formatted string
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}

export const addTransparency = (p: PlayerObject) => {
    let cf = room.CollisionFlags
    // @ts-ignore
    room.setPlayerDiscProperties(p.id, {cGroup: cf.c1})
}
