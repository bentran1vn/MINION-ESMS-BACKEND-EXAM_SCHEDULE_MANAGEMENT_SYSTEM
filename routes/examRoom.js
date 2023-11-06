import express, { response } from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Room from '../models/Room.js'
import Examiner from '../models/Examiner.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import RoomLogTime from '../models/RoomLogTime.js'
import StaffLogChange from '../models/StaffLogChange.js'
import Semester from '../models/Semester.js'
import User from '../models/User.js'
import { Op } from 'sequelize'
import ExamPhase from '../models/ExamPhase.js'
import { getDetailScheduleOneExamSlot, addExaminerForStaff, addRoomByStaff, autoFillLecturerToExamRoom, delRoomByStaff, getAllAvailableExaminerInSlot, getAllCourseOneSlot, getAllExaminerOneSlot, getAllRoomOneSlot, lecRegister, lecUnRegister, getAllCourseAndNumOfStudentOneSlot } from '../services/examRoomService.js'
import { changeCourseStatus } from '../services/courseService.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    ExamRooms:
 *       type: object
 *       required:
 *          - sSId
 *          - roomId
 *          - examinerId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          sSId:
 *              type: integer
 *              description: Reference to SubInSlot id
 *          roomId:
 *              type: integer
 *              description: Reference to Room id
 *          examinerId:
 *              type: integer
 *              description:  Reference to Examiner id
 *       example:
 *           id: 1
 *           sSId: 1
 *           roomId: 1
 *           examinerId: 1
 */

/**
 * @swagger
 * tags:
 *    name: ExamRooms
 *    description: The ExamRooms managing API
 */

/**
 * @swagger
 * /examRooms/:
 *   post:
 *     summary: Create a new ExamRoom
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sSId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               userId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - sSId
 *             - roomId
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/auto/:
 *   post:
 *     summary: Auto fill Examiner to ExamRoom by Staff
 *     tags: [ExamRooms]
 *     responses:
 *       '200':
 *         description: All rooms assigned / Number of Examiner not enough to fill up exam room
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/lecturer/:
 *   put:
 *     summary: Register to 1 slot in ExamRoom for role Examiner type Lecturer
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:00
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13
 *               exPhaseId:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *           required:
 *             - userId
 *             - startTime
 *             - endTime
 *             - day
 *             - exPhaseId
 *     responses:
 *       '200':
 *         description: Lecturer added / All rooms full / This slot hasn't have any subject
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/delLecturer/:
 *   put:
 *     summary: Un-Register to 1 slot in ExamRoom for role Lecturer
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:00
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13
 *           required:
 *             - userId
 *             - startTime
 *             - endTime
 *             - day
 *     responses:
 *       '200':
 *         description: Examiner is removed, examiner log time updated
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/addExaminer/:
 *   put:
 *     summary: Register to 1 slot in ExamRoom for role Staff
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examRoomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               userId:
 *                 type: integer
 *                 description: Reference to User, take staff, lecturer, volunteer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - examRoomId
 *             - userId
 *     responses:
 *       '200':
 *         description: Add Success to exam room and update examiner log time !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/room/:
 *   put:
 *     summary: Register a room to 1 slot in ExamRoom for role Staff
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examRoomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - examRoomId
 *             - roomId
 *     responses:
 *       '200':
 *         description: Add Success room to exam room and update room log time!
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/delRoom/:
 *   put:
 *     summary: Un-Register a room to 1 slot in ExamRoom for role Staff
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examRoomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - examRoomId
 *     responses:
 *       '200':
 *         description: Room is deleted, room log time updated
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/:
 *   get:
 *     summary: Get all exam schedule list for role Staff
 *     tags: [ExamRooms]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/allExaminerInSlot/:
 *   get:
 *     summary: Return all free user able to be examiner in 1 slot 1 day for Staff role
 *     tags: [ExamRooms]
 *     parameters:
 *        - in: query
 *          name: startTime
 *          schema:
 *            type: TIME
 *          required: true
 *          description: The start of time in 1 slot want to find
 *        - in: query
 *          name: endTime
 *          schema:
 *            type: TIME
 *          required: true
 *          description: The end of time in 1 slot want to find
 *        - in: query
 *          name: day
 *          schema:
 *            type: DATEONLY
 *          required: true
 *          description: The day want to find 
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/getCourseOneSlot/:
 *   get:
 *     summary: Return all scheduled Course in one ExamSlot
 *     tags: [ExamRooms]
 *     parameters:
 *        - in: query
 *          name: exSlotID
 *          schema:
 *            type: integer
 *          required: true
 *          description: The ExamSlot client want to get
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/getRoomOneSlot/:
 *   get:
 *     summary: Return all scheduled Room in one ExamSlot
 *     tags: [ExamRooms]
 *     parameters:
 *        - in: query
 *          name: exSlotID
 *          schema:
 *            type: integer
 *          required: true
 *          description: The ExamSlot client want to get
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/getExaminerOneSlot/:
 *   get:
 *     summary: Return all scheduled Examiner in one ExamSlot
 *     tags: [ExamRooms]
 *     parameters:
 *        - in: query
 *          name: exSlotID
 *          schema:
 *            type: integer
 *          required: true
 *          description: The ExamSlot client want to get
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/getExamRoomDetailByPhase/:
 *   get:
 *     summary: Return all exam scheduled details in one ExamSlot
 *     tags: [ExamRooms]
 *     parameters:
 *        - in: query
 *          name: examSlotId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The ExamSlot client want to get
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

router.post('/', async (req, res) => {
    const sSId = parseInt(req.body.sSId);
    const roomId = parseInt(req.body.roomId);
    const userId = parseInt(req.body.userId);//bắt qua token

    try {
        const user = await User.findOne({
            where: {
                id: userId
            }
        })
        const subInSlot = await SubInSlot.findOne({
            where: {
                id: sSId
            }
        })
        const room = await Room.findOne({
            where: {
                id: roomId
            }
        })
        const examSlot = await ExamSlot.findOne({
            where: {
                id: subInSlot.exSlId
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: examSlot.timeSlotId
            }
        })

        const currentExamPhase = await ExamPhase.findOne({
            where: {
                startDay: {
                    [Op.lte]: examSlot.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                endDay: {
                    [Op.gte]: examSlot.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })

        const semester = await Semester.findOne({
            where: {
                start: {
                    [Op.lte]: examSlot.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                end: {
                    [Op.gte]: examSlot.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })
        if (currentExamPhase.status == 0) {
            res.json(MessageResponse("Can't change on-going or passed schedule"));
            return;
        }
        const examiner = await Examiner.findOne({
            where: {
                userId: userId,
                semesterId: semester.id
            }
        })

        const statusMap = new Map([
            ['lecturer', 0],
            ['staff', 1],
            ['volunteer', 2]
        ]);

        if (!subInSlot || !room || !examSlot || !timeSlot) {
            res.json(NotFoundResponse());
            return;
        } else if (!examiner) {
            const newExaminer = await Examiner.create({
                userId: userId,
                typeExaminer: statusMap.get(user.role),
                semesterId: parseInt(semester.id),
                status: 0
            })
            if (!newExaminer) {
                res.json(MessageResponse("Error when create new Examiner"))
            } else {
                const checkRoomLogTime = await RoomLogTime.findOne({
                    where: {
                        day: examSlot.day,
                        timeSlotId: timeSlot.id,
                        roomId: roomId,
                        semId: parseInt(semester.id),
                    }
                })
                if (checkRoomLogTime) {
                    res.json(MessageResponse(`This room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} - ${examSlot.day}`))
                    return;
                } else {
                    const examRoom = await ExamRoom.create({
                        sSId: sSId,
                        roomId: roomId,
                        examinerId: parseInt(newExaminer.id),
                    })
                    console.log(examRoom);
                    res.json(MessageResponse("Create Success !"));
                    return;
                }
            }
        }
        else {
            const checkLecLogTime = await ExaminerLogTime.findOne({
                where: {
                    day: examSlot.day,
                    timeSlotId: timeSlot.id,
                    examinerId: parseInt(examiner.id),
                    semId: parseInt(semester.id)
                }
            })
            const checkRoomLogTime = await RoomLogTime.findOne({
                where: {
                    day: examSlot.day,
                    timeSlotId: timeSlot.id,
                    roomId: roomId,
                    semId: parseInt(semester.id)
                }
            })
            if (!checkLecLogTime && !checkRoomLogTime) {
                const examRoom = await ExamRoom.create({
                    sSId: sSId,
                    roomId: roomId,
                    examinerId: parseInt(examiner.id),
                })
                // changeCourseStatus(currentExamPhase.id, subInSlot.courId);
                res.json(MessageResponse("Create Success !"));
                return;
            } else {
                res.json(MessageResponse(`This examiner ${examiner.id} or room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} - ${examSlot.day}`))
                return;
            }

        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//require role staff để cái middle ware reqRole đây
router.post('/auto', async (req, res) => {
    //lấy id thông qua token
    const staffId = parseInt(res.locals.userData.id) || 1;
    // const staffId = 1;
    const examphaseId = req.body.examphaseId;
    try {
        const message = await autoFillLecturerToExamRoom(staffId, examphaseId);
        res.json(MessageResponse(message));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }

})

//update lecturerId to 1 examRoom //đăng kí
//có 1 giao diện như cái excel của thầy phương
//nhận từ giao diện về giờ, ngày, lecid => examslotid
//examslotid => sub in slot (tìm được slot đó có môn nào)
//=> xuống exam room xem (mỗi phòng của môn đó trong giờ đã có lecturer chưa, chưa thì filed random lec vô cái)
//thêm giành cho role lecturer | lect tự đăng kí 
//PASS , requireRole('lecturer')
router.put('/lecturer', requireRole('lecturer'), async (req, res) => {
    //route đăng kí của lecturer
    const lecturerId = parseInt(res.locals.userData.id);
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;
    const incomingPhase = parseInt(req.body.exPhaseId);

    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    try {
        const result = await lecRegister(lecturerId, startTime, endTime, day, incomingPhase)
        res.json(MessageResponse(result));
        return;
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

// hủy đăng ký
// PASS , requireRole('lecturer')
router.put('/delLecturer', requireRole('lecturer'), async (req, res) => {
    //hủy đăng kí của 1 lecturer
    const lecturerId = parseInt(res.locals.userData.id);
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;
    const incomingPhase = parseInt(req.body.exPhaseId);

    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    try {
        const result = await lecUnRegister(lecturerId, startTime, endTime, day, incomingPhase);
        res.json(MessageResponse(result));
        return;
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//thêm lecturer cho role staff
//require role staff
router.put('/addExaminer', requireRole('staff'), async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);//lấy từ token
    // const staffId = 1
    //thêm lecturer của staff
    const examRoomId = parseInt(req.body.examRoomId)
    const examinerId = parseInt(req.body.examinerId)
    //id ở đây là examRoom id
    try {
        const result = await addExaminerForStaff(staffId, examRoomId, examinerId);
        res.json(MessageResponse(result));
        return;
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})

// update roomId to 1 examRoom
//role staff , requireRole("staff")
router.put('/room', requireRole("staff"), async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    // const staffId = 1;

    //thêm phòng của staff
    const examRoomId = parseInt(req.body.examRoomId)
    const roomId = parseInt(req.body.roomId)
    try {
        const result = await addRoomByStaff(staffId, examRoomId, roomId);
        res.json(MessageResponse(result));
        return;
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//delete 1 roomId from examRoom
//role staff , requireRole("staff")
router.put('/delRoom', requireRole("staff"), async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    // const staffId = 1;

    //staff nhìn vô bảng examRoom thấy lỗi chỗ nào bấm
    //client bắt r trả id dòng đó về và update roomId dòng đó thành null
    const examRoomId = parseInt(req.body.examRoomId)
    try {
        const result = await delRoomByStaff(staffId, examRoomId);
        res.json(MessageResponse(result));
        return;
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//get examList By Staff
router.get('/', async (req, res) => {
    try {
        const examRoomList = await ExamRoom.findAll();
        let examList = [];
        let i = 1
        for (const key in examRoomList) {
            let item = {
                no: "",
                startTime: "",
                endTime: "",
                day: "",
                subCode: "",
                subName: "",
                roomCode: "",
                roomLocation: "",
                lecturerCode: "",
            }
            if (Object.hasOwnProperty.call(examRoomList, key)) {
                const element = examRoomList[key];
                const room = await Room.findOne({
                    where: {
                        id: element.roomId
                    }
                })
                if (room != null) {
                    item.roomCode = room.dataValues.id
                    item.roomLocation = room.location
                }
                if (element.lecturerId) {
                    const lecturer = await Lecturer.findOne({
                        where: {
                            id: element.lecturerId
                        }
                    })
                    item.lecturerCode = lecturer.lecId
                }
                const subInSlot = await SubInSlot.findOne({
                    where: {
                        id: element.sSId
                    }
                })
                const course = await Course.findOne({
                    where: {
                        id: subInSlot.courId
                    }
                })
                const subject = await Subject.findOne({
                    where: {
                        id: course.subId
                    }
                })
                item.subCode = subject.code
                item.subName = subject.name
                const examSlot = await ExamSlot.findOne({
                    where: {
                        id: subInSlot.exSlId
                    }
                })
                item.day = examSlot.day
                const timeSlot = await TimeSlot.findOne({
                    where: {
                        id: examSlot.timeSlotId
                    }
                })
                item.startTime = timeSlot.startTime
                item.endTime = timeSlot.endTime
                item.no = i++
            }
            examList.push(item)
        }
        if (examList.length === 0) {
            res.json(InternalErrResponse())
        } else {
            res.json(DataResponse(examList))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//tất cả examiner rảnh tại examslot
//role staff
router.get('/allExaminerInSlot', requireRole('staff'), async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    // const staffId = 1;
    const examslotId = parseInt(req.query.examslotId);

    try {
        const result = await getAllAvailableExaminerInSlot(staffId, examslotId);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
            return;
        } else {
            res.json(MessageResponse(result));
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//tất cả ... trong 1 examSlot có trong examRoom
router.get('/getCourseOneSlot', requireRole('staff'), async (req, res) => {
    const exSlotID = parseInt(req.query.exSlotID);
    try {
        const result = await getAllCourseOneSlot(exSlotID);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
            return;
        } else {
            res.json(NotFoundResponse());
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//tất cả course trong 1 examSlot và số học sinh thi môn đó trong examRoom
router.get('/getCourseAndNumOfStuOneSlot', requireRole('staff'), async (req, res) => {
    const exSlotID = parseInt(req.query.exSlotID);
    try {
        const result = await getAllCourseAndNumOfStudentOneSlot(exSlotID);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
            return;
        } else {
            res.json(NotFoundResponse());
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//tất cả room đc xếp trong exslot này
router.get('/getRoomOneSlot', requireRole('staff'), async (req, res) => {
    const exSlotID = parseInt(req.query.exSlotID);
    try {
        const result = await getAllRoomOneSlot(exSlotID);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
            return;
        } else {
            res.json(NotFoundResponse());
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//tất cả examiner đc xếp trong exslot này
router.get('/getExaminerOneSlot', requireRole('staff'), async (req, res) => {
    const exSlotID = parseInt(req.query.exSlotID);
    try {
        const result = await getAllExaminerOneSlot(exSlotID);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
            return;
        } else {
            res.json(NotFoundResponse());
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
});
//ngày, giờ, môn, phòng, ai coi, status đc sửa không
router.get('/getExamRoomDetailByPhase', requireRole('staff'), async (req, res) => {
    const examSlotId = parseInt(req.query.examSlotId);
    try {
        const result = await getDetailScheduleOneExamSlot(examSlotId);
        if (Array.isArray(result)) {
            res.json(DataResponse(result));
            return;
        } else {
            res.json(NotFoundResponse());
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

export default router