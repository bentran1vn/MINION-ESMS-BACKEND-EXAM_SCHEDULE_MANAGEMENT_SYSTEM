import ExamSlot from "../models/ExamSlot"

export async function findAllExamSlotByPhase(id){
    let slotList = ExamSlot.findAll({
        where : {
            ePId: id
        }
    })
    if(!slotList) throw new Error("Can not find exam phases !")
    return slotList
}