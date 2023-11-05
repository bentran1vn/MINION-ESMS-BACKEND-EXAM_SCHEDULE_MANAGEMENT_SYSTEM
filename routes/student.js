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
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'
import Examiner from '../models/Examiner.js'
import Semester from '../models/Semester.js'

//Swagger Model
/**
 * @swagger
 * components:
 *   schemas:
 *    Students:
 *       type: object
 *       required:
 *          - userId
 *          - uniId
 *          - semester
 *          - major 
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          userId:
 *              type: integer
 *              description: Reference to User id
 *          uniId:
 *              type: string
 *              description: Student unit code
 *          semester: 
 *              type: integer
 *              description:  4
 *          major: 
 *              type: string 
 *              description: Software Engineer
 *       example:
 *           id: 1
 *           userId: 1
 *           uniId: SE170000
 *           semester: 4
 *           major: Software Engineer
 */

//Swagger Tag
/**
 * @swagger
 * tags:
 *    name: Students
 *    description: The students managing API
 */

//Swagger Get
/**
 * @swagger
 * /students/listOfStu:
 *   get :
 *     summary : Return the list of student based on subCode, roomNum
 *     tags: [Students]
 *     parameters:
 *        - in: query
 *          name: subCode
 *          schema:
 *            type: string
 *          required: true
 *          description: The code of subject Client want to find
 *        - in: query
 *          name: roomNum
 *          schema:
 *            type: string
 *          required: true
 *          description: The room number Client want to find
 *     responses :
 *       '200' :
 *         description: List all student successfully !
 *       '500':
 *         description: Can not list all student !
 */

//Swagger Get
/**
 * @swagger
 * /students/listScheOfStu:
 *   get :
 *     summary : Returns a list of exam schedules for a student
 *     tags: [Students]
 *     parameters:
 *        - in: query
 *          name: studentId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The student id Client want to find
 *     responses :
 *       200 :
 *         description: List student with that id successfully !
 *       '500':
 *         description: Can not list student with that id !
 */

const router = express.Router()

// router.post('/', async (req, res) => {
//     const { userId, uniId, semester, major } = req.body;

//     try {
//         const user = await User.findOne({
//             where: {
//                 id: parseInt(userId),
//             }
//         })

//         if (!user) {
//             res.json(NotFoundResponse())
//             return;
//         } else {
//             const student = await Student.create({
//                 userId: parseInt(userId),
//                 uniId: uniId,
//                 semester: parseInt(semester),
//                 major: major
//             })
//             console.log(student);
//             res.json(DataResponse(student))
//         }

//     } catch (err) {
//         console.log(err)
//         res.json(InternalErrResponse());
//     }
// })

router.get('/listOfStu', async (req, res) => {
    const { subCode, roomNum } = req.query
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
    const studentId = parseInt(req.query.studentId)

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


//get lịch thi của 1 stu theo semester
router.get('/scheduleOfStuBySemester', async (req, res) => {
    // const userId = parseInt(req.locals.userData.id); //token
    const userId = 6; //thg stu đầu tiên
    const semId = parseInt(req.query.semesterId);
    try {
        const semester = await Semester.findOne({
            where: {
                id: semId
            }
        })
        const student = await Student.findOne({
            where: {
                userId: userId
            }
        })
        const stuEx = await StudentExam.findAll({
            where: {
                stuId: student.id
            }
        })
        let schePerSemester = [];
        for (const st of stuEx) {
            const exRoom = await ExamRoom.findOne({
                where: {
                    id: st.dataValues.eRId
                }
            })
            const subSlot = await SubInSlot.findOne({
                where: {
                    id: exRoom.sSId
                }
            })
            const course = await Course.findOne({
                where: {
                    id: subSlot.courId
                }
            })
            const subject = await Subject.findOne({
                where: {
                    id: course.subId
                }
            })
            const exslot = await ExamSlot.findOne({
                where: {
                    id: subSlot.exSlId
                }
            })
            const timeSlot = await TimeSlot.findOne({
                where: {
                    id: exslot.timeSlotId
                }
            })
            const room = await Room.findOne({
                where: {
                    id: exRoom.roomId
                }
            })
            if (exslot.day >= semester.start && exslot.day <= semester.end) {
                const s = {
                    subCode: subject.code,
                    subName: subject.name,
                    day: exslot.day,
                    roomNum: room.roomNum,
                    time: `${timeSlot.startTime}-${timeSlot.endTime}`,
                }
                schePerSemester.push(s);
            }
        }
        res.json(DataResponse(schePerSemester));
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }
})

//get lịch thi của 1 thg
router.get('/scheduleOfStu', async (req, res) => {
    // const userId = parseInt(req.locals.userData.id); //token
    const userId = 6; //thg stu đầu tiên
    try {
        const student = await Student.findOne({
            where: {
                userId: userId
            }
        })
        const stuEx = await StudentExam.findAll({
            where: {
                stuId: student.id
            }
        })
        let schePerSemester = [];
        for (const st of stuEx) {
            const exRoom = await ExamRoom.findOne({
                where: {
                    id: st.dataValues.eRId
                }
            })
            const subSlot = await SubInSlot.findOne({
                where: {
                    id: exRoom.sSId
                }
            })
            const course = await Course.findOne({
                where: {
                    id: subSlot.courId
                }
            })
            const subject = await Subject.findOne({
                where: {
                    id: course.subId
                }
            })
            const exslot = await ExamSlot.findOne({
                where: {
                    id: subSlot.exSlId
                }
            })
            const timeSlot = await TimeSlot.findOne({
                where: {
                    id: exslot.timeSlotId
                }
            })
            const room = await Room.findOne({
                where: {
                    id: exRoom.roomId
                }
            })

            const s = {
                subCode: subject.code,
                subName: subject.name,
                day: exslot.day,
                roomNum: room.roomNum,
                startTime: `${exslot.day} ${timeSlot.startTime}`,
                endTime: `${exslot.day} ${timeSlot.endTime}`,
                time: `${timeSlot.startTime}-${timeSlot.endTime}`
            }
            schePerSemester.push(s);
        }
        res.json(DataResponse(schePerSemester));
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }
})
export default router
//add xong