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
import { randomRoom } from './room.js'

const router = express.Router()

router.get('/', async (req, res) => {

    const examPhaseList = await ExamPhase.findAll(
        {
            order: [
                ['startDay', 'ASC'],
            ]
        }
    )//Đảm bảo thứ tự của ExamPhase từ ngày sớm nhất đến trễ nhất

    const slotList = await TimeSlot.findAll()

    for (const key in examPhaseList) {
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
                slotCount++;
                if (slotCount <= process.env.NUMBER_OF_SLOT - 1) {
                    slot = slotList[slotCount].id
                    examSlot = await ExamSlot.create({
                        ePId: examPhaseList[key].id,
                        day: daySlot,
                        timeSlotId: slot
                    })
                }// Cộng thêm 1 Slot mỗi khi không đủ phòng thi


                if (slotCount > process.env.NUMBER_OF_SLOT - 1) {
                    slotCount = 0
                    dayCount++;
                    if (slotCount <= process.env.NUMBER_OF_SLOT - 1) {
                        slot = slotList[slotCount].id
                        daySlot = dayList[dayCount]
                        examSlot = await ExamSlot.create({
                            ePId: examPhaseList[key].id,
                            day: daySlot,
                            timeSlotId: slot
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

                    /*TestFile-subID--examSlotID  
                        // let data = val.id + ".." + val.numOfStu + ".." + daySlot.getDate() + ".." + slot
                        // let data1 = dayCount + "---" + slotCount
                        // fs.appendFileSync("test.txt", data1 + "\n");
                        // fs.appendFileSync("test.txt", data + "\n");
                    */
                    console.log(room.id);
                    await ExamRoom.create({
                        sSId: subjectInSlot.id,
                        roomId: room.id
                    })
                    await RoomLogTime.create({
                        roomId: room.id,
                        day: daySlot,
                        timeSlotId: slot
                    })
                }
            } else {
                i--
            }
        }
    }

    res.json(MessageResponse("Create ExamRooms Successfully !"))
})

export default router