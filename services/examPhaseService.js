import ExamPhase from '../models/ExamPhase.js'

export async function getExamPhasesStartOrder() {
    const examPhaseList = await ExamPhase.findAll(
        {
            order: [
                ['startDay', 'ASC'],
            ]
        }
    )
    if (examPhaseList === null) {
        throw new Error("Can not sort exam phase by order!")
    }
    return examPhaseList
}

export function expandTimePhase(Phase) {
    const startDay = new Date(Phase.startDay)
    const endDay = new Date(Phase.endDay)
    const diffInMs = Math.abs(endDay - startDay);
    const dayLength = diffInMs / (1000 * 60 * 60 * 24)
    return dayLength
}

export function checkTime(startDay, endDay) {
    const stDay = new Date(startDay)
    const enDay = new Date(endDay)


    const startDate = stDay.toISOString().slice(0, 10);
    const endDate = enDay.toISOString().slice(0, 10)
    if (startDate && endDate) {
        if (startDay === startDate && endDay === endDate) {
            return true
        }
    }
    else {
        throw new Error('Invalid time value. The time must be in YYYY-MM-DD format')
    }

}

export function findPhaseBySemId(id){
    let phaseList = ExamPhase.findAll({
        where : {
            semId: id
        }
    })
    if(!phaseList) throw new Error("Can not find exam phases !")
    return phaseList
}