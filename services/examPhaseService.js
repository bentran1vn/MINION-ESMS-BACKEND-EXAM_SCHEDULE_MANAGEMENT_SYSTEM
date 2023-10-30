//import ExamType from '../models/ExamType.js'
import ExamPhase from '../models/ExamPhase.js'

export async function createExamPhases(course, semesterId) {
    const date = new Date()
    let month = date.getMonth() + 1
    let blockNow = 10
    let desNow = 0
    // 0 is normal
    //{numFE : FE, numPE : PE, numFEc : FEc, numPEc : PEc}

    let examPhaseList = []

    if (month == 4 || month == 8 || month == 12) blockNow = 5

    const promises = [];

    for (const key in course) {
        if (course.hasOwnProperty(key)) {
            const val = course[key];
            if (val > 0) {
                if (key.includes("c")) desNow = 1;
                const promise = (async () => {
                    const examType = await ExamType.findOne({
                        where: {
                            type: key.slice(3, 5),
                            block: blockNow,
                            des: desNow,
                        },
                    });
                    const examPhase = await ExamPhase.create({
                        semId: semesterId,
                        eTId: examType.id,
                    });

                    return examPhase;
                })();
                promises.push(promise);
            }
        }
    }

    return Promise.all(promises)
}

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