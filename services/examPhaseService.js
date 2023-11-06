import ExamPhase from '../models/ExamPhase.js'
import Course from '../models/Course.js'

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
    const endDate = enDay.toISOString().slice(0, 10);
    if (startDate && endDate) {
        if (startDay === startDate && endDay === endDate) {
            return true
        }
    }
    else {
        throw new Error('Invalid time value. The time must be in YYYY-MM-DD format')
        return;
    }

}

export async function findPhaseBySemId(id) {
    const detailExamPhase = []
    function insertExamPhase(id, semId, pN, sd, ed, cd) {
        const EPDetail = {
            id: id, semId: semId, ePName: pN, sDay: sd, eDay: ed, courseDone: cd// 1 done, 0 chưa done
        }
        detailExamPhase.push(EPDetail)
    }

    const examPhases = await ExamPhase.findAll({
        where: {
            semId: id
        }
    })

    for (let i = 0; i < examPhases.length; i++) {
        const course = await Course.findAll({
            where: {
                ePId: examPhases[i].id
            }
        })
        if (course.length != 0) {
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 1)
        } else {
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 0)
        }
    }
    if (!detailExamPhase) throw new Error("Can not find exam phases !")
    return detailExamPhase
}