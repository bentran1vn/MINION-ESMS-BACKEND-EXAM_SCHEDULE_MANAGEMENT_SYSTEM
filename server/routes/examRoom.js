import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Room from '../models/Room.js'
import Lecturer from '../models/Lecturer.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import { createNewSemester } from './semester.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const sSId = parseInt(req.body.sSId);
    const roomId = parseInt(req.body.roomId);
    const lecturerId = parseInt(req.body.lecturerId);
    const regisTime = req.body.regisTime

    try {
        const subInSlot = await SubInSlot.findOne({
            where: {
                id: sSId
            }
        })
        const room = await Room.findOne({
            where: {
                id: roomId
            }
        })
        const lecturer = await Lecturer.findOne({
            where: {
                id: lecturerId
            }
        })
        if (!subInSlot || !room || !lecturer) {
            res.json(NotFoundResponse());
            return;
        } else {
            const examRoom = await ExamRoom.create({
                sSId: sSId,
                roomId: roomId,
                lecturerId: lecturerId,
                regisTime: regisTime
            })
            console.log(examRoom);
            res.json(DataResponse(examRoom))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router