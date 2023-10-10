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
 *     summary: Return all schedule of Room 
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *           required:
 *             - roomId
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
 *     summary: Return all Rooms free to use in 1 day 1 slot
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13 , 2023-05-23
 *               timeSlotId:
 *                 type: TIME
 *                 example: 09:30:00 , 07:30:00, 09:45:00
 *           required:
 *             - day
 *             - timeSlotId
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
 *     summary: Return all Rooms in use in 1 day 1 slot specifically
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13 , 2023-05-23
 *               timeSlotId:
 *                 type: TIME
 *                 example: 09:30:00 , 07:30:00, 09:45:00
 *           required:
 *             - day
 *             - timeSlotId
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
    const roomNum = parseInt(req.body.roomNum);
    const location = req.body.location;

    try {
        const room = await Room.create({
            roomNum: roomNum,
            location: location
        })
        res.json(MessageResponse("Create Success !"))

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
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('Delete Success !'))
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse());
    }
})

router.get('/', async (req, res) => {
    try {
        const room = await Room.findAll()
        res.json(DataResponse(room))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
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
        res.json(InternalErrResponse());
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
        res.json(InternalErrResponse());
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
        res.json(InternalErrResponse())
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