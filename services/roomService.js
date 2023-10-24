import { Op } from 'sequelize'
import sequelize from '../database/database.js';
import Room from '../models/Room.js'

export async function findAll() {
    const rooms = await Room.findAll({
        where: sequelize.where(
            sequelize.fn('CHAR_LENGTH', sequelize.col('roomNum')),
            {
                [Op.gte]: 3, // Greater than or equal to 3
            }
        ),
        status: 1,
    });
    if (rooms.length === 0) {
        throw new Error("Can not find any room")
    }
    return rooms
}