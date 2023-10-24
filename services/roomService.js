import { Op } from 'sequelize'
import Room from '../models/Room.js'

export async function findAll() {
    const rooms = await Room.findAll({
        where : {
            roomNum : {
                [Op.length] : {
                    [Op.gte] : 3
                }
            },
            status: {
                [Op.eq] : 1
            }
        }
    })
    if (rooms === null) {
        throw new Error("Can not find any room")
    }
    return rooms
}