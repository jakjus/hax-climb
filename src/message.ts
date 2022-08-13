export const sendMessage = (room: RoomObject, p: PlayerObject, msg: string) => {
    room.sendAnnouncement(msg, p.id)
}
