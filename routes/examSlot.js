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

/**
 * @swagger
 * /examSlots:
 *   get:
 *     summary: Return all data of exam slot by semId and ePId.
 *     tags: [ExamSlots]
 *     parameters:
 *       - in: query
 *         name: semId
 *         schema:
 *           type: int
 *         required: true
 *         example: 1, 2.
 *         description: The time semester of list exam slot you want to get.   
 *       - in: query
 *         name: ePId
 *         schema:
 *           type: int
 *         required: true
 *         example: 1, 2.
 *         description: The time exam phase of list exam slot you want to get.           
 *     responses:
 *       '200':
 *         description: Get all exam slot successfully!
 *       '500':
 *         description: Can not get all exam slot!
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

router.get('/', async (req, res) => {
    try {
        const semId = parseInt(req.query.semID)
        const ePId = parseInt(req.query.ePId)

        const examPhase = await ExamPhase.findOne({
            where: {
                id: ePId,
                semId: semId
            }
        })

        const exSlotFull = await ExamSlot.findAll({
            where: {
                ePId: examPhase.id
            }
        })
        res.json(DataResponse(exSlotFull))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})// Lấy tất cả exam slot theo exam phase

export default router