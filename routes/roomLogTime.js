import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import RoomLogTime from '../models/RoomLogTime.js'
import Room from '../models/Room.js'
import TimeSlot from '../models/TimeSlot.js'


const router = express.Router()

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
            res.json(DataResponse(roomLogTime))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router