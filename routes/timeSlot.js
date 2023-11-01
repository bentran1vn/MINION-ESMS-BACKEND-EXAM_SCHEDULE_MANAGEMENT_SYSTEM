import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'

const router = express.Router()

//Swagger Model
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

//Swagger Tag
/**
 * @swagger
 * tags:
 *    name: TimeSlots
 *    description: The TimeSlots managing API
 */

//Swagger Post
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
 *               season: 
 *                 type: string
 *                 example: FALL_2023
 *                 description: The season of time slot Client want to create.
 *           required:
 *             - startTime
 *             - endTime
 *             - season
 *     responses:
 *       '200':
 *         description: Create Time Slot Successfully !
 *       '500':
 *         description: Internal Server Error !
 */

//Swagger Get
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

//Swagger Get
/**
 * @swagger
 * /timeSlots/des:
 *   get:
 *     summary: Return all TimeSlots according to examphase's des, This appears when create examSlot
 *     tags: [TimeSlots]   
 *     parameters:
 *       - in: query
 *         name: examphaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The time slot of 1 ExamPhase Client want to get.       
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

//Swagger Delete
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

//Swagger Put
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

router.get('/des', async (req, res) => {
    const examphaseId = parseInt(req.query.examphaseId);
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
                id: examphaseId
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
})//api trả timeslot theo des của exphase
  //cái này hiện lúc mà staff tạo examSlot

router.get('/semId', async (req, res) => {   
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
})//get All timeSlot nếu không nhập gì
  //get 1 theo id nếu có
  //trả ra 1 mảng mỗi phần tử gồm Stt / Id / STime / ETime  

//requireRole("admin")
router.delete('/', async (req, res) => {   
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
})//delete timeSlot
  //nếu id có thì xóa 1 không thì xóa hết
  //nhớ bắt cảnh báo xác nhận xóa hết nếu không nhập gì

router.put('/', async (req, res) => { 
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
})//update time slot theo id

export default router
//add xong