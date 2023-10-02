import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Rooms from '../models/Room.js'


const router = express.Router()

router.post('/', async (req, res) => {
    const roomNum = parseInt(req.body.roomNum);
    const location = req.body.location;

    try {
        const room = await Room.create({
            roomNum: roomNum,
            location: location
        })
        res.json(DataResponse(room))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.delete('/', async (req, res) => {
    const roomNum = parseInt(req.body.roomNum);

    try {
        const result = await Room.destroy({
            where: {
                roomNum: roomNum
            }
        })
        console.log(result);
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('Delete Success !'))
        }
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'));
    }
})

export default router
//add xong