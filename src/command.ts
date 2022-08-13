import { sendMessage } from "./message"
export const isCommand = (msg: string) => msg.trim().startsWith("!")
export const handleCommand = (room: RoomObject, p: PlayerObject, msg: string) => {
    let commandText = msg.trim().slice(1)
    let commandName = commandText.split(" ")[0]
    let commandArgs = commandText.split(" ").slice(1)
    if (commands[commandName]) {
        commands[commandName](p, commandArgs)
    } else {
        sendMessage(room, p, "Command not found.")
    }
}

type commandFunc = (p: PlayerObject, args: Array<string>) => void
const commands: { [key: string]: commandFunc } = {
    cp: (p: PlayerObject) => console.log(p)
}
