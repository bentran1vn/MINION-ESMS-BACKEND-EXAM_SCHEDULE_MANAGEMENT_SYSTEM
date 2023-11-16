import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Room from '../models/Room.js'
import { createRoom, deleteRoom, findAll, getAllRoom, getRoomFreeSlot, getRoomInUse, getRoomUseSlot, searchRoom, updateRoom } from '../services/roomService.js'
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
 *              type: STRING
 *              description: The location of a room
 *          note:
 *              type: STRING
 *              description: The note about Room's status
 *          status:
 *              type: integer
 *              description: 1 is display, 0 is hide
 *       example:
 *           id: 1
 *           roomNum: 100
 *           location: CAMPUS
 *           note: ...
 *           status: 1
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
 *               note:
 *                 type: STRING
 *                 example: Burnt
 *                 discription: The status of Room
 *               status:
 *                 type: integer
 *                 discription: 0 is delete, 1 is display
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
 *           type: integer
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
 *           type: integer
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

router.post('/', requireRole('admin'), async (req, res) => {
    const data = req.body
    try {
        const result = await createRoom(data)
        res.json(MessageResponse(result))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Create new room

router.delete('/', requireRole('admin'), async (req, res) => {
    const roomNum = parseInt(req.query.roomNum);
    try {
        const result = await deleteRoom(roomNum);
        res.json(MessageResponse(result))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Delete room

router.put('/', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.body.id);
    const data = req.body;
    try {
        const result = await updateRoom(id, data);
        res.json(MessageResponse(result));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Update room


router.get('/roomInUse', async (req, res) => {
    const roomId = parseInt(req.query.roomId)
    try {
        const roomLogTime = await getRoomInUse(roomId)
        res.json(DataResponse(roomLogTime))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get the time that the rooms was in use

router.get('/roomFreeSlot', async (req, res) => {
    const day = req.query.day;
    const timeSlotId = req.query.timeSlotId

    try {
        const roomNotUse = await getRoomFreeSlot(day, timeSlotId)
        res.json(DataResponse(roomNotUse))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all unused rooms for a day and 1 slot

router.get('/roomUseSlot', async (req, res) => {
    const day = req.query.day;
    const timeSlotId = req.query.timeSlotId
    try {
        const result = await getRoomUseSlot(day, timeSlotId)
        if (Array.isArray(result)) {
            res.json(DataResponse(result))
        } else {
            res.json(MessageResponse(result))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all rooms used in a day and 1 slot

router.get('/roomDamaged', async (req, res) => {
    try {
        const room = await Room.findAll({ where: { status: 0 } })
        res.json(DataResponse(room))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all room was damaged

router.get('/search', async (req, res) => {
    const value = req.query.value
    try {
        const result = await searchRoom(value)
        if (Array.isArray(result)) {
            res.json(DataResponse(result))
        } else {
            res.json(MessageResponse(result))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get room by roomNumer or location


router.get('/', async (req, res) => {
    try {
        const roomArr = await Room.findAll();
        res.json(DataResponse(roomArr))

    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})
//requireRole("admin")
router.get('/:roomNum', async (req, res) => {
    try {
        const roomNum = req.params.roomNum;
        console.log(roomNum);

        const rooms = await Room.findAll({
            where: {
                roomNum: {
                    [Op.like]: `%${roomNum}%`
                }
            }
        })
        if (rooms.length == 0) {
            res.json(NotFoundResponse());
            return;
        } else {
            res.json(DataResponse(rooms));
            return;
        }

    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all room


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