import express, { response } from 'express'
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

const router = express.Router()

router.post('/create', async (req, res) => {
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
            res.json(DataResponse(lecturer))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/scheduled', async (req, res) => {
    const id = parseInt(req.body.id);
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
        if (!result) {
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
                    "No ": i++,
                    "Subject Code": subject.code,
                    "Subject Name": subject.name,
                    "Start Time ": timeSlot.startTime || "no data",
                    "End Time ": timeSlot.endTime || "no data",
                    "Day ": examSlot.day || "no data",
                    "Room No ": room.roomNum,
                    "Location ": room.location
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

router.get('/free', async (req, res) => {
    const id = parseInt(req.body.id);
    //list ra lịch rảnh của 1 giáo viên
})
export default router
//add được