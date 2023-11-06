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
            
        } else {
            throw new Error('Invalid time value. The time must be in YYYY-MM-DD format')
        }
    }
    else {
        throw new Error('Invalid time value. The time must be in YYYY-MM-DD format')
    }

}

export async function findPhaseBySemId(id) {
    const detailExamPhase = []
    function insertExamPhase(id, semId, pN, sd, ed, cd, status) {
        const EPDetail = {
            id: id, semId: semId, ePName: pN, sDay: sd, eDay: ed, courseDone: cd, status: status, des: des// 1 done, 0 chưa done
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
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 1, examPhases[i].status, examPhases[i].des)
        } else {
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 0, examPhases[i].status, examPhases[i].des)
        }
    }
    if (!detailExamPhase) throw new Error("Can not find exam phases !")
    return detailExamPhase
}

export async function deletePhaseBySemId(id) {
    const examPhase = await ExamPhase.findOne({
        where: {
            id: id,
            status: 1,
            alive: 1
        }
    })
    if (!examPhase) {
        throw new Error('Not found')
    } else {
        const result = await ExamPhase.update(
            {
                alive: 0
            },
            {
                where: examPhase
            }
        )
        if (result === 0) {
            throw new Error('Delete Success !')
        }
    }
}

export async function updatePhase(examPhaseUp) {
    const check = await ExamPhase.update({
        semId: examPhaseUp.semId,
        ePName: examPhaseUp.ePName,
        startDay: examPhaseUp.startDay,
        endDay: examPhaseUp.endDay,
    }, {
        where: {
            id: parseInt(examPhaseUp.examPhaseId),
            status: 1,
            alive: 1
        }
    })
    if (check[0] !== 1) {
        throw new Error('Update Fail !')
    }
}

export async function createPhase(examPhase) {
    const ePName = examPhase.ePName
    const startDay = examPhase.startDay;
    const endDay = examPhase.endDay;
    const des = parseInt(examPhase.des)
    const semId = parseInt(examPhase.semId)
 
    checkTime(startDay, endDay)

    let result = await ExamPhase.create({
        semId: semId,
        ePName: ePName,
        startDay: startDay,
        endDay: endDay,
        des: des
    })
    if(!result){
        throw new Error('Create ExamPhase Fail!')
    }
}

export async function getExamPhaseBySemesterId(semesterId) {
    const examPhases = await ExamPhase.findAll({
        where: {
            semId: semesterId,
            alive: 1
        }
    })
    if (!examPhases || examPhases.length === 0) {
        throw new Error('Not found!')
    }
    return examPhases
}   