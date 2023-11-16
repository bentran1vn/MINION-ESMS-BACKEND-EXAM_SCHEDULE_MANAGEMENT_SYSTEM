import ExamSlot from "../models/ExamSlot.js"
import TimeSlot from "../models/TimeSlot.js";
import ExamPhase from "../models/ExamPhase.js";
import StaffLogChange from "../models/StaffLogChange.js";
import { validDay } from "../utility/dayUtility.js";

export async function findAllExamSlotByPhase(id) {
    let slotList = await ExamSlot.findAll({
        where: {
            ePId: id
        },
        include: {
            model: TimeSlot,
            attributes: ['startTime', 'endTime'],
        }
    })
    if (!slotList || slotList.length == 0) throw new Error("Can not find exam phases !")
    return slotList
}

export async function createNewExamSlot(phaseId, timeSlotId, day, staff) {
    day = day.slice(0, 10);
    const slot = await ExamSlot.findOne({
        where: {
            ePId: phaseId,
            timeSlotId: timeSlotId,
            day: day
        }
    })
    if (slot) throw new Error("Already Exist Exam Slot !")
    const examPhase = await ExamPhase.findOne({
        where: {
            id: phaseId,
            alive: 1
        }
    })
    if (!examPhase) throw new Error("Not found exam phase !");
    // validDay(examPhase.startDay, examPhase.endDay, day)

    if (examPhase.startDay.slice(0, 10) <= day && examPhase.endDay.slice(0, 10) >= day) {
        if (!slot) {
            const examSlot = await ExamSlot.create({
                ePId: phaseId,
                timeSlotId: timeSlotId,
                day: day
            })
            if (!examSlot) throw new Error("Can not create exam slot !")
            // const checkLogStaff = await StaffLogChange.create({
            //     rowId: examSlot.dataValues.id,
            //     tableName: 3,
            //     userId: staff.id,
            //     typeChange: 19,
            // })
            // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")
        } else {
            throw new Error("Already Exist Exam Slot !")
        }
    } else {
        throw new Error("Day must in the phase range !")
    }
}

export async function deleteExamSlot(examslotId, staff) {
    let message = "";
    const result = await ExamSlot.destroy({
        where: {
            id: examslotId,
        }
    })
    // const checkLogStaff = await StaffLogChange.create({
    //     rowId: examRoom.dataValues.id,
    //     tableName: 3,
    //     userId: staff.id,
    //     typeChange: 20,
    // })
    // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")
    if (result === 0) {
        throw new Error("Not found")
    } else {
        return message = 'Delete Success !'
    }
}

export async function getAllByPhase(semId, ePId) {
    const examPhase = await ExamPhase.findOne({
        where: {
            id: ePId,
            semId: semId,
            alive: 1
        }
    })
    if (!examPhase) throw new Error("Not found exam phase")
    const exSlotFull = await ExamSlot.findAll({
        where: {
            ePId: examPhase.id
        }
    })
    return exSlotFull
}