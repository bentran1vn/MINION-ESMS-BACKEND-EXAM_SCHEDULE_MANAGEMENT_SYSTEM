import { Op } from 'sequelize'
import sequelize from '../database/database.js';
import Room from '../models/Room.js'
import ExamPhase from '../models/ExamPhase.js';
import RoomLogTime from '../models/RoomLogTime.js';
import ExamRoom from '../models/ExamRoom.js'
import Semester from '../models/Semester.js';
import ExamSlot from '../models/ExamSlot.js';
import SubInSlot from '../models/SubInSlot.js';

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

export async function createRoom(data) {
    let message = ""
    const findRoom = await Room.findOne({
        where: {
            roomNum: parseInt(data.roomNum),
            location: data.location,
        }
    })
    if (findRoom) {
        Room.update({ status: 1 }, {
            where: {
                id: findRoom.id,
                status: 0
            }
        })
        if (findRoom.status == 1) {
            throw new Error('Room exist !')
        }
    } else {
        const result = await Room.create({
            roomNum: parseInt(data.roomNum),
            location: data.location,
            note: 0
        })
        if (result) {
            return message = "Create Success !"
        } else {
            return message = "Add fail !"
        }
    }
}

export async function deleteRoom(roomId) {
    const result = await Room.update({ status: 0 }, {
        where: {
            id: parseInt(roomId),
            status: 1
        }
    })
    if (result[0] == 0) {
        throw new Error("Not found")
    } else {
        return 'Delete Success !'
    }
}

export async function updateRoom(id, data) {
    const row = await Room.update(data, {
        where: {
            id: id,
            status: 1
        }
    })
    if (row[0] == 0) {
        throw new Error("Not Found !")
    } else {
        return "Update Success !";
    }
}

export async function getAllRoom() {
    const currentDay = new Date().toISOString().slice(0, 10)
    const room = await Room.findAll()

    //nếu hiện tại k trong sem, chưa có phòng bận => tất cả được xóa
    let roomNotInSemester = [];
    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: currentDay },
            end: { [Op.gte]: currentDay },
        }
    })
    for (const rooom of room) {
        if (semester) {
            const r = {
                roomNum: rooom.dataValues.roomNum,
                location: rooom.dataValues.location,
                note: rooom.dataValues.note || "N/A",
                status: rooom.dataValues.status,
                delete: 0//không được xóa
            }
            roomNotInSemester.push(r)
        } else {
            const r = {
                roomNum: rooom.dataValues.roomNum,
                location: rooom.dataValues.location,
                note: rooom.dataValues.note || "N/A",
                status: rooom.dataValues.status,
                delete: 1//được xóa
            }
            roomNotInSemester.push(r)
        }
    }
    return roomNotInSemester;
}

export async function getRoomInUse(roomId) {
    const roomLogTime = await RoomLogTime.findAll({
        where: {
            roomId: roomId
        }
    })
    return roomLogTime
}

export async function getRoomFreeSlot(day, timeSlotId) {
    const roomIdInUse = []
    const roomIdNotUse = []
    const roomLogTime = await RoomLogTime.findAll({
        where: {
            [Op.and]: {
                day: day,
                timeSlotId: timeSlotId
            }
        }
    })
    const room = await Room.findAll({ where: { status: 1 } })

    for (let i = 0; i < roomLogTime.length; i++) {
        if (!roomIdInUse.includes(roomLogTime[i].roomId)) {
            roomIdInUse.push(roomLogTime[i].roomId);
        }
    }

    room.forEach(element => {
        if (!roomIdInUse.includes(element.id)) {
            roomIdNotUse.push(element.id)
        }
    });

    const roomNotUse = await Room.findAll({
        where: {
            id: {
                [Op.or]: roomIdNotUse
            },
            status: 1
        }
    })
    return roomNotUse
}

export async function getRoomUseSlot(day, timeSlotId) {
    const roomIdInUse = []
    const roomLogTime = await RoomLogTime.findAll({
        where: {
            [Op.and]: {
                day: day,
                timeSlotId: timeSlotId
            }
        }
    })
    if (roomLogTime.length > 0) {
        for (let i = 0; i < roomLogTime.length; i++) {
            if (!roomIdInUse.includes(roomLogTime[i].roomId)) {
                roomIdInUse.push(roomLogTime[i].roomId);
            }
        }

        const roomUse = await Room.findAll({
            where: {
                id: {
                    [Op.or]: roomIdInUse
                },
                status: 1
            }
        })
        return roomUse
    } else {
        return `In day ${day} and slot id ${timeSlotId}, there are no occupied rooms`
    }
}

export async function searchRoom(value) {
    var room = []

    if (Number.isInteger(parseInt(value))) {
        room = await Room.findAll({
            where: {
                roomNum: parseInt(value),
                status: 1
            }
        })
    } else {
        room = await Room.findAll({
            where: {
                location: {
                    [Op.like]: '%' + value + '%'
                },
                status: 1
            }
        })
    }
    if (room.length) {
        return room
    } else {
        return "Not found"
    }
}
