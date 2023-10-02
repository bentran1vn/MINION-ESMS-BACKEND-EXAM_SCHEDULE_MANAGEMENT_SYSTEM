import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamSlot from '../models/ExamSlot.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const courId = parseInt(req.body.courId);
    const exSlId = parseInt(req.body.exSlId);

    try {
        const course = await Course.findOne({
            where: {
                id: courId
            }
        })
        const examSlot = await ExamSlot.findOne({
            where: {
                id: exSlId
            }
        })
        if (!course || !examSlot) {
            res.json(NotFoundResponse());
            return;
        } else {
            const subInSlot = await SubInSlot.create({
                courId: courId,
                exSlId: exSlId
            })
            console.log(subInSlot);
            res.json(DataResponse(subInSlot))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router