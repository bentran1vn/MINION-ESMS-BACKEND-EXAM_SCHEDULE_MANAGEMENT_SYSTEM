import Room from '../models/Room.js'

export async function findAll() {
    const rooms = await Room.findAll()
    if (rooms === null) {
        throw new Error("Can not find any room")
    }
    return rooms
}