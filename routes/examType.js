import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamType from '../models/ExamType.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const { type, block, des } = req.body;

    try {
        const examType = await ExamType.create({
            type: type,
            block: parseInt(block),
            des: parseInt(des)
        })
        console.log(examType);
        res.json(DataResponse(examType))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router

//add được