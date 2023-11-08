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
import Semester from '../models/Semester.js'
import StudentSubject from '../models/StudentSubject.js'
import ExamPhase from '../models/ExamPhase.js'

export async function getListOfStu(subCode, roomNum) {
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
    return student
}

export async function getScheduleOfStuBySemester(userId, semId) {
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
                time: `${timeSlot.startTime.slice(0, 5)} - ${timeSlot.endTime.slice(0, 5)}`
            }
            schePerSemester.push(s);
        }
    }
    return schePerSemester;
}

export async function getScheduleOfStu(userId) {
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
    return schePerSemester;
}

export async function checkClass(courId1, courId2) {
    let cour1 = await Course.findOne({
        where: {
            id: courId1
        }
    })
    let cour2 = await Course.findOne({
        where: {
            id: courId2
        }
    })
    let list1 = StudentSubject.findAll(
        {
            where: {
                subjectId : cour1.subId
            }
        }
    )
    let list2 = StudentSubject.findAll(
        {
            where: {
                subjectId : cour2.subId
            }
        }
    )
    let check = false
    for (let i = 0; i < list1.length; i++) {
        if(list1[i].dataValues.stuId === list2[i].dataValues.stuId){
            check = true
            break
        }
    }
    return check
}