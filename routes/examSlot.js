import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamPhase from '../models/ExamPhase.js'
import TimeSlot from '../models/TimeSlot.js'
import ExamSlot from '../models/ExamSlot.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    ExamSlots:
 *       type: object
 *       required:
 *          - ePId
 *          - timeSlotId
 *          - day
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          ePId:
 *              type: integer
 *              description: Reference to ExamPhase id
 *          timeSlotId:
 *              type: integer
 *              description: Reference to TimeSlot id
 *          day:
 *              type: DATEONLY
 *              description: The exam day
 *       example:
 *           id: 1
 *           ePId: 1
 *           timeSlotId: 1
 *           day: 2023-04-13
 */

/**
 * @swagger
 * tags:
 *    name: ExamSlots
 *    description: The ExamSlots managing API
 */

/**
 * @swagger
 * /examSlots/:
 *   post:
 *     summary: Create a new ExamSlot
 *     tags: [ExamSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ePId:
 *                 type: integer
 *                 example: 1, 2, 3
 *               timeSlotId:
 *                 type: integer
 *                 example: 1, 2, 3
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13
 *           required:
 *             - ePId
 *             - timeSlotId
 *             - day
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examSlots/:
 *   delete:
 *     summary: Delete a ExamSlot
 *     tags: [ExamSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3             
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Delete Success !
 *       '500':
 *         description: Internal Server Error !
 */


router.post('/', async (req, res) => {
    const ePId = parseInt(req.body.ePId);
    const timeSlotId = parseInt(req.body.timeSlotId);
    const day = req.body.day;


    try {
        const examPhase = await ExamPhase.findOne({
            where: {
                id: ePId
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: timeSlotId
            }
        })
        if (!examPhase || !timeSlot) {
            res.json(NotFoundResponse());
            return;
        } else {
            const examSlot = await ExamSlot.create({
                ePId: ePId,
                timeSlotId: timeSlotId,
                day: day
            })
            console.log(examSlot);
            res.json(MessageResponse("Create Success !"))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id)

    try {
        const result = await ExamSlot.destroy({
            where: {
                id: id,
            }
        })
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('Delete Success !'))
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})

router.get('/statistic', async (req, res) => {
    try {
        var type = req.query.type
        const time = new Date()
        // var timeFormat = time.toISOString().slice(0, 10)
        var timeFormat = "2023-12-03"
        const semester = await Semester.findOne({
            where: {
                start: {
                    [Op.lt]: timeFormat
                },
                end: {
                    [Op.gt]: timeFormat
                }
            }
        })
        const examPhase = await ExamPhase.findOne({
            where: {
                startDay: {
                    [Op.lt]: timeFormat
                },
                endDay: {
                    [Op.gt]: timeFormat
                },
                semId: semester.id
            }
        })

        const exSlotFull = await ExamSlot.findAll({
            where: {
                ePId: examPhase.id
            }
        })
        const exSlotPast = []
        const exSlotCur = []
        if (type == "") {
            res.json(DataResponse(exSlotFull))
        } else if (type == '1') {
            exSlotFull.forEach(e => {
                if (Date.parse(e.day) < Date.parse(timeFormat)) {
                    exSlotPast.push(e)
                }
            });
            res.json(DataResponse(exSlotPast))
        } else if (type == '0') {
            exSlotFull.forEach(e => {
                if (Date.parse(e.day) > Date.parse(timeFormat)) {
                    exSlotCur.push(e)
                }
            });
            res.json(DataResponse(exSlotCur))
        }
        //res.json(DataResponse(examPhase))
        // res.json(MessageResponse("allo"))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})// Thống kê exam slots, type = ““ thì getAll; = 1 thì lấy đã hoàn tất; = 0 thì lấy chưa hoàn tất 
// theo loại kì thi như PE, FE, RE dựa vào time hiện tại

export default router