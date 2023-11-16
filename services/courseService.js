import ExamPhase from '../models/ExamPhase.js'
import ExamSlot from '../models/ExamSlot.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import Course from '../models/Course.js'
import { findAll } from './roomService.js'
import RoomLogTime from '../models/RoomLogTime.js'
import StaffLogChange from '../models/StaffLogChange.js'
import { autoCreateCourse } from '../utility/courseUtility.js'
import { handleFillStu, handleFillStuLittle } from './studentExamService.js'
import { Op } from 'sequelize'
import Subject from '../models/Subject.js'
import StudentSubject from '../models/StudentSubject.js'


export async function assignCourse(courseId, ExamSlotId, numStu, staff) {

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
            id: examSlot.ePId,
            alive: 1
        }
    })
    if (!examPhase) throw new Error("Problem with assign Course! In Examphase!")

    let roomList
    await findAll().then(value => roomList = value)

    if (!roomList) throw new Error("Problem with assign Course! In Finding Room List!")

    const roomRequire = Math.ceil(numOfStu.dataValues.numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);

    const numOdd = numStu % process.env.NUMBER_OF_STUDENT_IN_ROOM
    let numRoom = 0

    if (numOdd >= 10) {
        numRoom = Math.ceil(numStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);
    } else {
        numRoom = Math.floor(numStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);
    }
    if (0 < numStu && numStu < 10 && checkRoomExist(courseId)) {
        await handleFillStuLittle(courseId, numStu)
        return
    } else if (numStu < 10 && !checkRoomExist(courseId)) {
        throw new Error('First time add student must be greater than nine')
    }


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

                    //ghi logtime cho Staff for
                    const checkLogStaff = await StaffLogChange.create({
                        rowId: examRoom.dataValues.id,
                        tableName: 0,
                        userId: staff.id,
                        typeChange: 12,
                    })
                    if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")

                    //add Student vào ExamRoom
                    if (numStu >= 15) {
                        await handleFillStu(courseId, 15, examRoom.id)
                        numStu -= 15
                    } else if (numStu >= 10) {
                        await handleFillStu(courseId, numStu, examRoom.id)
                        numStu -= numStu
                    }
                    if (0 < numStu && numStu < 10) {
                        await handleFillStuLittle(courseId, numStu, examSlot.dataValues.id)
                        numStu = 0
                    }

                    //cập nhập status Course
                    await changeCourseStatus(examPhase.dataValues.id, courseId)

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
    // if (numOdd < 10) throw new Error(`Problem with assign Course! ${numOdd} Students not enough to create a exam room !`)
}

export async function changeCourseStatus(phaseId, courId) {
    const courList = await Course.findAll({
        where: {
            status: 1,
            ePId: phaseId,
            id: courId
        }
    })
    if (!courList) throw new Error('Course all finished!')

    for (const item of courList) {

        const numOfStu = item.numOfStu

        const subInSlotList = await SubInSlot.findAll({
            where: {
                courId: item.id
            }
        })
        if (!subInSlotList) throw new Error('SubInSlot is not exist! Create SubInSlot first!')

        let subInSlotIdList = []

        for (const item of subInSlotList) {
            subInSlotIdList.push(item.id)
        }

        const examRoomList = await ExamRoom.findAll({
            where: {
                sSId: subInSlotIdList,
            }
        })

        const roomRequire = Math.ceil(numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);
        //số phòng cần thiết để thi
        if (roomRequire <= examRoomList.length) {
            await Course.update({ status: 0 }, {
                where: {
                    id: item.id
                }
            })
        }
    }
}

export async function checkRoomExist(courId) {
    const subInSlotList = await SubInSlot.findAll({
        where: {
            courId: courId
        }
    })
    if (!subInSlotList) return false;
    return true
}//true là đã có phòng, false là chưa có phòng

export async function getCouseByExamPhase(ePId) {
    console.log(ePId);
    if (ePId == null || ePId == undefined) {
        throw new Error("Phase not exist")
    }
    let listCourse = [];

    const exphase = await ExamPhase.findOne({
        where: {
            id: ePId
        }
    })
    const stuSub = await StudentSubject.findAll({
        where: {
            status: 1,
            ePName: exphase.ePName
        }
    })
    if (stuSub.length != 0) {
        await autoCreateCourse()
    }

    const result = await Course.findAll({
        where: {
            ePId
        },
        include: [{
            model: Subject,
            attributes: ['code']
        }]
    });
    const examPhase = await ExamPhase.findOne({
        where: {
            id: ePId,
            alive: 1
        }
    })
    for (const course of result) {
        if (course.dataValues.status == 1) {
            const subject = course.subject;
            const sub = {
                courseId: course.dataValues.id,
                subCode: subject.code,
                numOfStu: course.dataValues.numOfStu,
                ePName: examPhase.ePName,
                status: 1
            };
            listCourse.push(sub);
        } else {
            const subject = course.subject;
            const sub = {
                courseId: course.dataValues.id,
                subCode: subject.code,
                numOfStu: course.dataValues.numOfStu,
                ePName: examPhase.ePName,
                status: 0
            };
            listCourse.push(sub);
        }
    }
    if (listCourse.length == 0) {
        throw new Error("Problem with get Courses!")
    } else {
        return listCourse
    }

}
