import express from 'express'
import { MessageResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamPhase from '../models/ExamPhase.js'
import TimeSlot from '../models/TimeSlot.js'
import ExamSlot from '../models/ExamSlot.js'
import SubInSlot from '../models/SubInSlot.js'
import fs from 'fs'
import ExamRoom from '../models/ExamRoom.js'
import RoomLogTime from '../models/RoomLogTime.js'
import { courseByPhase } from './course.js'
import ExamType from '../models/ExamType.js'
import Room from '../models/Room.js'
import { autoFillStu } from '../utility/examRoomUtility.js' 

const router = express.Router()

router.get('/', async (req, res) => {
    console.log("System is running !");
    console.log("Creating Exam Room !");
    const examPhaseList = await ExamPhase.findAll(
        {
            order: [
                ['startDay', 'ASC'],
            ]
        }
    )//Đảm bảo thứ tự của ExamPhase từ ngày sớm nhất đến trễ nhất

    const roomList = await Room.findAll()

    for (const key in examPhaseList) {

        let slotList

        let examType = await ExamType.findOne({
            where: {
                id: examPhaseList[key].eTId
            }
        })

        if (examType.des == 0) {
            slotList = await TimeSlot.findAll({
                limit: 6,
            })
        } else {
            slotList = await TimeSlot.findAll({
                limit: 3,
                offset: 6
            })
        }

        let course
        await courseByPhase(examPhaseList[key]).then(val => course = val)
        //Lấy ra danh sách các Course trong Examphase tương ứng

        /*TestFile-NewPhase
        // let dataT = "----------------------"
        // fs.appendFileSync("test.txt", dataT + "\n");
        // let dataT1 = "----------------------"
        // fs.appendFileSync("test1.txt", dataT1 + "\n");
        // console.log("----------------------");
        */

        const startDay = new Date(examPhaseList[key].startDay)
        const endDay = new Date(examPhaseList[key].endDay)
        const diffInMs = Math.abs(endDay - startDay);
        const dayLength = diffInMs / (1000 * 60 * 60 * 24)
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
            ePId: examPhaseList[key].id,
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
                        ePId: examPhaseList[key].id,
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
                            ePId: examPhaseList[key].id,
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
                        des: examType.type
                    })
                    await RoomLogTime.create({
                        roomId: room.id,
                        day: daySlot,
                        timeSlotId: slot
                    })
                    roomCount++
                }
            } else {
                i--
            }
        }
    }
    console.log("Filling Student Into Exam Room !");
    await autoFillStu()
    console.log("Building System Successfully !");
    res.json(MessageResponse("Create ExamRooms Successfully !"))
})

export default router