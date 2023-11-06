import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamPhase from '../models/ExamPhase.js'
import TimeSlot from '../models/TimeSlot.js'
import ExamSlot from '../models/ExamSlot.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import { createNewExamSlot, deleteExamSlot, findAllExamSlotByPhase, getAllByPhase } from '../services/examSlotService.js'


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
 *         description: Create Exam Slot Successfully !
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
 *                 description: exam slot ID client want to delete
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
 *        - in: query
 *          name: semId
 *          schema:
 *            type: int
 *          required: true
 *          example: 1, 2.
 *          description: The time semester of list exam slot you want to get.   
 *        - in: query
 *          name: ePId
 *          schema:
 *            type: int
 *          required: true
 *          example: 1, 2.
 *          description: The time exam phase of list exam slot you want to get.           
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamSlots'
 *       '500':
 *         description: Internal server error
 */

/**
 * @swagger
 * /examSlots/{id} :
 *   get:
 *     summary: Return all ExamSlot by ExamPhase Id.
 *     tags: [ExamSlots]
 *     parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: The ExamPhase ID client want to get.         
 *     responses :
 *       200 :
 *         description: Get exam slot successfully!
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamSlots'
 *       500 :
 *         description: Internal server error
 */

router.post('/', requireRole('staff'),async (req, res) => {
    const ePId = parseInt(req.body.ePId);
    const timeSlotId = parseInt(req.body.timeSlotId);
    const day = req.body.day;
    const staff = res.locals.userData
    try {
        await createNewExamSlot(ePId, timeSlotId, day, staff)
        res.json(MessageResponse("Create Exam Slot Successfully !"))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.delete('/', requireRole('staff'), async (req, res) => {
    const id = parseInt(req.body.id)
    const staff = res.locals.userData
    try {
        const result = await deleteExamSlot(id, staff);
        res.json(MessageResponse(result))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.get('/', requireRole('staff'), async (req, res) => {
    const semId = parseInt(req.query.semID)
    const ePId = parseInt(req.query.ePId)
    try {
        const result = await getAllByPhase(semId, ePId)
        res.json(DataResponse(result))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Lấy tất cả exam slot theo exam phase

router.get('/:id', requireRole('staff'), async (req, res) => {
    const phaseId = parseInt(req.params.id)
    try {
        const slotList = await findAllExamSlotByPhase(phaseId);
        //.then(value => slotList = value)
        if (slotList) {
            res.json(DataResponse(slotList))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})
export default router