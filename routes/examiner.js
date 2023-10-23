import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Examiner from '../models/Examiner.js'
import User from '../models/User.js'
import ExamRoom from '../models/ExamRoom.js'
import SubInSlot from '../models/SubInSlot.js'
import Room from '../models/Room.js'
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import { DATEONLY } from 'sequelize'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'

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
 *               typeExaminer:
 *                 type: interger
 *                 example: 0, 1, 2 
 *           required:
 *             - userId
 *             - typeExaminer
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
    const typeExaminer = parseInt(req.body.typeExaminer)

    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)

    try {
        const user = await User.findOne({
            where: {
                id: userId,
                status: 1,
            }
        })
        if (!user) {
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
                res.json(MessageResponse("Table semester hasn't have data for this semester"));
                return;
            } else {
                const examiner = await Examiner.create({
                    userId: userId,
                    typeExaminer: typeExaminer,
                    semesterId: semester.id,
                    status: 0,
                })
                if (examiner) {
                    res.json(MessageResponse("Create Success !"))
                    return;
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
    const id = parseInt(req.query.id);

    if (!id) {
        res.json(MessageResponse("Examiner id is required"));
        return;
    }
    try {
        const result = await ExamRoom.findAll({
            where: { examinerId: id },
            include: [
                {
                    model: SubInSlot,
                    include: [
                        {
                            model: Course,
                            where: { status: 1 },
                            include: [
                                {
                                    model: Subject,
                                    where: { status: 1 },
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
                    where: { status: 1 },
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
//nếu user chưa đi canh thi thì sẽ k có examinerId
//nếu vậy thì tất cả các lịch trống đều có thể đăng kí
router.get('/availableSlot', async (req, res) => {

    try {// Nhận userId xong đi check trong examiner 
        const examinerId = parseInt(req.query.examinerId)//cái này sẽ đổi thành lấy từ token sau

        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)
        const semester = await Semester.findOne({ // Đổi theo exam phase
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

        let availableSlotList = [];
        const slotExaminer = await ExamRoom.findAll();
        if (!slotExaminer) {
            res.json(MessageResponse("Exam room has no data"));
            return;
        }
        const slotAvailable = slotExaminer.map(examRoom => examRoom.dataValues);

        for (const item of slotAvailable) {
            const sSId = item.sSId;

            const subjectInSlot = await SubInSlot.findOne({ // Lọc ra, chỉ láy những
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

            if (examinerId != null) {
                const checkLecLogTime = await ExaminerLogTime.findOne({
                    where: {
                        day: examSlot.day,
                        timeSlotId: timeSlot.id,
                        examinerId: examinerId,
                        semId: semester.id,
                    }
                })
                if (checkLecLogTime) {
                    const ob = {
                        day: examSlot.day,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime,
                        semId: semester.id,
                        busy: true, //status = true là không được nhận lịch nữa, bận rồi
                    }
                    availableSlotList.push(ob);
                } else {
                    const ob = {
                        day: examSlot.day,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime,
                        semId: semester.id,
                        busy: false, //status = false là được nhận lịch nữa, rảnh
                    }
                    availableSlotList.push(ob);

                }
            } else if (examinerId == null) {
                const ob = {
                    day: examSlot.day,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime,
                    semId: semester.id,
                    busy: false, //status = false là được nhận lịch nữa, rảnh
                }
                availableSlotList.push(ob);
            }
        }
        const currentExamPhase = await ExamPhase.findOne({
            where: {
                startDay: {
                    [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                endDay: {
                    [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })
        if (!currentExamPhase) {
            res.json(MessageResponse(`Exam phase hasn't have data of ${timeFormatted}`));
            return;
        }

        const statusMap = new Map([
            [0, 'passed'],
            [1, 'on-going'],
            [2, 'future']
        ]);
        let passedSchedule = [];
        let currentSchedule = [];
        let futureSchedule = [];

        availableSlotList.forEach(item => {
            if (item.day < currentExamPhase.startDay) {
                const s1 = {
                    day: item.day,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    semId: item.semId,
                    busy: item.busy,
                    status: statusMap.get(0)
                }
                passedSchedule.push(s1)
            } else if (item.day >= currentExamPhase.startDay && item.day <= currentExamPhase.endDay) {
                const s2 = {
                    day: item.day,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    semId: item.semId,
                    busy: item.busy,
                    status: statusMap.get(1)
                }
                currentSchedule.push(s2)
            } else if (item.day > currentExamPhase.endDay) {
                const s3 = {
                    day: item.day,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    semId: item.semId,
                    busy: item.busy,
                    status: statusMap.get(2)
                }
                futureSchedule.push(s3)
            }
        })

        let finalList = [...passedSchedule, ...currentSchedule, ...futureSchedule];
        let result = [];
        const counts = {};
        // Duyệt qua danh sách slot available và đếm số lần xuất hiện của mỗi khung giờ khác nhau
        finalList.forEach(item => {
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
                busy: item.busy,
                status: item.status,
            }
            result.push(kq);
        }
        res.json(DataResponse(result));
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
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