import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'

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
    const timeSlotDatas = req.body;

    const { season, year } = req.body.season.split("_");

    try {
        let index = 0;
        const semester = await Semester.findOne({
            where: {
                season: season,
                year: year
            }
        })
        if (!semester) {
            res.json(MessageResponse("Semester doesn't exist"));
            return;
        }

        timeSlotDatas.forEach(async (time) => {
            const timeSlot = await TimeSlot.create({
                startTime: time.startTime,
                endTime: time.endTime,
                semId: parseInt(semester.id),
                des: parseInt(time.des),
            })
            if (timeSlot) {
                index++;
            }
            if (index == timeSlotDatas.length) {
                res.json(MessageResponse("Create Success !"))
                return;
            }
        });

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

//api trả timeslot theo des của exphase
//cái này hiện lúc mà staff tạo examSlot
router.get('/des', async (req, res) => {

    try {
        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10);
        const curSemester = await Semester.findOne({
            where: {
                start: {
                    [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                end: {
                    [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })
        const curExamPhase = await ExamPhase.findOne({
            where: {
                startDay: {
                    [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                endDay: {
                    [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })
        if (!curSemester || !curExamPhase) {
            res.json(MessageResponse("Not found semester or examphase"));
            return;
        }
        const slot = await TimeSlot.findAll({
            where: {
                semId: parseInt(curSemester.id),
                des: parseInt(curExamPhase.des)
            }
        })
        if (slot) {
            res.json(DataResponse(slot));
            return;
        }
    } catch (error) {
        res.json(InternalErrResponse());
        return;
    }
})


router.get('/semId', async (req, res) => {
    //get All timeSlot nếu không nhập gì
    //get 1 theo id nếu có
    //trả ra 1 mảng mỗi phần tử gồm Stt / Id / STime / ETime  
    try {
        const semId = parseInt(req.query.semId);

        const timeSlots = await TimeSlot.findAll({
            where: {
                semId: semId
            }
        });
        if (!timeSlots) {
            res.json(MessageResponse("The time slot table has no data of this semester!"));
            return;
        } else {
            res.json(DataResponse(timeSlots))
            return;
        }

    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//, requireRole("admin")
router.delete('/', async (req, res) => {
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