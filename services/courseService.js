import TimeSlot from '../models/TimeSlot.js'
import ExamPhase from '../models/ExamPhase.js'
import ExamSlot from '../models/ExamSlot.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import Course from '../models/Course.js'
import { findAll } from './roomService.js'
import RoomLogTime from '../models/RoomLogTime.js'
import StaffLogChange from '../models/StaffLogChange.js'
import { handleFillStu } from './studentExamService.js'


// export async function assignCourse(courseId, date, slot, examPhaseId) {
//     const examPhase = await ExamPhase.findOne({
//         where: {
//             id: examPhaseId
//         }
//     })

//     const numOfStu = await Course.findOne({
//         where: {
//             id: courseId
//         },
//         attributes: ['numOfStu']
//     })

//     const roomRequire = Math.ceil(numOfStu.dataValues.numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);
//     console.log(roomRequire);


//     const timeList = await TimeSlot.findAll(
//         {
//             where: {
//                 des: examPhase.des
//             }
//         },
//         {
//             order: [
//                 ['startTime', 'ASC']
//             ]
//         }
//     )


//     const subInSlotList = await SubInSlot.findAll(
//         {
//             where: {
//                 courId: courseId
//             },
//             attributes: ['courId']

//         }
//     )

//     if (subInSlotList.length < roomRequire) {
//         const examSlot = await ExamSlot.findOrCreate(
//             {
//                 where: {
//                     ePId: examPhase.id,
//                     timeSlotId: timeList[slot - 1].id,
//                     day: date
//                 }
//             }
//         )

//         const newSISlot = await SubInSlot.findOrCreate(
//             {
//                 where: {
//                     courId: courseId,
//                     exSlId: examSlot[0].dataValues.id
//                 }
//             }
//         )
//         const examRoomList = await ExamRoom.findAll(
//             {
//                 where: {
//                     sSId: subInSlotList
//                 }
//             }
//         )
//         if (examRoomList < roomRequire) {
//             const examRoom = await ExamRoom.create({
//                 sSId: newSISlot[0].dataValues.id,
//             })

//         } else {
//             throw new Error("The number of exam rooms is sufficient!")
//         }
//     } else {
//         throw new Error("The number of exam rooms is sufficient!")
//     }
// }

export async function assignCourse(courseId, ExamSlotId, numStu) {

    const numOfStu = await Course.findOne({
        where: {
            id: courseId
        },
        attributes: ['numOfStu']
    })
    if (!numOfStu) throw new Error("Problem with assign Course! Course Problem !")


    const examSlot = await ExamSlot.findOne({
        where: {
            id: ExamSlotId
        }
    })
    if (!examSlot) throw new Error("Problem with assign Course! Invalid ExamSlot !")

    const examPhase = await ExamPhase.findOne({
        where: {
            id: examSlot.ePId
        }
    })
    if (!examPhase) throw new Error("Problem with assign Course! In Examphase!")

    let roomList
    await findAll().then(value => roomList = value)

    if (!roomList) throw new Error("Problem with assign Course! In Finding Room List!")

    const roomRequire = Math.ceil(numOfStu.dataValues.numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);

    const numRoom = Math.ceil(numStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);

    if (numRoom > roomRequire) throw new Error("Problem with assign Course! Number Of Student is invalid !")

    let subInSlot = await SubInSlot.findOne({
        where: {
            courId: courseId,
            exSlId: ExamSlotId
        }
    })
    if (!subInSlot) {
        subInSlot = await SubInSlot.create({
            courId: courseId,
            exSlId: ExamSlotId
        })
        if (!subInSlot) {
            throw new Error("Problem with assign Course! Create SubInSlot!")
        }
    }
    for (let i = 0; i < numRoom; i++) {
        //duyệt roomList tìm phòng trống
        let check = true;
        do {
            let findRoom = false;
            for (let item of roomList) {
                console.log(item.dataValues.roomNum);
                let room = await RoomLogTime.findOne({
                    where: {
                        roomId: item.dataValues.id,
                        day: examSlot.dataValues.day,
                        timeSlotId: examSlot.dataValues.timeSlotId,
                        semId: examPhase.dataValues.semId,
                    }
                })
                if (!room) {
                    // nhét vào trong Examroom
                    const examRoom = await ExamRoom.create({
                        sSId: subInSlot.id,
                        roomId: item.dataValues.id
                    });
                    if (!examRoom) throw new Error("Problem with assign Course! Create ExamSlot!")

                    // ghi logtime cho Room
                    const checkLogRoom = await RoomLogTime.create({
                        roomId: item.dataValues.id,
                        day: examSlot.dataValues.day,
                        timeSlotId: examSlot.dataValues.timeSlotId,
                        semId: examPhase.dataValues.semId,
                    })
                    if (!checkLogRoom) throw new Error("Problem with assign Course! Fail to write room log!")

                    //ghi logtime cho Staff
                    const checkLogStaff = await StaffLogChange.create({
                        rowId: examRoom.dataValues.id,
                        tableName: 0,
                        userId: 1,
                        typeChange: 12,
                    })
                    if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")

                    if (numStu > 15) {
                        numStu -= 15
                        await handleFillStu(courseId, 15, examRoom.id)
                    } else {
                        await handleFillStu(courseId, numStu, examRoom.id)
                    }
                    findRoom = true;
                    check = false;
                    break;
                }
            }
            if (!findRoom) {
                throw new Error("Problem with assign Course! No Room Available!");
            }
        } while (check)
    }
}