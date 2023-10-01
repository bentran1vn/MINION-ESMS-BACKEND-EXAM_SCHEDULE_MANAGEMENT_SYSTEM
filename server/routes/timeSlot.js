import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const { startTime, endTime } = req.body;
    // const startTime = req.body.startTime
    // const endTime = req.body.endTime
    console.log(startTime, endTime)

    try {
        const timeSlot = await TimeSlot.create({
            startTime: startTime,
            endTime: endTime
        })
        console.log(timeSlot);
        res.json(DataResponse(timeSlot))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router
//add xong