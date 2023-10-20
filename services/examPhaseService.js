import ExamType from '../models/ExamType.js'
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

export async function getExamPhasesStartOrder(){
    const examPhaseList = await ExamPhase.findAll(
        {
            order: [
                ['startDay', 'ASC'],
            ]
        }
    )
    if(examPhaseList === null){
        throw new Error("Can not sort exam phase by order!")
    }
    return examPhaseList
}