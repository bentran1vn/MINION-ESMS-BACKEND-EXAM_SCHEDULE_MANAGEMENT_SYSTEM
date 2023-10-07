import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Room from '../models/Room.js'
import RoomLogTime from '../models/RoomLogTime.js'
import { Op } from 'sequelize'

const router = express.Router()

router.post('/', async (req, res) => {
    const roomNum = parseInt(req.body.roomNum);
    const location = req.body.location;

    try {
        const room = await Room.create({
            roomNum: roomNum,
            location: location
        })
        res.json(DataResponse(room))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.delete('/', async (req, res) => {
    const roomNum = parseInt(req.body.roomNum);

    try {
        const result = await Room.destroy({
            where: {
                roomNum: roomNum
            }
        })
        console.log(result);
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('Delete Success !'))
        }
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'));
    }
})

router.get('/', async (req, res) => {
    const room = await Room.findAll()
    res.json(DataResponse(room))
})// Get all room

router.get('/roomInUse', async (req, res) => {
    const roomId = parseInt(req.body.roomId)

    try {
        const roomLogTime = await RoomLogTime.findAll({
            where: {
                roomId: roomId
            }
        })
        res.json(DataResponse(roomLogTime))
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'));
    }
})// Get room has been used in day + which slots

router.get('/roomFreeSlot', async (req, res) => {
    const { day, timeSlotId } = req.body
    const roomIdInUse = []
    const roomIdNotUse = []

    try {
        const roomLogTime = await RoomLogTime.findAll({
            where: {
                [Op.and]: {
                    day: day,
                    timeSlotId: timeSlotId
                }
            }
        })
        const room = await Room.findAll()

        for (let i = 0; i < roomLogTime.length; i++) {
            const index = roomIdInUse.indexOf(roomLogTime[i].roomId);

            if (index === -1) {
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
                }
            }
        })

        res.json(DataResponse(roomNotUse))
    } catch (error) {
        console.log(error);
        res.json(MessageResponse("Error found"))
    }
})// Get room not in use in 1 day and slot

router.get('/roomUseSlot', async (req, res) => {
    const { day, timeSlotId } = req.body
    const roomIdInUse = []
    const roomIdUseInSLot = []

    try {
        const roomLogTime = await RoomLogTime.findAll({
            where: {
                [Op.and]: {
                    day: day,
                    timeSlotId: timeSlotId
                }
            }
        })
        const room = await Room.findAll()

        for (let i = 0; i < roomLogTime.length; i++) {
            const index = roomIdInUse.indexOf(roomLogTime[i].roomId);

            if (index === -1) {
                roomIdInUse.push(roomLogTime[i].roomId);
            }
        }

        room.forEach(element => {
            if (roomIdInUse.includes(element.id)) {
                roomIdUseInSLot.push(element.id)
            }
        });

        const roomUse = await Room.findAll({
            where: {
                id: {
                    [Op.or]: roomIdUseInSLot
                }
            }
        })

        res.json(DataResponse(roomUse))
    } catch (error) {
        console.log(error);
        res.json(MessageResponse("Error found"))
    }
})// Get room in use in 1 day and 1 slot specifically

export async function randomRoom() {
    let roomList = await Room.findAll()
    let ranId = Math.floor(Math.random() * (roomList.length - 1)) + 1
    console.log("log Function ranId: " + ranId);
    let room = await Room.findOne({
        where: {
            id: ranId
        }
    })
    return room
}

export default router
//add xong