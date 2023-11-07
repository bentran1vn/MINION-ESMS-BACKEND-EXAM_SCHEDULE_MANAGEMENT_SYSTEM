import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Examiner from '../models/Examiner.js'
import User from '../models/User.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import StaffLogChange from '../models/StaffLogChange.js'
import {
    getScheduleByPhase, allScheduledOfExaminer, createVolunteerExaminer,
    getAllExaminerCTVBySemId, deleteExaminer, scheduledByPhase, getExaminerByPhase
} from '../services/examinerService.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Examiners:
 *       type: object
 *       required:
 *          - userId
 *          - exName
 *          - exEmail
 *          - typeExaminer
 *          - semesterId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          userId:
 *              type: integer
 *              description: reference to User id
 *          exName:
 *              type: integer
 *              description: Examiner's name
 *          exEmail:
 *              type: integer
 *              description: Examiner's email
 *          typeExaminer:
 *              type: integer
 *              description: O is lecturer, 1 is staff, 2 is volunteer
 *          semesterId:
 *              type: integer
 *              description: reference to Semester id
 *          status:
 *              type: boolean
 *              description: false is available, true is unavailable, default is false
 *       example:
 *           id: 1
 *           userId: 256
 *           typeExaminer: 0
 *           exName: Lecturer 1
 *           exEmail: Lecturer1@gmail.com
 *           semesterId: 9
 *           status: 0
 */

/**
 * @swagger
 * tags:
 *    name: Examiners
 *    description: The Examiners managing API
 */

// Swagger - get: scheduledByPhase
/**
 * @swagger
 * /examiners/scheduledByPhase/:
 *   get:
 *     summary: Return the exam scheduled of 1 Examiner by phase ID
 *     tags: [Examiners]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The User id Client want to get / get by token.
 *       - in: query
 *         name: examphaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ExamPhase id Client want to get.
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

// Swagger - get: allScheduled
/**
 * @swagger
 * /examiners/allScheduled/:
 *   get:
 *     summary: Return all exam scheduled of 1 Examiner
 *     tags: [Examiners]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The User id Client want to get / get by token.
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

// Swagger - get: examPhaseId
/**
 * @swagger
 * /examiners/examPhaseId/:
 *   get:
 *     summary: Return exam schedule to register by phase
 *     tags: [Examiners]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The User id Client want to get / get by token.
 *       - in: query
 *         name: examPhaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ExamPhase id Client want to get.
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

// Swagger - delete
/**
 * @swagger
 * /examiners/:
 *   delete:
 *     summary: Delete a Examiner by Examiner id
 *     tags: [Examiners]
 *     parameters:
 *       - in: query
 *         name: examinerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The Examiner id Client want to delete.
 *     responses:
 *       200:
 *         description: Deleted !
 */

// Swagger - get: getExaminerByPhase
/**
 * @swagger
 * /examiners/getExaminerByPhase:
 *   get:
 *     summary: Return all Examiners have schedule in one ExamPhase
 *     tags: [Lecturers]
 *     parameters:
 *        - in: query
 *          name: exPhaseId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The ExamPhase Id client want to get
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

// Swagger - post: volunteerExaminer
/**
 * @swagger
 * /examiners/volunteerExaminer:
 *   post:
 *     summary: Create Examiner role CTV
 *     tags: [Lecturers]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: STRING
 *                 example: Examiner Name
 *               email:
 *                 type: STRING
 *                 example: examiner@gmail.com
 *               semesterId:
 *                 type: integer
 *                 example: 4
 *           required:
 *             - name
 *             - email
 *             - semesterId
 *     responses:
 *       '200':
 *         description: Create successfully !
 */

// Swagger - get: getExaminerByPhase
/**
 * @swagger
 * /examiners/volunteerExaminer:
 *   get:
 *     summary: Return all Examiners have role CTV
 *     tags: [Lecturers]
 *     parameters:
 *        - in: query
 *          name: semesterId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The semesterId client want to get
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

router.post('/', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const staffId = parseInt(res.locals.userData.id);
        //staff id thực chất là userId của role staff lấy từ token

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
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//chưa làm được 

router.post('/volunteerExaminer', requireRole('staff'), async (req, res) => {
    try {
        const staffId = parseInt(res.locals.userData.id)
        const exName = req.body.name
        const exEmail = req.body.email
        const semesterId = parseInt(req.body.semesterId)
        const result = await createVolunteerExaminer(exName, exEmail, semesterId, staffId);
        if (result) {
            res.json(MessageResponse("Add volunteer success!"));
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//tạo examiner role ctv

router.get('/volunteerExaminer', requireRole('staff'), async (req, res) => {
    try {
        const semesterId = parseInt(req.query.semesterId);
        const examiner = await getAllExaminerCTVBySemId(semesterId)
        if (examiner) {
            res.json(DataResponse(examiner));
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//get ra examiner role ctv theo semester

router.get('/allScheduled', requireRole('lecturer'), async (req, res) => {
    try {
        const id = parseInt(res.locals.userData.id);//cái này sau bắt bằng token
        const finalList = await allScheduledOfExaminer(id)
        if (finalList) {
            res.json(DataResponse(finalList))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//lấy tất cả lịch đã đăng kí của 1 examiner 

router.get('/examPhaseId', requireRole('lecturer'), async (req, res) => {
    try {// Nhận userId xong đi check trong examiner 
        const userId = parseInt(res.locals.userData.id) //cái này sẽ đổi thành lấy từ token sau
        const examPhaseId = parseInt(req.query.examPhaseId)

        const result = await getScheduleByPhase(userId, examPhaseId);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
        } else if (!Array.isArray(result)) {
            res.json(NotFoundResponse());
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//lấy lịch để đăng kí theo phase

router.delete('/', async (req, res) => {
    try {
        const id = parseInt(req.query.examinerId);
        const row = await deleteExaminer(id)
        if (row) {
            res.json(MessageResponse("Deleted !"));
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//xóa examiner

router.get('/scheduledByPhase', requireRole('lecturer'), async (req, res) => {
    try {
        const id = parseInt(res.locals.userData.id);
        const examphaseId = parseInt(req.query.examphaseId);
        const finalList = await scheduledByPhase(id, examphaseId)
        if (finalList) {
            res.json(DataResponse(finalList))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})//lấy lịch đã đăng kí của 1 examiner theo phase

router.get('/getExaminerByPhase', requireRole('staff'), async (req, res) => {
    try {
        const exPhaseId = parseInt(req.query.exPhaseId);
        const examinerLists = await getExaminerByPhase(exPhaseId)
        if (examinerLists) {
            res.json(DataResponse(examinerLists))
        }
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
    //trả ra email name, role, status
})//lấy danh sách examiner by phase của màn hình admin

export default router
//add được