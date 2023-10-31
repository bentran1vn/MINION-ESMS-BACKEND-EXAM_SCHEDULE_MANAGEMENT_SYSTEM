import express from 'express'
import { ErrorResponse, MessageResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamPhase from '../models/ExamPhase.js'
import TimeSlot from '../models/TimeSlot.js'
import ExamSlot from '../models/ExamSlot.js'
import SubInSlot from '../models/SubInSlot.js'
import fs from 'fs'
import ExamRoom from '../models/ExamRoom.js'
import RoomLogTime from '../models/RoomLogTime.js'
import { autoFillStu } from '../utility/examRoomUtility.js'
import { expandTimePhase } from '../services/examPhaseService.js'
import { findAll } from '../services/roomService.js'
import { Op } from 'sequelize'
import Course from '../models/Course.js'

const router = express.Router()

router.get('/', async (req, res) => {
    console.log("System is running !");
    console.log("Creating Exam Room !");

    try {
        let roomList
        await findAll().then(value => roomList = value)
        if (roomList === null) {
            throw new Error("Can not create exam rooms! Room problem!")
        }

        let examPhase = await ExamPhase.findOne({
            where: {
                status: true
            }
        })
        if (examPhase === null || examPhase.length == 0) {
            throw new Error("Can not create exam rooms! Examphase problem!")
        }

        let slotList = await TimeSlot.findAll(
            {
                where: {
                    semId:{
                        [Op.eq]: examPhase.semId
                    },
                    des: {
                        [Op.eq]: examPhase.des
                    },
                },
            },
        )
        //Lấy ra đúng loại Slot Time
        if (slotList === null || slotList.length == 0) {
            throw new Error("Can not create exam rooms! Examphase problem!")
        }    

        let course = await Course.findAll(
            {
                where: {
                    ePId: {
                        [Op.eq]: examPhase.id
                    },
                    status: {
                        [Op.eq]: 1
                    }
                },
            },
            {
                order: [
                    ['numOfStu', 'ASC']
                ]
            }
        )
        if (course === null || course.length == 0) {
            throw new Error("Can not create exam rooms! Course Problem!")
        }
        //Lấy ra danh sách các Course trong Examphase tương ứng
        const startDay = new Date(examPhase.startDay)
        const dayLength = expandTimePhase(examPhase)
        //Lấy ra khoảng thời gian giữa 2 ngày start và end của 1 examPhase

        let dayList = []

        for (let i = 0; i <= dayLength; i++) {
            let day = new Date(startDay);
            if (i !== 0) {
                day.setDate(startDay.getDate() + i);
            }
            dayList.push(day)
        }//Add day vào danh sách dayList của 1 examPhase

        let roomSlot = 0
        let dayCount = 0
        let slotCount = 0
        let roomCount = 0

        let examSlot = await ExamSlot.create({
            ePId: examPhase.id,
            day: dayList[0],
            timeSlotId: slotList[0].id
        })//Khởi tạo ExamSlot mặc định

        for (let i = 0; i < course.length; i++) { //Duyệt danh sách Môn Thi

            /*TestFile-NewCouse
            // let msg = "New Course"
            // fs.appendFileSync("test.txt", msg + "\n");
            */

            let daySlot = dayList[dayCount]
            let slot = slotList[slotCount].id

            if (roomSlot > process.env.NUMBER_OF_FLOOR * process.env.NUMBER_OF_ROOM_IN_FLOOR) {
                roomSlot = 0
                roomCount = 0
                slotCount++;
                if (slotCount <= slotList.length - 1) {
                    slot = slotList[slotCount].id
                    examSlot = await ExamSlot.create({
                        ePId: examPhase.id,
                        day: daySlot,
                        timeSlotId: slot,
                    })
                }// Cộng thêm 1 Slot mỗi khi không đủ phòng thi


                if (slotCount > slotList.length - 1) {
                    slotCount = 0
                    dayCount++;
                    if (slotCount <= slotList.length - 1) {
                        slot = slotList[slotCount].id
                        daySlot = dayList[dayCount]
                        examSlot = await ExamSlot.create({
                            ePId: examPhase.id,
                            day: daySlot,
                            timeSlotId: slot,
                        })

                    }
                }// Cộng thêm 1 Day mỗi khi không đủ phòng thi
            }

            const val = course[i];

            let NumRoomOfCourse = Math.ceil(val.numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);

            /* TestFile-CurrentSlot-NumRoomOfCourse
                //let currentSlot = "Current Slot: " + slotCount
                //fs.appendFileSync("test.txt", currentSlot + "\n");
                //let roomCourseData = "roomCourse của môn: " + roomCourse
                //fs.appendFileSync("test.txt", roomCourseData + "\n");
            */

            roomSlot += NumRoomOfCourse

            /* TestFile-RoomSlot
            // let roomSlotData = "RoomSlot sau khi add: " + roomSlot
            // fs.appendFileSync("test.txt", roomSlotData + "\n");
            */

            if (roomSlot <= process.env.NUMBER_OF_FLOOR * process.env.NUMBER_OF_ROOM_IN_FLOOR) {

                //Tạo mới 1 SubjectInSlot
                let subjectInSlot = await SubInSlot.create({
                    courId: val.id,
                    exSlId: examSlot.id
                })

                /* TestFile-subID--examSlotID
                // let data = subjectInSlot.courId + "--" + subjectInSlot.exSlId
                // fs.appendFileSync("test1.txt", data + "\n");
                */

                for (let i = 0; i < NumRoomOfCourse; i++) {
                    let room
                    room = roomList[roomCount]
                    /**
                    let roomCheck
                    do {
                        room = await randomRoom().then(val => room = val)
                        roomCheck = {}
                        roomCheck = await RoomLogTime.findOne({
                            where: {
                                roomId: room.id,
                                day: daySlot,
                                timeSlotId: slot
                            }
                        })
                    } while (roomCheck);
    
                    //TestFile-subID--examSlotID  
                    // let data = val.id + ".." + val.numOfStu + ".." + daySlot.getDate() + ".." + slot
                    // let data1 = dayCount + "---" + slotCount
                    // fs.appendFileSync("test.txt", data1 + "\n");
                    // fs.appendFileSync("test.txt", data + "\n");
                    console.log(room.id);
                    */
                    await ExamRoom.create({
                        sSId: subjectInSlot.id,
                        roomId: room.id,
                        des: examPhase.des
                    })
                    await RoomLogTime.create({
                        roomId: room.id,
                        day: daySlot,
                        timeSlotId: slot,
                        semId: examPhase.semId
                    })
                    roomCount++
                }
            } else {
                i--
            }
        }
        console.log("Filling Student Into Exam Room !");
        // await autoFillStu()
        console.log("Building System Successfully !");
        res.json(MessageResponse("Create ExamRooms Successfully !"))
    } catch(err){
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

export default router