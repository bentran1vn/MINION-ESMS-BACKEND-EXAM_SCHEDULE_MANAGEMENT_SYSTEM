import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Room from '../models/Room.js'
import RoomLogTime from '../models/RoomLogTime.js'
import { Op } from 'sequelize'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Rooms:
 *       type: object
 *       required:
 *          - roomNum
 *          - location
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          roomNum:
 *              type: integer
 *              description: The code number of a Room
 *          location:
 *              type: String
 *              description: The location of a room
 *       example:
 *           id: 1
 *           roomNum: 100
 *           location: CAMPUS
 */

/**
 * @swagger
 * tags:
 *    name: Rooms
 *    description: The Rooms managing API
 */

/**
 * @swagger
 * /rooms/:
 *   post:
 *     summary: Create a new Room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomNum:
 *                 type: integer
 *                 example: 101, 202 for a room, 3 for 3rd floor corridor
 *               location:
 *                 type: String
 *                 example: CAMPUS
 *           required:
 *             - roomNum
 *             - location
 *     responses:
 *       '200':
 *         description: Create Success !
 */

/**
 * @swagger
 * /rooms/:
 *   delete:
 *     summary: Delete a Room by room number
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomNum:
 *                 type: integer
 *                 example: 101, 202 for a room, 3 for 3rd floor corridor
 *           required:
 *             - roomNum
 *     responses:
 *       '200':
 *         description: Delete Success !
 */

/**
 * @swagger
 * /rooms/:
 *   put:
 *     summary: Update data to a Room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               roomNum:
 *                 type: integer
 *                 example: 101
 *               location:
 *                 type: String
 *                 example: XAVALO
 *               note:
 *                 type: integer
 *                 example: 0
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Update Success! | Not Found!
 *       '500':
 *         description: Internal Server Error!
 */

/**
 * @swagger
 * /rooms/:
 *   get:
 *     summary: Return all Rooms
 *     tags: [Rooms]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Rooms'
 */

/**
 * @swagger
 * /rooms/roomInUse/:
 *   get:
 *     summary: Returns all the times that room was in use
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The room id Client want to get.
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Rooms'
 *       '500':
 *         description: Internal Server Error!
 */

/**
 * @swagger
 * /rooms/roomFreeSlot/:
 *   get:
 *     summary: Return all unused rooms for a day and 1 slot
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: day
 *         schema:
 *           type: DAYONLY
 *         required: true
 *         description: The day Client want to get like 2023-04-13.
 *       - in: query
 *         name: timeSlotId
 *         schema:
 *           type: TIME
 *         required: true
 *         description: The time id Client want to get like 1.
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Rooms'
 *       '500':
 *         description: Internal Server Error!
 */

/**
 * @swagger
 * /rooms/roomUseSlot/:
 *   get:
 *     summary: Return all rooms used in a day and 1 slot
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: day
 *         schema:
 *           type: DAYONLY
 *         required: true
 *         description: The day Client want to get like 2023-04-13.
 *       - in: query
 *         name: timeSlotId
 *         schema:
 *           type: TIME
 *         required: true
 *         description: The time id Client want to get like 1.
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Rooms'
 *       '500':
 *         description: Internal Server Error!
 */

/**
 * @swagger
 * /rooms/roomDamaged/:
 *   get:
 *     summary: Return all Rooms was damaged
 *     tags: [Rooms]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Rooms'
 */

/**
 * @swagger
 * /rooms/search/:
 *   get:
 *     summary: Return Rooms by roomNum or location
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: value
 *         schema:
 *           type: string or integter
 *         required: true
 *         description: The location or roomNum Client want to get
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Rooms'
 *       '500':
 *         description: Internal Server Error!
 */

router.post('/', async (req, res) => {
    const data = req.body

    try {
        const room = await Room.create({
            roomNum: parseInt(data.roomNum),
            location: data.location,
            note: 0
        })
        res.json(MessageResponse("Create Success !"))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})// Create new room

router.delete('/', async (req, res) => {
    const roomNum = parseInt(req.body.roomNum);

    try {
        const result = await Room.update({ status: 0 }, {
            where: {
                roomNum: roomNum,
                status: 1
            }
        })
        console.log(result);
        if (result === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('Delete Success !'))
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse());
    }
})// Delete room

router.put('/', async (req, res) => {
    const id = parseInt(req.body.id);
    const data = req.body;
    try {
        const row = await Room.update(data, {
            where: {
                id: id,
                status: 1
            }
        })
        if (row[0] == 0) {
            res.json(MessageResponse("Not Found !"));
            return;
        } else {
            res.json(MessageResponse("Update Success !"));
            return;
        }
    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse());
    }
})// Update room

router.get('/', async (req, res) => {
    try {
        const room = await Room.findAll({ where: { status: 1 } })
        const roomArr = []
        room.forEach(e => {
            const length = e.roomNum + ""
            if (length.length > 1) {
                roomArr.push(e)
            }
        });
        res.json(DataResponse(roomArr))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})// Get all room

router.get('/roomInUse', async (req, res) => {
    const roomId = parseInt(req.query.roomId)

    try {
        const roomLogTime = await RoomLogTime.findAll({
            where: {
                roomId: roomId
            }
        })
        res.json(DataResponse(roomLogTime))
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse());
    }
})// Get the time that the rooms was in use

router.get('/roomFreeSlot', async (req, res) => {
    const day = req.query.day;
    const timeSlotId = req.query.timeSlotId

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

        res.json(DataResponse(roomNotUse))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})// Get all unused rooms for a day and 1 slot

router.get('/roomUseSlot', async (req, res) => {
    const day = req.query.day;
    const timeSlotId = req.query.timeSlotId

    const roomIdInUse = []

    try {
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
            res.json(DataResponse(roomUse))
        } else {
            res.json(MessageResponse(`In day ${day} and slot id ${timeSlotId}, there are no occupied rooms`))
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})// Get all rooms used in a day and 1 slot

router.get('/roomDamaged', async (req, res) => {
    try {
        const room = await Room.findAll({ where: { status: 0 } })
        res.json(DataResponse(room))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})// Get all room was damaged

router.get('/search', async (req, res) => {
    try {
        var room = []
        const value = req.query.value
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
            res.json(DataResponse(room))
        } else {
            res.json(NotFoundResponse())
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})// Get room by roomNumer or location

export async function randomRoom() {
    let roomList = await Room.findAll({ where: { status: 1 } })
    let ranId = Math.floor(Math.random() * (roomList.length - 1)) + 1
    console.log("log Function ranId: " + ranId);
    let room = await Room.findOne({
        where: {
            id: ranId,
            status: 1
        }
    })
    return room
}

export default router
//add xong