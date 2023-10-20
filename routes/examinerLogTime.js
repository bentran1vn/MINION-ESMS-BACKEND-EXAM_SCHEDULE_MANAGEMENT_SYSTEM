import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import Examiner from '../models/Examiner.js'
import TimeSlot from '../models/TimeSlot.js'
import Semester from '../models/Semester.js'

/**
 * @swagger
 * components:
 *   schemas:
 *    ExaminerLogTimes:
 *       type: object
 *       required:
 *          - examinerId
 *          - day
 *          - timeSlotId
 *          - semId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          examinerId:
 *              type: integer
 *              description: Reference to Examiner id
 *          day:
 *              type: DATEONLY
 *              description: The day register a slot
 *          timeSlotId:
 *              type: integer
 *              description: Reference to TimeSlot id
 *          semId:
 *              type: integer
 *              description: Reference to Semester id
 *       example:
 *           id: 1
 *           examinerId: 1
 *           day: 2023-04-13
 *           timeSlotId: 1
 *           semId: 1
 */

/**
 * @swagger
 * tags:
 *    name: ExaminerLogTimes
 *    description: The ExaminerLogTimes managing API
 */

/**
 * @swagger
 * /examinerLogTimes/:
 *   post:
 *     summary: Create a new examiner log time
 *     tags: [ExaminerLogTimes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examinerId:
 *                 type: int
 *                 example: 10
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-05-19
 *               timeSlotId:
 *                 type: int
 *                 example: 4
 *           required:
 *             - examinerId
 *             - day
 *             - timeSlotId
 *     responses:
 *       '200':
 *         description: Create Success !
 */

const router = express.Router()

router.post('/', async (req, res) => {
    const { examinerId, day, timeSlotId } = req.body;
    

    try {
        const examiner = await Examiner.findOne({
            where: {
                id: parseInt(examinerId),
            }
        })
        const timeOfSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(timeSlotId)
            }
        })
        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)
        const semester = await Semester.findOne({
            where: {
                start: {
                    [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                end: {
                    [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })
        if (!semester) {
            res.json(MessageResponse("Table semester hasn't have data for this semester"))
            return;
        }
        if (!examiner || !timeOfSlot) {
            res.json(NotFoundResponse())
            return;
        } else {
            const examinerLogTime = await ExaminerLogTime.create({
                examinerId: parseInt(examinerId),
                day: day,
                timeSlotId: parseInt(timeSlotId),
                semId: parseInt(semester.id)
            })
            if(examinerLogTime){
                res.json(MessageResponse("Create Success !"));
                return;
            }else{
                res.json(MessageResponse("Error when create examiner log time"));
                return;
            }
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router