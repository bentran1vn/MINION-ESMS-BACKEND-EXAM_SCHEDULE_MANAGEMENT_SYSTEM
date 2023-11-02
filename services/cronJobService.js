import ExamRoom from '../models/ExamRoom.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'
import { Op } from 'sequelize'
import ExamPhase from '../models/ExamPhase.js'
import Semester from '../models/Semester.js'

// const semesterId = req.body.semId
// const examPhase = ExamPhase.findOne({
//     where: {
//         semId: semesterId,
//         status: 1
//     }
// })
// const start = new Date(examPhase.startDay)
// const cur = new Date(timeFormatted);
// const timeDifference = Math.abs(start.getTime() - cur.getTime());
// const threeDay = Math.ceil(timeDifference / (1000 * 3600 * 24));

// if ((examPhase.startDay > timeFormatted && threeDay <= 3) || examPhase.startDay <= timeFormatted) {
//     await ExamPhase.update({ status: 0 }, {
//         where: {
//             id: examPhase.id
//         }
//     })
//     await Course.update({ status: 0 }, {
//         where: {
//             id: examPhase.id
//         }
//     })
// }

export async function courseCron() {
    const courList = await Course.findAll({
        where: {
            status: 1
        }
    })
    if (!courList) throw new Error('Course not found !')

    for (const item of courList) {

        const numOfStu = item.numOfStu

        const subInSlotList = await SubInSlot.findAll({
            where: {
                courId: item.id
            }
        })
        if (!subInSlotList) throw new Error('SubInSlot not found !')

        let subInSlotIdList = []

        for (const item of subInSlotList) {
            subInSlotIdList.push(item.id)
        }

        const examRoomList = await ExamRoom.findAll({
            where: {
                sSId: subInSlotIdList,
                [Op.or]: [
                    {
                        roomId: {
                            [Op.is]: null
                        }
                    },
                    {
                        examinerId: {
                            [Op.is]: null
                        }
                    }
                ]
            }
        })

        const examRoomExist = await ExamRoom.findAll({
            where: {
                sSId: subInSlotIdList
            }
        })
        //numOfStu

        const roomRequire = Math.ceil(numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);
        if (examRoomList.length == 0 && roomRequire <= examRoomExist.length) {
            await Course.update({ status: 0 }, {
                where: {
                    id: item.id
                }
            })
        } else if(examRoomList.length != 0 ){
            await Course.update({ status: 1 }, {
                where: {
                    id: item.id
                }
            })
        }
    }
}

export async function examPhaseCron() {
    let examPhaseList = await ExamPhase.findAll({
        where: {
            status: true
        }
    })
    for (const item of examPhaseList) {
        let courseList = await Course.findAll({
            where: {
                ePId: item.dataValues.id,
                status: 1
            }
        })
        if (courseList.length == 0) {
            await ExamPhase.update({ status: 0 }, {
                where: {
                    id: item.id
                }
            })
        } else {
            await ExamPhase.update({ status: 1 }, {
                where: {
                    id: item.id
                }
            })
        }
    }
    // const start = new Date(examPhase.startDay)
    // const cur = new Date(timeFormatted);
    // const timeDifference = Math.abs(start.getTime() - cur.getTime());
    // const threeDay = Math.ceil(timeDifference / (1000 * 3600 * 24));
    // if ((examPhase.startDay > timeFormatted && threeDay <= 3) || examPhase.startDay <= timeFormatted) {
    //     await ExamPhase.update({ status: 0 }, {
    //         where: {
    //             id: examPhase.id
    //         }
    //     })
    // } else {
    //     await ExamPhase.update({ status: 1 }, {
    //         where: {
    //             id: examPhase.id
    //         }
    //     })
    // }
}

export async function semesterCron() {
    let semesterList = await Semester.findAll({
        where: {
            status: 1
        }
    })
    for (const item of semesterList) {
        let examPhaseList = await ExamPhase.findAll({
            where: {
                semId: item.id,
                status: 1
            }
        })
        if (examPhaseList.length == 0) {
            await Semester.update({ status: 0 }, {
                where: {
                    id: item.id
                }
            })
        } else {
            await Semester.update({ status: 1 }, {
                where: {
                    id: item.id
                }
            })
        }
    }
}


