import ExamSlot from "../models/ExamSlot.js"
import TimeSlot from "../models/TimeSlot.js";

export async function findAllExamSlotByPhase(id){
    let slotList = await ExamSlot.findAll({
        where : {
            ePId: id
        },
        include: {
            model: TimeSlot,
            attributes: ['startTime', 'endTime'],
        }
    })
    if(!slotList || slotList.length == 0) throw new Error("Can not find exam phases !")
    return slotList
}