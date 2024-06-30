import Keyv from "keyv";
// @ts-ignore
import { AsyncDatabase as Database } from "promised-sqlite3";

export const keyv = new Keyv('sqlite://db.sqlite')

export const createTables = async (filename: string) => {
    const db = await Database.open(filename)
    const createStatements = [`CREATE TABLE "players" (
            "id"	INTEGER,
            "auth"	TEXT NOT NULL,
            "name"	TEXT,
            "points"	TEXT,
            PRIMARY KEY("id" AUTOINCREMENT)
    );`,
    `CREATE TABLE "stats" (
            "id"	INTEGER,
            "playerId"	INTEGER,
            "mapSlug"	TEXT,
            "started"	INTEGER,
            "stopped"	INTEGER,
            "finished"	INTEGER,
            "bestTime"	INTEGER,
            "cpX"	REAL,
            "cpY"	REAL,
            FOREIGN KEY("playerId") REFERENCES "players"("id"),
            PRIMARY KEY("id" AUTOINCREMENT)
    );
    `, 
    `CREATE UNIQUE INDEX auth ON players(auth)`,
    `CREATE INDEX mapSlug ON stats(mapSlug)`
    ]

    for (const t of createStatements) {
      await db.run(t)
    }
    await db.close()
}

keyv.on('error', err => console.log('Keyv Error:', err));
