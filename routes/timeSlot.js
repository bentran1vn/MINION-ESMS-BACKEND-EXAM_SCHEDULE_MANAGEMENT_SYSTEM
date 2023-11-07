import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'
import { createTimeSlot, delTimeSlot, getAllTimeSlotOneSem, getTimeByDesOfPhase, updateTime } from '../services/timeSlotService.js'

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
 *          - semId
 *          - des
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id.
 *          startTime:
 *              type: TIME
 *              description: The start time of time slot.
 *          endTime:
 *              type: TIME
 *              description: The end time of time slot.
 *          semId:
 *              type: integer
 *              description: The semester id time slot belong.
 *          des:
 *              type: TIME
 *              description: The convention 0 is normal, 1 is coursera.
 *       example:
 *           id: 1
 *           startTime: 07:30:00
 *           endTime: 09:00:00
 *           semId: 1
 *           des: 0
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
 *                 description: The start time of time slot Client want to create.
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *                 description: The end time of time slot Client want to create.
 *               semId: 
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *                 description: The semester id of time slot Client want to create.
 *           required:
 *             - startTime
 *             - endTime
 *             - semId
 *     responses:
 *       '200':
 *         description: Create Time Slot Successfully !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /timeSlots/des:
 *   get:
 *     summary: Return all TimeSlots 1 semester by description of phase
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: query
 *         name: examphaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The examphase ID Client want to get.         
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The semester ID Client want to get.        
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
 * /timeSlots/semId:
 *   get:
 *     summary: Return all TimeSlots of 1 semester by id
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: query
 *         name: semId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The time slot of 1 semester Client want to get.             
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
 *     summary: Delete a TimeSlot by id required Admin role
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
 *                 description: The Id of time slot Client want to update.  
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:30
 *                 description: The start time of time slot Client want to update.  
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *                 description: The end time of time slot Client want to update.  
 *           required:
 *              - id
 *              - startTime
 *              - endTime
 *     responses:
 *       '200':
 *         description: Update Success !   
 *       '500':
 *         description: Internal Server Error !
 */

router.post('/', async (req, res) => {
    const timeSlotDatas = req.body;
    const semId = parseInt(req.body.semId);
    try {
        const result = await createTimeSlot(timeSlotDatas, semId);
        res.json(MessageResponse(result));
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

router.get('/des', async (req, res) => {
    const examphaseId = parseInt(req.query.examphaseId);
    const semesterId = parseInt(req.query.semesterId);
    try {
        const result = await getTimeByDesOfPhase(examphaseId, semesterId)
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
        } else {
            res.json(MessageResponse(result))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.get('/semId', async (req, res) => {
    const semId = parseInt(req.query.semId);
    try {
        const result = await getAllTimeSlotOneSem(semId)
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
        } else {
            res.json(MessageResponse(result))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//requireRole("admin")
// router.delete('/', async (req, res) => {
//     const id = parseInt(req.body.id);
//     try {
//         const result = await delTimeSlot(id);
//         res.json(MessageResponse(result))
//     } catch (error) {
//         console.log(error);
//         res.json(ErrorResponse(500, error.message))
//     }
// })

// router.put('/', async (req, res) => {
//     const id = parseInt(req.body.id)
//     const timeSlotData = req.body;

//     try {
//         const result = await updateTime(id, timeSlotData);
//         res.json(MessageResponse(result))
//     } catch (err) {
//         console.log(err);
//         res.json(ErrorResponse(500, err.message))
//     }
// })//update time slot theo id

export default router
//add xong