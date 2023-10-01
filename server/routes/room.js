import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Rooms from '../models/Room.js'


const router = express.Router()

router.post('/create', async (req, res) => {
    const { roomNum, location } = req.body;

    try {
        const room = await Rooms.create({
            roomNum: parseInt(roomNum),
            location: location
        })
        console.log(room);
        res.json(DataResponse(room))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router
//add xong