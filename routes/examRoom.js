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
 *          - des 
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
 *               examinerId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - sSId
 *             - roomId
 *             - examinerId
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
 *           required:
 *             - userId
 *             - startTime
 *             - endTime
 *             - day
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
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               userId:
 *                 type: integer
 *                 description: Reference to User, take staff, lecturer, volunteer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - id
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
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - id
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
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Room ${checkExRoom.roomId} is deleted, room log time updated
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

router.post('/', async (req, res) => {
    const sSId = parseInt(req.body.sSId);
    const roomId = parseInt(req.body.roomId);
    const userId = parseInt(req.body.userId);

    try {
        const user = await User.findOne({
            where: {
                id: userId
            }
        })
        if (!user) {
            res.json(MessageResponse("Not found user ID"));
            return;
        }
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
            res.json(MessageResponse("Table semester has no data of current date"));
            return;
        }

        const currentExamPhase = await ExamPhase.findOne({
            where: {
                start: {
                    [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
                },
                end: {
                    [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
                },
            }
        })
        if ( (!currentExamPhase && examSlot.day < timeFormatted) || (currentExamPhase && (currentExamPhase.endDay >= examSlot.day))) {
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
                console.log(examRoom);
                res.json(MessageResponse("Create Success !"));
                return;
            } else {
                res.json(MessageResponse(`This examiner ${examiner.id} or room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} - ${examSlot.day}`))
                return;
            }

        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})
//auto fill lecturer
//loc ra phong nao dang thieu lecturer, sau do truy nguoc lai timeslot, day
//random 1 lecturerId trong mang lecturer sau do nhet id no vo 1 dong bat ki co lecId null trong exam room
//lay thong tin cua dong do qua bang logtime cua lec de xem ko co thi add, co thi random nguoi khac
//tự thêm lec vô examRoom
//hệ thống tự lấy về staff id dựa vào token
// PASS //auto này cũng require role staff để cái middle ware reqRole đây
router.post('/auto', async (req, res) => {
    //lấy id thông qua token
    const staffId = parseInt(res.locals.userData.id);

    try {
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

        const lecturer = await User.findAll({
            where: {
                role: 'lecturer'
            }
        })

        lecturer.forEach(async (item) => {
            const check = await Examiner.findOne({
                where: {
                    userId: item.dataValues.id,
                    semesterId: parseInt(semester.id)
                }
            })
            if (!check) {
                const lecToExaminer = await Examiner.create({
                    userId: item.dataValues.id,
                    typeExaminer: 0,
                    semesterId: parseInt(semester.id),
                    status: 0
                })
                if (!lecToExaminer) {
                    res.json(MessageResponse(`Error when add lecturer ${item.dataValues.id} to examiner`));
                    return;
                }else{
                    const stafflog = await StaffLogChange.create({
                        rowId: parseInt(lecToExaminer.id),
                        tableName: 5,
                        userId: staffId,
                        typeChange: 10
                    })
                    if(!stafflog){
                        res.json("Fail to update staff log change");
                        return;
                    }
                }
            }else if(check && check.status == 1){
                const row = await Examiner.update({status: 0}, {
                    where:{
                        userId: item.dataValues.id,
                        semesterId: parseInt(semester.id)
                    }
                })
                if(row[0] == 0){
                    res.json(MessageResponse(`Fail to update status of examiner ${check.id}`));
                    return;
                }else{
                    const stafflog = await StaffLogChange.create({
                        rowId: parseInt(check.id),
                        tableName: 5,
                        userId: staffId,
                        typeChange: 10
                    })
                    if(!stafflog){
                        res.json("Fail to update staff log change");
                        return;
                    }
                }
            }
        });

        const examiner = await Examiner.findAll({
            where: {
                semesterId: parseInt(semester.id),
                status: 0
            }
        });

        if (examiner.length == 0) {
            res.json(MessageResponse("Current semester doesn't have any examiner"));
            return;
        }
        const examinerList = examiner.map(ex => ex.dataValues);
        const examinerIdList = examinerList.map(exL => exL.id);

        const roomNoExaminer = await ExamRoom.findAll({
            where: {
                examinerId: null
            }
        });
        if (roomNoExaminer.length == 0) {
            res.json("All rooms assigned");
            return;
        }
        let roomToSchedule = [];
        roomNoExaminer.forEach(async (item) => {
            const subInSlot = await SubInSlot.findOne({
                where: {
                    id: item.dataValues.sSId
                }
            })
            const examSlot = await ExamSlot.findOne({
                where: {
                    id: subInSlot.exSlId
                }
            })
            if ( examSlot > timeFormatted ) {
                roomToSchedule.push(item);
            }
        });

        // const randomLecId = getRandomLecturerId(lecIdList);       
        const roomEmpty = roomToSchedule.map(examRoom => examRoom.dataValues);
        for (const item of roomEmpty) {
            const id = item.id;
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
            let i = 0;
            for (i; i < examinerIdList.length; i++) {
                const randomLecId = examinerIdList[i];
                const checkLecLogTime = await ExaminerLogTime.findOne({
                    where: {
                        examinerId: randomLecId,
                        timeSlotId: timeSlot.id,
                        day: examSlot.day,
                        semId: parseInt(semester.id),
                    }
                })
                if (!checkLecLogTime) {
                    const examRoom = await ExamRoom.update({
                        examinerId: randomLecId
                    }, {
                        where: {
                            id: id
                        }
                    })
                    if (examRoom) {
                        
                        const updateLecLogTime = await ExaminerLogTime.create({
                            examinerId: randomLecId,
                            timeSlotId: timeSlot.id,
                            day: examSlot.day,
                            semId: parseInt(semester.id)
                        })
                        break;
                    }
                }
            }
        }
        const examRoomAtferfill = await ExamRoom.findAll({
            where: {
                lecturerId: null
            }
        })
        if (examRoomAtferfill.length != 0) {
            const staffLog = await StaffLogChange.create({
                tableName: 0,
                staffId: staffId,
                typeChange: 1,
            })
            res.json(MessageResponse("Number of examiner not enough to fill up exam room"));
            return;
        } else {
            const staffLog = await StaffLogChange.create({
                tableName: 0,
                staffId: staffId,
                typeChange: 1,
            })
            res.json(MessageResponse("All rooms assigned"));
            return;
        }

    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }

})
function getRandomLecturerId(array) {
    // hàm lấy random lecId
    let i = 0;
    const randomIndex = Math.floor(Math.random() * array.length);
    for (i; i < array.length; i++) {
        if (i == randomIndex) return array[i];
    }
}


//update lecturerId to 1 examRoom
//có 1 giao diện như cái excel của thầy phương
//nhận từ giao diện về giờ, ngày, lecid => examslotid
//examslotid => sub in slot (tìm được slot đó có môn nào)
//=> xuống exam room xem (mỗi phòng của môn đó trong giờ đã có lecturer chưa, chưa thì filed random lec vô cái)
//thêm giành cho role lecturer | lect tự đăng kí 
//PASS , requireRole('lecturer')
router.put('/lecturer', async (req, res) => {
    //route đăng kí của lecturer
    const lecturerId = parseInt(req.body.userId);
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;
    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    try {
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
        const examiner = await Examiner.findOne({
            where: {
                userId: parseInt(lecturerId),
                semesterId: parseInt(semester.id)
            }
        })
        if (examiner && examiner.dataValues.status == 1) {
            const row = await Examiner.update({ status: 0 }, {
                where: {
                    userId: lecturerId,
                    semesterId: parseInt(semester.id)
                }
            })
        }
        if (!examiner) {
            await Examiner.create({
                userId: parseInt(lecturerId),
                typeExaminer: 0,
                semesterId: parseInt(semester.id),
                status: 0
            })
        }
        const lecToExaminer = await Examiner.findOne({
            where: {
                userId: lecturerId,
                semester: parseInt(semester.id)
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: { startTime: startTime, endTime: endTime }
        })

        const examSlot = await ExamSlot.findOne({
            where: { day: day, timeSlotId: timeSlot.id },
        });

        let subjectInSlot = await SubInSlot.findAll({
            where: { exSlId: examSlot.id },
        });

        let subInSlot2 = [];
        subjectInSlot.forEach(async (item) => {
            const examSlot = await ExamSlot.findOne({
                id: item.dataValues.exSlId
            })
            if (examSlot.day > timeFormatted) { // đổi lại thành exPh
                subInSlot2.push(item);
            }
        });

        if (subInSlot2.length == 0) {
            res.json(MessageResponse(`Incoming exam phase doesn't have any exam room for this ${startTime} - ${endTime}`));
            return;
        }

        const subInSlotArray = subInSlot2.map(subInSlot => subInSlot.dataValues);
        const idArray = subInSlotArray.map(item => item.id);
        if (idArray.length != 0) {
            const roomsToUpdate = await ExamRoom.findAll({
                where: {
                    examinerId: null,
                    sSId: {
                        [Op.or]: idArray
                    },
                },
            });
            const row = await ExamRoom.findOne({
                where: {
                    sSId: {
                        [Op.or]: idArray
                    },
                    examinerId: lecToExaminer.id,
                }
            })
            if (row) {
                res.json(MessageResponse(`Examiner ${lecToExaminer.id} is already has room and can't take more`))
                return;
            } else {
                const randomIndex = Math.floor(Math.random() * roomsToUpdate.length);
                let i = 0;
                let check = 0;
                for (i; i < roomsToUpdate.length; i++) {
                    if (i == randomIndex) {
                        roomsToUpdate[i].update({ examinerId: lecToExaminer.id })
                        check++;
                    }
                }
                if (check != 0) {
                    const lecLog = await ExaminerLogTime.create({
                        examinerId: lecToExaminer.id,
                        day: day,
                        timeSlotId: timeSlot.id,
                        semId: parseInt(semester.id)
                    })
                    if (!lecLog) {
                        res.json(MessageResponse("Error when input examiner to examiner log time."))
                        return;
                    } else {
                        res.json(MessageResponse('Examiner added'));
                        return;
                    }
                } else {
                    res.json(MessageResponse('All rooms full'));
                    return;
                }
            }
        } else {
            res.json(MessageResponse("This slot hasn't have any subject"));
            return;
        }


    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})
//delete 1 lecturerId from examRoom
//kiểm tra xem giờ đó, ngày đó còn lecturerId đó nữa không
//truy ra id giờ => dựa vào id timeslot và id lecturer xong xóa lecturerid đó trong bảng examRoom
//xóa dành cho role lecturer
// hủy đăng ký
// PASS , requireRole('lecturer')
router.put('/delLecturer', async (req, res) => {
    //hủy đăng kí của 1 lecturer
    const lecturerId = req.body.userId;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;

    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    try {
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
        const examiner = await Examiner.findOne({
            where: {
                userId: parseInt(lecturerId),
                semesterId: parseInt(semester.id)
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: { startTime: startTime, endTime: endTime }
        })

        const examSlot = await ExamSlot.findOne({
            where: { day: day, timeSlotId: timeSlot.id },
        });

        let subjectInSlot = await SubInSlot.findAll({
            where: { exSlId: examSlot.id },
        });

        let subInSlot2 = [];
        subjectInSlot.forEach(async (item) => {
            const examSlot = await ExamSlot.findOne({
                id: item.dataValues.exSlId
            })
            if (examSlot.day > timeFormatted) {
                subInSlot2.push(item);
            }
        });

        if (subInSlot2.length == 0) {
            res.json(MessageResponse(`Current semester doesn't have any exam room for this ${startTime} - ${endTime}`));
            return;
        }

        const subInSlotArray = subInSlot2.map(subInSlot => subInSlot.dataValues);
        const idArray = subInSlotArray.map(item => item.id);
        // console.log(idArray);
        //ds SSId của 1 examSlot

        // const room = roomsToUpdate.map(r => r.dataValues)
        // console.log(room); //ds empty room 
        if (idArray.length != 0) {
            const roomOccupiedByLecturer = await ExamRoom.findOne({
                where: {
                    examinerId: parseInt(examiner.id),
                    sSId: {
                        [Op.or]: idArray
                    },
                },
            });
            if (roomOccupiedByLecturer) {
                const check = await ExamRoom.update({
                    examinerId: null
                }, {
                    where: {
                        id: roomOccupiedByLecturer.id
                    }
                })
                if (check[0] != 0) {
                    const lecLog = await ExaminerLogTime.destroy({
                        where: {
                            examinerId: parseInt(examiner.id),
                            timeSlotId: timeSlot.id,
                            day: day,
                            semId: parseInt(semester.id)
                        }
                    })
                    if (lecLog) {
                        res.json(MessageResponse(`Examiner ${examiner.id} is removed from this slot, examiner log time updated`))
                        return;
                    } else {
                        res.json(MessageResponse("Error when update examiner log time"))
                        return;
                    }
                }
            } else {
                res.json(MessageResponse(`Examiner ${examiner.id} hasn't assigned yet.`))
            }

        } else {
            res.json(MessageResponse("This slot hasn't have any subject"));
            return;
        }


    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }



})

//thêm lecturer cho role staff
// add thẳng tay dựa vào id của exam room (dòng cần thay đổi)
// không thông qua giờ như lec tự đăng kí
//, requireRole("staff")
// PASS
router.put('/addExaminer', async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    //thêm lecturer của staff
    const { id, userId } = req.body;
    if (!userId) {
        res.json(MessageResponse("User id is required"));
        return;
    }
    try {
        const statusMap = new Map([
            ['lecturer', 0],
            ['staff', 1],
            ['volunteer', 2]
        ]);
        const user = await User.findOne({
            id: parseInt(userId)
        })
        if (!user) {
            res.json(MessageResponse("This user ID doesn't exist"));
            return;
        }
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
        const examiner = await Examiner.findOne({
            userId: parseInt(userId),
            semesterId: parseInt(semester.id)
        })
        if (examiner.status == 1) {
            await Examiner.update({ status: 0 }, {
                where: {
                    userId: parseInt(userId),
                    semesterId: parseInt(semester.id)
                }
            })
            await StaffLogChange.create({
                rowId: parseInt(examiner.id),
                tableName: 5,
                userId: staffId,
                typeChange: 10
            })
        } else {
            const e = await Examiner.create({
                userId: parseInt(userId),
                semesterId: parseInt(semester.id),
                status: 0,
                typeExaminer: statusMap.get(user.role)
            })
            await StaffLogChange.create({
                rowId: parseInt(e.id),
                tableName: 5,
                userId: staffId,
                typeChange: 10
            })
        }
        const lecToExaminer = await Examiner.findOne({
            where: {
                userId: parseInt(userId),
                semesterId: parseInt(semester.id)
            }
        })

        const checkExRoom = await ExamRoom.findOne({
            where: {
                id: parseInt(id)
            }
        })
        if (!checkExRoom) {
            res.json(NotFoundResponse());
            return;
        }

        const subSlot = await SubInSlot.findOne({
            where: {
                id: checkExRoom.sSId
            }
        })
        const exSlot = await ExamSlot.findOne({
            where: {
                id: subSlot.exSlId
            }
        })
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
        if ( (!currentExamPhase && exSlot.day < timeFormatted) || (currentExamPhase && (currentExamPhase.endDay >= exSlot.day))) {
            res.json(MessageResponse("Can't change on-going or passed schedule"));
            return;
        }

        const timeSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(exSlot.timeSlotId)
            }
        })
        if (subSlot && exSlot && timeSlot) {
            const checkLecLogTime = await ExaminerLogTime.findOne({
                where: {
                    examinerId: parseInt(lecToExaminer.id),
                    timeSlotId: timeSlot.id,
                    day: exSlot.day,
                    semId: parseInt(semester.id)
                }
            })
            if (!checkLecLogTime) {
                const examRoom = ExamRoom.update({
                    examinerId: parseInt(lecToExaminer.id)
                }, {
                    where: {
                        id: parseInt(id)
                    }
                })
                if (examRoom[0] === 0) {
                    res.json(MessageResponse('Add Failed !'));
                    return;
                } else {
                    const staffLog = await StaffLogChange.create({
                        rowId: parseInt(id),
                        staffId: staffId,
                        tableName: 0,
                        typeChange: 0
                    })
                    
                    const addToLecLogTime = await ExaminerLogTime.create({
                        examinerId: parseInt(lecToExaminer.id),
                        timeSlotId: timeSlot.id,
                        day: exSlot.day,
                        semId: parseInt(semester.id)
                    })
                    if (addToLecLogTime) {
                        res.json(MessageResponse("Add Success to exam room and update examiner log time !"));
                        return;
                    } else {
                        res.json(MessageResponse("Error when update examiner log time"));
                        return;
                    }
                }
            } else {
                res.json(MessageResponse(`Examiner ${lecToExaminer.id} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${exSlot.day}`))
                return;
            }
        } else {
            res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
            return;
        }

    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }

})


// update roomId to 1 examRoom
//update cái này thêm cập nhật room qua room log time
//role staff , requireRole("staff")
router.put('/room', async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    //thêm phòng của staff
    const id = parseInt(req.body.id)
    const roomId = parseInt(req.body.roomId)
    try {
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

        const checkExRoom = await ExamRoom.findOne({
            where: {
                id: id
            }
        })
        if (!checkExRoom) {
            res.json(NotFoundResponse());
            return;
        }
        const subjectInSlot = await SubInSlot.findOne({
            where: {
                id: parseInt(checkExRoom.sSId)
            }
        })
        const examSlot = await ExamSlot.findOne({
            where: {
                id: parseInt(subjectInSlot.exSlId)
            }
        })
        if (examSlot.day < semester.startDay) {
            res.json(MessageResponse("Can't add room to passed semester"));
            return;
        }

        const timeSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(examSlot.timeSlotId)
            }
        })
        if (subjectInSlot && examSlot && timeSlot) {
            const checkRoomLogTime = await RoomLogTime.findOne({
                where: {
                    roomId: roomId,
                    timeSlotId: timeSlot.id,
                    day: examSlot.day,
                    semId: parseInt(semester.id)
                }
            })
            if (!checkRoomLogTime) {
                const examRoom = ExamRoom.update({
                    roomId: roomId
                }, {
                    where: {
                        id: id
                    }
                })
                if (examRoom[0] === 0) {
                    res.json(MessageResponse('Add Failed !'));
                    return;
                } else {
                    const staffLog = await StaffLogChange.create({
                        rowId: id,
                        staffId: staffId,
                        tableName: 0,
                        typeChange: 1
                    })
                    if (!staffLog) {
                        throw new Error("Create staff log failed");
                    }
                    const roomLogTime = await RoomLogTime.create({
                        roomId: roomId,
                        timeSlotId: timeSlot.id,
                        day: examSlot.day,
                        semId: parseInt(semester.id),
                    })
                    if (roomLogTime) {
                        res.json(MessageResponse("Add Success room to exam room and update room log time!"));
                        return;
                    } else {
                        res.json(MessageResponse("Error when update room log time"));
                        return;
                    }
                }
            } else {
                res.json(MessageResponse(`Room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${examSlot.day}`))
                return;
            }
        } else {
            res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
            return;
        }

    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//delete 1 roomId from examRoom
//role staff , requireRole("staff")
router.put('/delRoom', async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    //staff nhìn vô bảng examRoom thấy lỗi chỗ nào bấm
    //client bắt r trả id dòng đó về và update roomId dòng đó thành null
    const id = parseInt(req.body.id)
    try {
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
        const checkExRoom = await ExamRoom.findOne({
            where: {
                id: id
            }
        })
        if (!checkExRoom) {
            res.json(NotFoundResponse());
            return;
        }

        const subjectInSlot = await SubInSlot.findOne({
            where: {
                id: parseInt(checkExRoom.sSId)
            }
        })
        const examSlot = await ExamSlot.findOne({
            where: {
                id: parseInt(subjectInSlot.exSlId)
            }
        })
        if (examSlot.day < semester.startDay) {
            res.json(MessageResponse("Can't delete room of passed semester"));
            return;
        }
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(examSlot.timeSlotId)
            }
        })
        if (subjectInSlot && examSlot && timeSlot) {
            const examRoom = await ExamRoom.update({
                roomId: null
            }, {
                where: {
                    id: id
                }
            })
            if (examRoom[0] != 0) {
                const staffLog = await StaffLogChange.create({
                    rowId: id,
                    staffId: staffId,
                    tableName: 0,
                    typeChange: 1
                })
                if (!staffLog) {
                    throw new Error("Create staff log failed");
                }
                const delRoomLogTime = await RoomLogTime.destroy({
                    where: {
                        roomId: checkExRoom.roomId,
                        timeSlotId: timeSlot.id,
                        day: examSlot.day,
                        semId: parseInt(semester.id)
                    }
                })
                if (delRoomLogTime != 0) {
                    res.json(MessageResponse(`Room ${checkExRoom.roomId} is deleted, room log time updated`))
                    return;
                } else {
                    res.json(MessageResponse("Error when update room log time"));
                    return;
                }
            } else {
                res.json(MessageResponse("Error when update exam room"));
                return;
            }
        } else {
            res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
            return;
        }

    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//get examList By Staff
router.get('/', async (req, res) => {
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

})

//tất cả lecturer rảnh tại cùng 1 giờ 1 ngày
//role staff
//PASS
router.get('/allExaminerInSlot', async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);

    const { startTime, endTime, day } = req.body;

    try {
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
        const timeSlot = await TimeSlot.findOne({
            where: {
                startTime: startTime,
                endTime: endTime,
            }
        })
        if (!timeSlot) {
            res.json(MessageResponse("This start time and end time dont exist!"));
            return;
        }
        // console.log(timeSlot.id);

        const statusMap = new Map([
            ['lecturer', 0],
            ['staff', 1],
            ['volunteer', 2]
        ]);
        const user = await User.findAll({
            where: {
                role: {
                    [Op.or]: ['lecturer', 'staff', 'volunteer']
                }
            }
        });

        let check = 0;
        user.forEach(async (item) => {
            const examiner = await Examiner.findOne({
                where: {
                    userId: parseInt(item.dataValues.id),
                    semesterId: parseInt(semester.id),
                }
            })
            if (!examiner) {
                const ex = await Examiner.create({
                    userId: item.dataValues.id,
                    typeExaminer: statusMap.get(item.dataValues.role),
                    semesterId: parseInt(semester.id),
                    status: 0
                })
                check++;
            }else if(examiner.status == 1){
                await Examiner.update({status: 0}, {
                    where: {
                        userId: parseInt(item.dataValues.id),
                        semesterId: parseInt(semester.id),
                    }
                })
                check++;
            }
        });

        if(check != 0){
            await StaffLogChange.create({
                tableName: 5,
                userId: staffId,
                typeChange: 11,
            })
        }

        const allExaminer = await Examiner.findAll({
            where: {
                semesterId: parseInt(semester.id),
            }
        });
        const examinerList = allExaminer.map(ex => ex.dataValues);
        const exIdList = examinerList.map(exL => exL.id);
        // console.log(lecIdList);
        let i = 0;
        let freeLecList = [];
        for (i; i < exIdList.length; i++) {
            const availableLecturerInSlot = await ExaminerLogTime.findOne({
                where: {
                    examinerId: exIdList[i],
                    timeSlotId: timeSlot.id,
                    day: day,
                    semId: parseInt(semester.id)
                }
            })
            if (!availableLecturerInSlot) {
                const lc = {
                    examinerId: exIdList[i],
                    startTime: startTime,
                    endTime: endTime,
                    day: day
                }
                freeLecList.push(lc);
            }
        }
        console.log(freeLecList);
        if (freeLecList.length == 0) {
            res.json(MessageResponse(`All examiners are busy at ${startTime} - ${endTime} - ${day}`));
            return;
        } else {
            res.json(DataResponse(freeLecList));
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})
export default router