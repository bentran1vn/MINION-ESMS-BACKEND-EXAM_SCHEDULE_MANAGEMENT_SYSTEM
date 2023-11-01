import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'
import Course from '../models/Course.js'

const router = express.Router()

router.post('/', async (req, res) => {
    const semesterId = req.body.semId
    const examPhase = ExamPhase.findOne({
        where: {
            semId : semesterId,
            status : 1
        }
    })
    const start = new Date(examPhase.startDay)
    const cur = new Date(timeFormatted);
    const timeDifference = Math.abs(start.getTime() - cur.getTime());
    const threeDay = Math.ceil(timeDifference / (1000 * 3600 * 24));

    if ((examPhase.startDay > timeFormatted && threeDay <= 3) || examPhase.startDay <= timeFormatted) {
        await ExamPhase.update({ status: 0 }, {
            where: {
                id: examPhase.id
            }
        })
        await Course.update({ status: 0 }, {
            where: {
                id: examPhase.id
            }
        })
    }   
})

export default router