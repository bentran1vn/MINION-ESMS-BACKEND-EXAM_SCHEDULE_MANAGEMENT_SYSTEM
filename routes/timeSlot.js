import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    TimeSlots:
 *       type: object
 *       required:
 *          - startTime
 *          - endTime
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          startTime:
 *              type: TIME
 *              description: The start time of 1 slot
 *          endTime:
 *              type: TIME
 *              description: The end time of 1 slot
 *       example:
 *           id: 1
 *           startTime: 07:30:00
 *           endTime: 09:00:00
 */

/**
 * @swagger
 * tags:
 *    name: TimeSlots
 *    description: The TimeSlots managing API
 */

/**
 * @swagger
 * /timeSlots/:
 *   post:
 *     summary: Create a new TimeSlot
 *     tags: [TimeSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:00
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *           required:
 *             - startTime
 *             - endTime
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /timeSlots/:
 *   get:
 *     summary: Return all TimeSlots, Return a TimeSlot by id
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: false
 *         description: The time slot id Client want to get.             
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/TimeSlots'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /timeSlots/:
 *   delete:
 *     summary: Delete all TimeSlots, Delete a TimeSlot by id required Admin role
 *     tags: [TimeSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4... or null (null = get all)              
 *     responses:
 *       '200':
 *         description: Delete Success !   
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /timeSlots/:
 *   put:
 *     summary: Update data for 1 TimeSlot
 *     tags: [TimeSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:30
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *           required:
 *              - id
 *     responses:
 *       '200':
 *         description: Update Success !   
 *       '500':
 *         description: Internal Server Error !
 */

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
    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20

        const id = parseInt(req.query.id) || null;
        const timeSlotList = []

        if (id != null) {
            const timeSlot = await TimeSlot.findOne({
                where: {
                    id: id
                }
            })
            if (timeSlot) {
                res.json(DataResponse(timeSlot))
                return;
            } else {
                res.json(MessageResponse("This id doesn't belong to any time slot"));
                return;
            }
        } else {
            const timeSlots = await TimeSlot.findAll();
            if (!timeSlots) {
                res.json(MessageResponse("The time slot table has no data!"));
                return;
            } else {
                for (const key of timeSlots) {
                    const time = {
                        id: key.id,
                        startTime: key.startTime,
                        endTime: key.endTime
                    }
                    timeSlotList.push(time);
                }
                res.json(DataResponse(timeSlotList))
                return;
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