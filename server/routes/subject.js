import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import Subject from '../models/Subject.js'
import { requireRole } from '../middlewares/auth.js'


const router = express.Router()

router.post('/create', async (req, res) => {
    const { code, name, semesterNo, fe, pe } = req.body;

    try {
        const subject = await Subject.create({
            code: code,
            name: name,
            semesterNo: parseInt(semesterNo),
            fe: parseInt(fe),
            pe: parseInt(pe)
        })
        console.log(subject);
        res.json(DataResponse(subject))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router
//add xong