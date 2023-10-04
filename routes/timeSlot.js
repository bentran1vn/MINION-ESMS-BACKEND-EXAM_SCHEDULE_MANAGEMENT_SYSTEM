import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'

const router = express.Router()

router.post('/create', async (req, res) => {
    const { startTime, endTime } = req.body;
    // const startTime = req.body.startTime
    // const endTime = req.body.endTime
    console.log(startTime, endTime)

    try {
        const timeSlot = await TimeSlot.create({
            startTime: startTime,
            endTime: endTime
        })
        console.log(timeSlot);
        res.json(DataResponse(timeSlot))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/getAll', async (req, res) => {
    //get All timeSlot
    try {
        const timeSlots = await TimeSlot.findAll();
        if (!timeSlots) {
            res.json(NotFoundResponse());
        } else {
            res.json(DataResponse(timeSlots));
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

router.get('/getMultipleId', async (req, res) => {
    //tìm theo id khi người dùng nhập dạng "id" = "1,2,3,4,5,6,7"
    const id = req.body.id.split(',');
    console.log(id);
    try {
        const timeSlots = await TimeSlot.findAll({
            where: {
                id: {
                    [Op.or]: id
                }
            }
        }
        );
        if (!timeSlots) {
            res.json(NotFoundResponse());
        } else {
            res.json(DataResponse(timeSlots));
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

router.get('/', async (req, res) => {
    // get all timeslot like % startTime
    // const id = parseInt(req.body.id);
    const startTime = req.body.startTime;

    try {
        const timeSlots = await TimeSlot.findAll({
            where: {
                startTime: {
                    [Op.like]: '%' + startTime
                }
            }
        })
        if (!timeSlots) {
            res.json(NotFoundResponse())
        } else {
            res.json(DataResponse(timeSlots));
        }
    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse());
    }
})

router.delete('/delete', async (req, res) => {
    //delete timeSlot
    const id = parseInt(req.body.id);
    try {
        const rowAffected = await TimeSlot.destroy({
            where: {
                id: id
            }
        })
        if (rowAffected === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('TimeSlot deleted'));
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})

router.delete('/deleteAll', async (req, res) => {
    //delete all timeslot
    try {
        const rowAffected = await TimeSlot.destroy({
            where: {}
        });
        if (rowAffected === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('All timeSlots deleted'));
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})


router.put('/', async (req, res) => {
    //update time slot theo id
    const id = parseInt(req.body.id)
    const timeSlotData = req.body;

    try {
        const rowAffected = await TimeSlot.update(timeSlotData, {
            where: {
                id: id,
            }
        })
        if (rowAffected[0] === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('Time slot updated'))
        }

    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse())
    }
})
export default router
//add xong