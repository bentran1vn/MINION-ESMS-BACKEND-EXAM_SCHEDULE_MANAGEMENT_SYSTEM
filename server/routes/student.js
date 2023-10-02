import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import User from '../models/User.js'
import { requireRole } from '../middlewares/auth.js'
import Student from '../models/Student.js'


const router = express.Router()

router.post('/create', async (req, res) => {
    const { userId, uniId, semester, major } = req.body;

    try {
        const user = await User.findOne({
            where: {
                id: parseInt(userId),
            }
        })

        if (!user) {
            res.json(NotFoundResponse())
            return;
        } else {
            const student = await Student.create({
                userId: parseInt(userId),
                uniId: uniId,
                semester: parseInt(semester),
                major: major
            })
            console.log(student);
            res.json(DataResponse(student))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }   
})

export default router
//add xong