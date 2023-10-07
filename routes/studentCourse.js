import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Course from '../models/Course.js'
import Student from '../models/Student.js'
import StudentCourse from '../models/StudentCourse.js'

const router = express.Router()

router.post('/', async (req, res) => {
    const courId = parseInt(req.body.courId);
    const stuId = parseInt(req.body.stuId);

    try {
        const course = await Course.findOne({
            where: {
                id: courId
            }
        })
        const student = await Student.findOne({
            where: {
                id: stuId
            }
        })
        if (!course || !student) {
            res.json(NotFoundResponse());
            return;
        } else {
            const studentCourse = await StudentCourse.create({
                courId: courId,
                stuId: stuId
            })
            console.log(studentCourse);
            res.json(DataResponse(studentCourse))
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router