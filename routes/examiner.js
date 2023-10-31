import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Examiner from '../models/Examiner.js'
import User from '../models/User.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import StaffLogChange from '../models/StaffLogChange.js'
import { getScheduleByPhase, getAllSchedule, getScheduledOneExaminer } from '../services/examinerService.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Examiners:
 *       type: object
 *       required:
 *          - userId
 *          - typeExaminer
 *          - semesterId
 *          - status
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          userId:
 *              type: integer
 *              description: reference to User id
 *          typeExaminer:
 *              type: integer
 *              description: O is lecturer, 1 is staff, 2 is volunteer
 *          semesterId:
 *              type: integer
 *              description: reference to Semester id
 *          status:
 *              type: boolean
 *              description: Active or inactive
 *       example:
 *           id: 1
 *           userId: 1
 *           typeExaminer: 0
 *           semesterId: 4
 *           status: 1
 */

/**
 * @swagger
 * tags:
 *    name: Examiners
 *    description: The Examiners managing API
 */

/**
 * @swagger
 * /examiners/:
 *   post:
 *     summary: Create a new Examiner
 *     tags: [Examiners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1, 2, 3
 *           required:
 *             - userId
 *     responses:
 *       '200':
 *         description: Create Success !
 */

/**
 * @swagger
 * /examiners/scheduled/:
 *   get:
 *     summary: Return the exam schedule of 1 Examiner by id
 *     tags: [Examiners]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The Examiner id Client want to get.
 *     responses:
 *       200:
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Examiners'
 */

/**
 * @swagger
 * /examiners/availableSlot/:
 *   get:
 *     summary: Return all slot that have no Examiners
 *     tags: [Lecturers]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Examiners'
 */

/**
 * @swagger
 * /examiners/:
 *   get:
 *     summary: Return all slot that have no Examiners
 *     tags: [Lecturers]
 *     parameters:
 *        - in: query
 *          name: semId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The semester user want to get list examiner
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Examiners'
 */

/**
 * @swagger
 * /examiners/:
 *   delete:
 *     summary: Delete a Examiner by id
 *     tags: [Examiners]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The Examiner id Client want to delete.
 *     responses:
 *       200:
 *         description: Deleted !
 */

router.post('/', async (req, res) => {
    const userId = parseInt(req.body.userId);
    const staffId = parseInt(res.locals.userData.id);
    //staff id thực chất là userId của role staff lấy từ token
    try {
        const statusMap = new Map([
            ['lecturer', 0],
            ['staff', 1],
            ['volunteer', 2]
        ]);
        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)
        const user = await User.findOne({
            where: {
                id: userId
            }
        })
        if ((user && user.status == 1) || !user) {
            res.json(MessageResponse("Not found user"));
            return;
        } else {
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
                res.json(MessageResponse("Table semester hasn't have any semester for current day"));
                return;
            } else {
                const examiner = await Examiner.create({
                    userId: userId,
                    typeExaminer: statusMap.get(user.role),
                    semesterId: semester.id,
                    status: 0,
                })
                if (examiner) {
                    const staffLog = await StaffLogChange.create({
                        rowId: parseInt(examiner.id),
                        tableName: 5,
                        userId: parseInt(staffId),
                        typeChange: 10,
                    })
                    if (staffLog) {
                        res.json(MessageResponse("Create Success !"))
                        return;
                    } else {
                        res.json(MessageResponse("Error when update staff log change"));
                        return;
                    }
                } else {
                    res.json(MessageResponse("Error when create examiner!"));
                    return;
                }
            }
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

//PASS
router.get('/scheduled', async (req, res) => {
    const id = parseInt(req.query.examinerId);
    
    try {
        const finalList = await getScheduledOneExaminer(id);
        if (finalList.length == 0) {
            res.json(MessageResponse("You have no schedule"));
        } else {
            res.json(DataResponse(finalList));
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//tất cả những slot còn trống trong 1 ngày 1 giờ
//PASS
//nếu user chưa đi canh thi thì sẽ k có examinerId
//nếu vậy thì tất cả các lịch trống đều có thể đăng kí
router.get('/availableSlot', async (req, res) => {

    try {// Nhận userId xong đi check trong examiner 
        const examinerId = parseInt(req.query.examinerId) //cái này sẽ đổi thành lấy từ token sau

        const result = await getAllSchedule(examinerId);
        
        res.json(DataResponse(result));
        return;
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }
})

router.get('/examPhaseId', async (req, res) => {
    try {// Nhận userId xong đi check trong examiner 
        const userId = parseInt(req.query.userId) //cái này sẽ đổi thành lấy từ token sau
        const examPhaseId = parseInt(req.query.examPhaseId)
        const semId = parseInt(req.query.semId)
        
        const result = await getScheduleByPhase(userId, examPhaseId, semId);
        res.json(DataResponse(result));
        return;
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }
})

router.get('/', async (req, res) => {
    try {
        const semId = req.query.semId
        const examiner = await Examiner.findAll({
            where: {
                semesterId: semId
            }
        })
        res.json(DataResponse(examiner))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})

router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id);
    try {
        const row = await Examiner.update({
            status: 1
        }, {
            where: {
                id: id
            }
        })
        if (row[0] != 0) {
            res.json(MessageResponse("Deleted !"));
            return;
        }
    } catch (error) {
        res.json(InternalErrResponse());
        return;
    }
})
export default router
//add được