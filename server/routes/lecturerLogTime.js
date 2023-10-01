import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import LecturerLogTime from '../models/LecturerLogTime.js'
import Lecturer from '../models/Lecturer.js'
import TimeSlot from '../models/TimeSlot.js'


const router = express.Router()

router.post('/create', async (req, res) => {
    const { lecturerId, day, timeSlotId } = req.body;

    try {
        const lecturer = await Lecturer.findOne({
            where: {
                id: parseInt(lecturerId),
            }
        })
        const timeOfSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(timeSlotId)
            }
        })
        if (!lecturer || !timeOfSlot) {
            res.json(NotFoundResponse())
            return;
        } else {
            const lecturerLogTime = await LecturerLogTime.create({
                lecturerId: parseInt(lecturerId),
                day: day,
                timeSlotId: parseInt(timeSlotId)
            })
            console.log(lecturerLogTime);
            res.json(DataResponse(lecturerLogTime))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router