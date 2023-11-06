import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import RoomLogTime from '../models/RoomLogTime.js'
import Room from '../models/Room.js'
import TimeSlot from '../models/TimeSlot.js'


const router = express.Router()

//Swagger Model
/**
 * @swagger
 * components:
 *   schemas:
 *    RoomLogTimes:
 *       type: object
 *       required:
 *          - roomId
 *          - day
 *          - timeSlotId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          roomId:
 *              type: integer
 *              description: Reference to Room id
 *          day:
 *              type: DATEONLY
 *              description: 2023-04-14 , 2023-08-23
 *          timeSlotId:
 *              type: integer
 *              description: Reference to TimeSlot id
 *       example:
 *           id: 1
 *           roomId: 1
 *           day: 2023-04-13
 *           timeSlotId: 1
 */

//Swagger Tag
/**
 * @swagger
 * tags:
 *    name: RoomLogTimes
 *    description: The RoomLogTimes managing API
 */

//Swagger Post
/**
 * @swagger
 * /roomLogTimes/:
 *   post:
 *     summary: Create a new RoomLogTime
 *     tags: [RoomLogTimes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-23, 2029-02-28
 *               timeSlotId:
 *                 type: integer
 *                 example: 1, 2, 3
 *           required:
 *             - roomId
 *             - day
 *             - timeSlotId
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *         description: Internal Server Error !
 */

router.post('/', async (req, res) => {
    const { roomId, day, timeSlotId } = req.body;

    try {
        const room = await Room.findOne({
            where: {
                id: parseInt(roomId),
            }
        })
        const timeOfSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(timeSlotId)
            }
        })
        if (!room || !timeOfSlot) {
            res.json(NotFoundResponse())
            return;
        } else {
            const roomLogTime = await RoomLogTime.create({
                roomId: parseInt(roomId),
                day: day,
                timeSlotId: parseInt(timeSlotId)
            })
            console.log(roomLogTime);
            res.json(MessageResponse("Create Success !"))
        }

    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

export default router