import TimeSlot from '../models/TimeSlot.js'
import ExamPhase from '../models/ExamPhase.js'
import ExamSlot from '../models/ExamSlot.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import Course from '../models/Course.js'


export async function assignCourse(courseId, date, slot, examPhaseId) {
    const examPhase = await ExamPhase.findOne({
        where: {
            id: examPhaseId
        }
    })

    const numOfStu = await Course.findOne({
        where: {
            id: courseId
        },
        attributes: ['numOfStu']
    })

    const roomRequire = Math.ceil(numOfStu.dataValues.numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);
    console.log(roomRequire);


    const timeList = await TimeSlot.findAll(
        {
            where: {
                des: examPhase.des
            }
        },
        {
            order: [
                ['startTime', 'ASC']
            ]
        }
    )


    const subInSlotList = await SubInSlot.findAll(
        {
            where: {
                courId: courseId
            },
            attributes: ['courId']

        }
    )

    if (subInSlotList.length < roomRequire) {
        const examSlot = await ExamSlot.findOrCreate(
            {
                where: {
                    ePId: examPhase.id,
                    timeSlotId: timeList[slot - 1].id,
                    day: date
                }
            }
        )

        const newSISlot = await SubInSlot.findOrCreate(
            {
                where: {
                    courId: courseId,
                    exSlId: examSlot[0].dataValues.id
                }
            }
        )
        const examRoomList = await ExamRoom.findAll(
            {
                where: {
                    sSId: subInSlotList
                }
            }
        )
        if (examRoomList < roomRequire) {
            const examRoom = await ExamRoom.create({
                sSId: newSISlot[0].dataValues.id,
            })

        } else {
            throw new Error("The number of exam rooms is sufficient!")
        }
    } else {
        throw new Error("The number of exam rooms is sufficient!")
    }
}