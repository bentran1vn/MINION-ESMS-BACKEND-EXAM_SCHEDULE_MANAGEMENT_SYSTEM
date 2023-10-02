import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Lecture from '../models/Lecturer.js'
import User from '../models/User.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const userId = parseInt(req.body.userId);
    const lecId = req.body.lecId;


    try {
        const user = await User.findOne({
            where: {
                id: userId
            }
        })
        if (!user) {
            res.json(NotFoundResponse());
            return;
        } else {
            const lecturer = await Lecture.create({
                userId: userId,
                lecId: lecId
            })
            console.log(lecturer);
            res.json(DataResponse(lecturer))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})
export default router
//add được