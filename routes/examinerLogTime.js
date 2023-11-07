import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import Examiner from '../models/Examiner.js'
import TimeSlot from '../models/TimeSlot.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'

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
            if (examinerLogTime) {
                res.json(MessageResponse("Create Success !"));
                return;
            } else {
                res.json(MessageResponse("Error when create examiner log time"));
                return;
            }
        }
    } catch (err) {
        consoleor.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

export default router