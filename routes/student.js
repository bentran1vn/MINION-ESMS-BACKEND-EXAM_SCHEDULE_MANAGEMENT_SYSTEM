import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import User from '../models/User.js'
import { requireRole } from '../middlewares/auth.js'
import Student from '../models/Student.js'
import { Op } from 'sequelize'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import StudentExam from '../models/StudentExam.js'
import Room from '../models/Room.js'
import Lecturer from '../models/Lecturer.js'
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student.
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: int
 *                 example: 25
 *               uniId:
 *                 type: string
 *                 example: SE141200
 *               semester:
 *                 type: int
 *                 example: 5
 *               major:
 *                 type: string
 *                 example: Software Engineer
 *           required:
 *             - userId
 *             - uniId
 *             - semester
 *             - major
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

/**
 * @swagger
 * /students/listOfStu:
 *   get :
 *     summary : Return the list of student based on subCode, roomNum
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subCode:
 *                 type: string
 *                 example: PRF192
 *               roomNum:
 *                 type: string
 *                 example: 101
 *           required:
 *             - subCode
 *             - roomNum
 *     responses :
 *       200 :
 *         description: OK !
 */

/**
 * @swagger
 * /students/listScheOfStu:
 *   get :
 *     summary : Returns a list of exam schedules for a student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: int
 *                 example: 1
 *           required:
 *             - studentId
 *     responses :
 *       200 :
 *         description: OK !
 */

/**
 * @swagger
 * tags:
 *    name: Courses
 *    description: The student managing API
 */

const router = express.Router()

router.post('/', async (req, res) => {
    const { userId, uniId, semester, major } = req.body;

    try {
        const user = await User.findOne({
            where: {
                id: parseInt(userId),
            }
        })

        if (!user) {
            res.json(NotFoundResponse())
            return;
        } else {
            const student = await Student.create({
                userId: parseInt(userId),
                uniId: uniId,
                semester: parseInt(semester),
                major: major
            })
            console.log(student);
            res.json(DataResponse(student))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/listOfStu', async (req, res) => {
    const { subCode, roomNum } = req.body
    try {
        const subject = await Subject.findOne({
            where: {
                code: subCode
            }
        })
        if (!subject) {
            res.json(MessageResponse('The subject Code maybe wrong'))
            return
        }

        const course = await Course.findOne({
            where: {
                subId: subject.id
            }
        })

        const subInSlot = await SubInSlot.findAll({
            where: {
                courId: course.id
            }
        })

        const subInSlotArr = []
        subInSlot.forEach(element => {
            subInSlotArr.push(element.id)
        });

        let examRoom = []
        if (roomNum !== "") {
            const room = await Room.findOne({
                where: {
                    roomNum: roomNum
                }
            })

            examRoom = await ExamRoom.findAll({
                where: {
                    [Op.and]: [
                        { sSId: subInSlotArr },
                        { roomId: room.id }
                    ]
                }
            })
        } else {
            examRoom = await ExamRoom.findAll({
                where: {
                    sSId: subInSlotArr
                }
            })
        }
        if (examRoom.length === 0) {
            res.json(MessageResponse('The roomNum maybe wrong'))
            return
        }

        const examRoomArr = []
        examRoom.forEach(element => {
            if (!examRoomArr.includes(element.roomId)) {
                examRoomArr.push(element.roomId)
            }
        });

        const listStuOfSub = []
        const studentExam = await StudentExam.findAll({
            where: {
                eRId: {
                    [Op.or]: examRoomArr
                }
            },
            attributes: ['stuId'],
        })

        studentExam.forEach(element => {
            listStuOfSub.push(element.stuId)
        });

        const student = await Student.findAll({
            where: {
                id: {
                    [Op.or]: listStuOfSub
                }
            }
        })

        res.json(DataResponse(student))
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found'))
    }
})

router.get('/listScheOfStu', async (req, res) => {
    const studentId = parseInt(req.body.studentId)

    const listOfSche = []
    function insertSchedule(sc, sn, st, et, d, r, lc) {
        const sche = {
            subCode: sc, subName: sn, sTime: st, eTime: et, day: d, roomNum: r, location: lc
        }
        listOfSche.push(sche)
    }
    try {
        const studentExam = await StudentExam.findAll({
            where: {
                stuId: studentId
            }
        })

        const ERIdArr = []
        studentExam.forEach(element => {
            ERIdArr.push(element.eRId)
        });

        for (let i = 0; i < ERIdArr.length; i++) {
            const examRoom = await ExamRoom.findOne({
                where: {
                    id: ERIdArr[i]
                }
            })

            if (examRoom) {
                const subInSlot = await SubInSlot.findOne({
                    where: {
                        id: examRoom.sSId
                    }
                })

                if (subInSlot) {
                    const room = await Room.findOne({
                        where: {
                            id: examRoom.roomId
                        }
                    })


                    const examSlot = await ExamSlot.findOne({
                        where: {
                            id: subInSlot.exSlId
                        }
                    })

                    let sTime, eTime
                    if (examSlot) {
                        const timeSlot = await TimeSlot.findOne({
                            where: {
                                id: examSlot.timeSlotId
                            }
                        })
                        sTime = timeSlot.startTime
                        eTime = timeSlot.endTime
                    }


                    const course = await Course.findOne({
                        where: {
                            id: subInSlot.courId
                        }
                    })

                    let subCode, subName
                    if (course) {
                        const subject = await Subject.findOne({
                            where: {
                                id: course.subId
                            }
                        })
                        subCode = subject.code
                        subName = subject.name
                    }
                    insertSchedule(subCode, subName, sTime, eTime, examSlot.day, ERIdArr[i], room.location)
                }
            }

        };
        res.json(DataResponse(listOfSche))
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found'))
    }
})

export default router
//add xong