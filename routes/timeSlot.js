import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'

const router = express.Router()

router.post('/', async (req, res) => {
    const { startTime, endTime } = req.body;
    // const startTime = req.body.startTime
    // const endTime = req.body.endTime

    try {
        const timeSlot = await TimeSlot.create({
            startTime: startTime,
            endTime: endTime
        })
        console.log(timeSlot);
        res.json(MessageResponse("Create Success !"))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/', async (req, res) => {
    //get All timeSlot nếu không nhập gì
    //get 1 theo id nếu có
    //trả ra 1 mảng mỗi phần tử gồm Stt / Id / STime / ETime
    const id = parseInt(req.body.id);
    let count = 1;
    const timeSlotItem = {
        id: "",
        timeSlot: ""
    }
    const timeSlotList = []
    try {
        if (id !== undefined && id !== null) {
            const timeSlot = await TimeSlot.findOne({
                where: {
                    id: id
                }
            })
            if (timeSlot) {
                res.json(DataResponse(timeSlot));
                timeSlotItem.id = 1
                timeSlotItem.timeSlot = timeSlot
                timeSlotList.push(timeSlotItem)
                res.json(DataResponse(timeSlotList))
            } else {
                res.json(MessageResponse("This id doesn't belong to any time slot"));
                return;
            }
        } else {
            const timeSlots = await TimeSlot.findAll();
            if (!timeSlots) {
                res.json(NotFoundResponse());
            } else {
                for (const key in timeSlots) {
                    if (Object.hasOwnProperty.call(timeSlots, key)) {
                        const element = timeSlots[key];
                        timeSlotItem.id = count++
                        timeSlotItem.timeSlot = element
                        timeSlotList.push(timeSlotItem)
                    }
                }
                res.json(DataResponse(timeSlotList))
            }
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

router.delete('/', requireRole("admin"), async (req, res) => {
    //delete timeSlot
    //nếu id có thì xóa 1 không thì xóa hết
    //nhớ bắt cảnh báo xác nhận xóa hết nếu không nhập gì
    const id = parseInt(req.body.id);
    try {
        if (id !== undefined && id !== null) {
            const rowAffected = await TimeSlot.destroy({
                where: {
                    id: id
                }
            })
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
            } else {
                res.json(MessageResponse('Delete Success !'));
            }
        } else {
            const rowAffected = await TimeSlot.destroy({
                where: {}
            })
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
            } else {
                res.json(MessageResponse('Delete Success !'));
            }
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
            res.json(MessageResponse('Update Success !'))
        }

    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse())
    }
})
export default router
//add xong