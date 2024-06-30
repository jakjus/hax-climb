import Keyv from "keyv";
// @ts-ignore
import { AsyncDatabase as Database } from "promised-sqlite3";
import { createTables } from "../../src/db";


const inputDbFilename = 'db.sqlite'
const outputDbFilename = 'dbnew.sqlite'


export const keyv = new Keyv('sqlite://'+inputDbFilename)
keyv.on('error', err => console.log('Keyv Error:', err));

// Appends v1 db data to new db scheme. 
// Can be used to merged multiple databases by defining different input.
const append = async () => {
    // Create new db
    try {
      await createTables(outputDbFilename)
    } catch(e) {
      console.error(e)
    }
    const db = await Database.open(outputDbFilename)
    for await (const [key, value] of keyv.iterator()) {
        console.log('pre:', key, value)
        // Add into `players`
        try {
          await db.run('INSERT INTO players(auth, name, points) VALUES (?, ?, ?)', [value.auth, value.name, value.points])
        } catch(e) {
          console.error(e, 'Skipping...')
          continue
        }
        const mapStats = value.mapStats
        Object.keys(mapStats).forEach(async (mapSlug: string) => {
          // Convert to INTEGER
          const started = new Date(mapStats[mapSlug].started).getTime()
          const stopped = new Date(mapStats[mapSlug].stopped).getTime()
          const bestTime = new Date(mapStats[mapSlug].bestTime).getTime()
          const row = await db.get('SELECT id FROM players WHERE auth=?', [value.auth])
          console.log('rowis', row)
          // @ts-ignore
          await db.run('INSERT INTO stats(playerId, mapSlug, started, stopped, finished, cpX, cpY, bestTime) VALUES (?,?,?,?,?,?,?,?)', [row['id'], mapSlug, started, stopped, mapStats[mapSlug].finished, mapStats[mapSlug].checkpoint?.x, mapStats[mapSlug].checkpoint?.y, bestTime])
         })
    };
}

append()
