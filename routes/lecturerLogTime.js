import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import Examiner from '../models/Examiner.js'
import TimeSlot from '../models/TimeSlot.js'

/**
 * @swagger
 * components:
 *   schemas:
 *    LecturerLogTimes:
 *       type: object
 *       required:
 *          - lecturerId
 *          - day
 *          - timeSlotId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          lecturerId:
 *              type: integer
 *              description: Reference to Lecturer id
 *          day:
 *              type: DATEONLY
 *              description: The day register a slot
 *          timeSlotId:
 *              type: integer
 *              description: Reference to TimeSlot id
 *       example:
 *           id: 1
 *           lecturerId: 1
 *           day: 2023-04-13
 *           timeSlotId: 1
 */

/**
 * @swagger
 * tags:
 *    name: LecturerLogTimes
 *    description: The lecturerLogTimes managing API
 */

/**
 * @swagger
 * /lecturerLogTimes:
 *   post:
 *     summary: Create a new exam types
 *     tags: [LecturerLogTimes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lecturerId:
 *                 type: int
 *                 example: 10
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-05-19
 *               timeSlotId:
 *                 type: int
 *                 example: 4
 *           required:
 *             - lecturerId
 *             - day
 *             - timeSlotId
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

const router = express.Router()

router.post('/', async (req, res) => {
    const { lecturerId, day, timeSlotId } = req.body;

    try {
        const lecturer = await Examiner.findOne({
            where: {
                id: parseInt(lecturerId),
            }
        })
        const timeOfSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(timeSlotId)
            }
        })
        if (!lecturer || !timeOfSlot) {
            res.json(NotFoundResponse())
            return;
        } else {
            const lecturerLogTime = await ExaminerLogTime.create({
                lecturerId: parseInt(lecturerId),
                day: day,
                timeSlotId: parseInt(timeSlotId)
            })
            console.log(lecturerLogTime);
            res.json(DataResponse(lecturerLogTime))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router