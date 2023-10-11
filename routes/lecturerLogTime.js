import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import LecturerLogTime from '../models/LecturerLogTime.js'
import Lecturer from '../models/Lecturer.js'
import TimeSlot from '../models/TimeSlot.js'

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

/**
 * @swagger
 * tags:
 *    name: Courses
 *    description: The lecturerLogTime managing API
 */

const router = express.Router()

router.post('/', async (req, res) => {
    const { lecturerId, day, timeSlotId } = req.body;

    try {
        const lecturer = await Lecturer.findOne({
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
            const lecturerLogTime = await LecturerLogTime.create({
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