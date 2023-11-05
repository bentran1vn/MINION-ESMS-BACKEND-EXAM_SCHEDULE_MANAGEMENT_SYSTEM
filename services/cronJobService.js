import ExamPhase from '../models/ExamPhase.js'
import Semester from '../models/Semester.js'
import cron from "node-cron";


export async function examPhaseCron() {
    let examPhaseList = await ExamPhase.findAll({
        where: {
            status: true
        }
    })
    for (const item of examPhaseList) {
        let startDay = new Date(item.startDay).getDate() - 3
        let startMonth = new Date(item.startDay).getMonth() + 1
        let jobPhase = new cron.schedule(
            `0 0 ${startDay} ${startMonth} *`,
            async () => {
                let result = await ExamPhase.update({ status: 0 }, {
                    where: {
                        id: item.id
                    }
                })
                if(result[0] == 0) throw new Error('Update ExamPhase fail !')
            },
            {
                scheduled: true,
                timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng     
            }
        );
        await jobPhase.start();
    }
}


export async function semesterCron() {
    let semesterList = await Semester.findAll({
        where: {
            status: 1
        }
    })
    for (const item of semesterList) {
        let endDay = new Date(item.end).getDate() + 1
        let endMonth = new Date(item.end).getMonth() + 1
        let jobSemester = new cron.schedule(
            `0 0 ${endDay} ${endMonth} *`,
            async () => {
                let result = await Semester.update({ status: 0 }, {
                    where: {
                        id: item.id
                    }
                })
                if(result[0] == 0) throw new Error('Update ExamPhase fail !')
            },
            {
                scheduled: true,
                timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng     
            }
        );
        await jobSemester.start();
    }
}


