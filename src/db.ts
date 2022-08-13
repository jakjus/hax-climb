import Keyv from "keyv";

export const keyv = new Keyv('sqlite://db.sqlite')
keyv.on('error', err => console.log('Keyv Error:', err));
