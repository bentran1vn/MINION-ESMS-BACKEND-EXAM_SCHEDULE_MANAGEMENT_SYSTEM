import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Lecture from '../models/Lecturer.js'
import User from '../models/User.js'
import ExamRoom from '../models/ExamRoom.js'
import SubInSlot from '../models/SubInSlot.js'
import Room from '../models/Room.js'
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import { Op } from 'sequelize'
import Lecturer from '../models/Lecturer.js'
import LecturerLogTime from '../models/LecturerLogTime.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Lecturers:
 *       type: object
 *       required:
 *          - userId
 *          - lecId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          userId:
 *              type: integer
 *              description: reference to User id
 *          lecId:
 *              type: String
 *              description: Business ID for Lecturer
 *       example:
 *           id: 1
 *           userId: 1
 *           lecId: FU292939
 */

/**
 * @swagger
 * tags:
 *    name: Lecturers
 *    description: The Lecturers managing API
 */

/**
 * @swagger
 * /lecturers/:
 *   post:
 *     summary: Create a new Lecturer
 *     tags: [Lecturers]
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
 *               lecId:
 *                 type: String
 *                 example: FU291049
 *           required:
 *             - userId
 *             - lecId
 *     responses:
 *       '200':
 *         description: Create Success !
 */

/**
 * @swagger
 * /lecturers/scheduled/:
 *   get:
 *     summary: Return the exam schedule of 1 Lecturer by id
 *     tags: [Lecturers]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The lecturer id Client want to get.
 *     responses:
 *       200:
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Lecturers'
 */

/**
 * @swagger
 * /lecturers/availableSlot/:
 *   get:
 *     summary: Return all slot that have no Lecturers
 *     tags: [Lecturers]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Lecturers'
 */

router.post('/', async (req, res) => {
    const userId = parseInt(req.body.userId);
    const lecId = req.body.lecId;

    try {
        const user = await User.findOne({
            where: {
                id: userId
            }
        })
        if (!user) {
            res.json(NotFoundResponse());
            return;
        } else {
            const lecturer = await Lecture.create({
                userId: userId,
                lecId: lecId
            })
            console.log(lecturer);
            res.json(MessageResponse("Create Success !"))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

//PASS
router.get('/scheduled', async (req, res) => {
    const id = parseInt(req.query.id);

    if (!id) {
        res.json(MessageResponse("Lecturer id is required"));
        return;
    }
    try {
        const result = await ExamRoom.findAll({
            where: { lecturerId: id },
            attributes: [],
            include: [
                {
                    model: SubInSlot,
                    include: [
                        {
                            model: Course,
                            include: [
                                {
                                    model: Subject,
                                    attributes: ['code', 'name'], // Chọn các trường bạn muốn lấy từ bảng Subject
                                },
                            ],
                        },
                        {
                            model: ExamSlot,
                            include: [
                                {
                                    model: TimeSlot,
                                    attributes: ['startTime', 'endTime'], // Chọn các trường bạn muốn lấy từ bảng TimeSlot
                                },
                            ],
                        },
                    ],
                },
                {
                    model: Room,
                    attributes: ['roomNum', 'location'], // Chọn các trường bạn muốn lấy từ bảng Room
                },
            ],
        })
        if (result.length === 0) {
            res.json(MessageResponse("Your schedule is empty !"))
            return;
        } else {
            let listSchedule = [];
            let i = 1;
            result.forEach(schedule => {
                const room = schedule.room;
                const subject = schedule.subInSlot.course.subject;
                const examSlot = schedule.subInSlot.examSlot;
                const timeSlot = schedule.subInSlot.examSlot.timeSlot;
                const sche = {
                    subCode: subject.code,
                    subName: subject.name,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime,
                    day: examSlot.day,
                    roomCode: room.roomNum,
                    roomLocation: room.location
                }
                listSchedule.push(sche);
            });
            console.log(listSchedule);
            if (listSchedule.length == 0) {
                res.json(NotFoundResponse);
            } else {
                res.json(DataResponse(listSchedule));
            }
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//tất cả những slot còn trống trong 1 ngày 1 giờ
//PASS
router.get('/availableSlot', async (req, res) => {
    

    let availableSlotList = [];
    const slotNoLecturer = await ExamRoom.findAll({
        where: {
            lecturerId: null
        }
    });
    if (!slotNoLecturer) {
        res.json(MessageResponse("All slot are scheduled!"));
        return;
    }
    const slotAvailable = slotNoLecturer.map(examRoom => examRoom.dataValues);

    for (const item of slotAvailable) {
        const sSId = item.sSId;

        const subjectInSlot = await SubInSlot.findOne({
            where: {
                id: sSId
            }
        })
        const examSlot = await ExamSlot.findOne({
            where: {
                id: subjectInSlot.exSlId
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: examSlot.timeSlotId
            }
        })
        const checkLecLogTime = await LecturerLogTime.findOne({
            where: {
                day: examSlot.day,
                timeSlotId: timeSlot.id,
                lecturerId: lecturerId
            }
        })
        if (checkLecLogTime) {
            const ob = {
                day: examSlot.day,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                status: true, //status = true là không được nhận lịch nữa, bận rồi
            }
            availableSlotList.push(ob);
        } else {
            const ob = {
                day: examSlot.day,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                status: false, //status = false là được nhận lịch nữa, rảnh
            }
            availableSlotList.push(ob);
        }

    }
    let result = [];
    const counts = {};
    // Duyệt qua danh sách slot available và đếm số lần xuất hiện của mỗi khung giờ khác nhau
    availableSlotList.forEach(item => {
        // Tạo một chuỗi duy nhất để đại diện cho mục
        const key = JSON.stringify(item);
        // Kiểm tra nếu đã có mục này trong counts, nếu chưa thì đặt giá trị mặc định là 0
        if (!counts[key]) {
            counts[key] = 0;
        }
        // Tăng số lần xuất hiện lên 1
        counts[key]++;
    });

    // Hiển thị kết quả
    for (const key in counts) {
        const item = JSON.parse(key);
        const kq = {
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            available: counts[key],
            status: item.status
        }
        result.push(kq);
    }
    res.json(DataResponse(result));

})

export default router
//add được