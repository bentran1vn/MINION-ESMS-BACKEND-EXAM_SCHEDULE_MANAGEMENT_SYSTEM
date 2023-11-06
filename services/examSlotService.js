import ExamSlot from "../models/ExamSlot.js"
import TimeSlot from "../models/TimeSlot.js";
import ExamPhase from "../models/ExamPhase.js";
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

export async function createNewExamSlot(phaseId, timeSlotId, day) {
    const slot = await ExamSlot.findOne({
        where: {
            ePId: phaseId,
            timeSlotId: timeSlotId,
            day: day
        }
    })
    const examPhase = await ExamPhase.findOne({
        where: {
            id: phaseId,
            alive: 1
        }
    })
    if(validDay(examPhase.startDay, examPhase.endDay, day)){
        if (!slot) {
            const examSlot = await ExamSlot.create({
                ePId: phaseId,
                timeSlotId: timeSlotId,
                day: day
            })
            if (!examSlot) throw new Error("Can not create exam slot !")
        } else {
            throw new Error("Already Exist Exam Slot !")
        }
    } else {
        throw new Error("Day must in the range !")
    }
}

export async function deleteExamSlot(examslotId){
    let message = "";
    const result = await ExamSlot.destroy({
        where: {
            id: examslotId,
        }
    })
    if (result === 0) {
        throw new Error("Not found")
    } else {
        return message = 'Delete Success !'
    }
}

export async function getAllByPhase(semId, ePId){
    const examPhase = await ExamPhase.findOne({
        where: {
            id: ePId,
            semId: semId,
            alive: 1
        }
    })
    if(!examPhase) throw new Error("Not found exam phase")
    const exSlotFull = await ExamSlot.findAll({
        where: {
            ePId: examPhase.id
        }
    })
    return exSlotFull
}