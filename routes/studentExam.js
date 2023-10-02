import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamRoom from '../models/ExamRoom.js'
import Student from '../models/Student.js'
import StudentExam from '../models/StudentExam.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const eRId = parseInt(req.body.eRId);
    const stuId = parseInt(req.body.stuId);

    try {
        const examRoom = await ExamRoom.findOne({
            where: {
                id: eRId
            }
        })
        const student = await Student.findOne({
            where: {
                id: stuId
            }
        })
        if (!examRoom || !student) {
            res.json(NotFoundResponse());
            return;
        } else {
            const studentExam = await StudentExam.create({
                eRId: eRId,
                stuId: stuId
            })
            console.log(studentExam);
            res.json(DataResponse(studentExam))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router