import ExamPhase from '../models/ExamPhase.js'
import Course from '../models/Course.js'
import ExamSlot from '../models/ExamSlot.js'
import StaffLogChange from '../models/StaffLogChange.js'
import { Op } from 'sequelize'
import Semester from '../models/Semester.js'

export async function getExamPhasesStartOrder() {
    const examPhaseList = await ExamPhase.findAll(
        {
            where: {
                alive: 1
            }
        },
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

export async function getExamphasesBySemId(semesterId, page_no, limit) {
    let returnL = [];
    const phaseList = await ExamPhase.findAll({
        where: {
            semId: semesterId,
            alive: 1
        },
    })
    const phase = await ExamPhase.findAll({
        where: {
            semId: semesterId,
            alive: 1
        },
        limit: limit,
        offset: (page_no - 1) * limit
    })
    if (!phase || phase.length == 0) throw new Error('Not found!')
    for (const exphase of phase) {
        const examslot = await ExamSlot.findAll({
            where: {
                ePId: exphase.dataValues.id
            }
        })
        if (examslot) {
            const r = {
                id: exphase.dataValues.id,
                semId: exphase.dataValues.semId,
                ePName: exphase.dataValues.ePName,
                startDay: exphase.dataValues.startDay,
                endDay: exphase.dataValues.endDay,
                status: exphase.dataValues.status,
                des: exphase.dataValues.des,
                alive: exphase.dataValues.alive,
                edit: 0//không được sửa
            }
            returnL.push(r);
        } else {
            const r = {
                id: exphase.dataValues.id,
                semId: exphase.dataValues.semId,
                ePName: exphase.dataValues.ePName,
                startDay: exphase.dataValues.startDay,
                endDay: exphase.dataValues.endDay,
                status: exphase.dataValues.status,
                des: exphase.dataValues.des,
                alive: exphase.dataValues.alive,
                edit: 1//không được sửa
            }
            returnL.push(r);
        }
    }
    return {
        total: phaseList.length,
        data: returnL
    }
}

export async function deletePhaseBySemId(id, staff) {
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
        const result = await ExamPhase.update({ alive: 0 }, {
            where: {
                id: examPhase.id
            }
        })
        if (result[0] === 1) {
            // const checkLogStaff = await StaffLogChange.create({
            //     rowId: examPhase.id,
            //     tableName: 6,
            //     userId: staff,
            //     typeChange: 15,
            // })
            // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")
            return true
        }
    }
}

export async function updatePhase(examPhaseUp, staff) {
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

    // const checkLogStaff = await StaffLogChange.create({
    //     rowId: examRoom.dataValues.id,
    //     tableName: 6,
    //     userId: staff.id,
    //     typeChange: 14,
    // })
    // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")

    if (check[0] !== 1) {
        throw new Error('Update Fail !')
    }
}

export async function createPhase(examPhase, staff) {
    const ePName = examPhase.ePName
    const startDay = examPhase.startDay;
    const endDay = examPhase.endDay;
    const des = parseInt(examPhase.des)
    const semId = parseInt(examPhase.semId)

    checkTime(startDay, endDay)

    let check = await ExamPhase.findOne(
        {
            where: {
                semId: semId,
                ePName: ePName,
                startDay: startDay,
                endDay: endDay,
                des: des,
                alive: 0
            }
        }
    )

    if (check) {
        const check = await ExamPhase.update(
            {
                alive: 1
            },
            {
                where: {
                    semId: semId,
                    ePName: ePName,
                    startDay: startDay,
                    endDay: endDay,
                    des: des,
                    alive: 0
                }
            })
        // const checkLogStaff = await StaffLogChange.create({
        //     rowId: check.dataValues.id,
        //     tableName: 6,
        //     userId: staff.id,
        //     typeChange: 13,
        // })
        // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")
        if (!check) {
            throw new Error('Create ExamPhase Fail!')
        }
    } else {
        const semester = await Semester.findOne({
            where: {
                id: semId
            }
        })
        if (semester) {
            if (startDay < semester.start || endDay > semester.end) {
                throw new Error('Examphase time must be within the semester !')
            } else {
                const examPhase = await ExamPhase.findOne({
                    where: {
                        [Op.or]: [
                            {
                                startDay: { [Op.between]: [startDay, endDay] },
                            },
                            {
                                endDay: { [Op.between]: [startDay, endDay] },
                            },
                        ],
                        alive: 1,
                    },
                });
                if (examPhase) {
                    throw new Error('Examphase time is collision with another examphase')
                } else {
                    let result = await ExamPhase.create({
                        semId: semId,
                        ePName: ePName,
                        startDay: startDay,
                        endDay: endDay,
                        des: des
                    })
                    // const checkLogStaff = await StaffLogChange.create({
                    //     rowId: result.dataValues.id,
                    //     tableName: 6,
                    //     userId: staff.id,
                    //     typeChange: 13,
                    // })
                    // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")

                    if (!result) {
                        throw new Error('Create ExamPhase Fail!')
                    }
                }
            }
        }
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

export async function checkExamSlotByPhaseId(examPhaseId) {
    const examSlot = await ExamSlot.findAll({
        where: {
            ePId: examPhaseId
        }
    })
    if (examSlot == null || examSlot.length == 0) return false
    return true
}//return true if have exam slot | false if dont have exam slot

export async function findPhaseBySemId(id, page_no, limit) {
    const detailExamPhase = []
    function insertExamPhase(id, semId, pN, sd, ed, cd, status, des, del) {
        const EPDetail = {
            id: id, semId: semId, ePName: pN, sDay: sd, eDay: ed, courseDone: cd, status: status, des: des, del: del// 1 done, 0 chưa done
        }
        detailExamPhase.push(EPDetail)
    }

    const examPhaseslist = await ExamPhase.findAll({
        where: {
            semId: id,
        },
    })

    const examPhases = await ExamPhase.findAll({
        where: {
            semId: id,
        },
        limit: limit,
        offset: (page_no - 1) * limit
    })


    for (let i = 0; i < examPhases.length; i++) {
        const course = await Course.findAll({
            where: {
                ePId: examPhases[i].id
            }
        })
        const examslot = await ExamSlot.findAll({
            where: {
                ePId: examPhases[i].id
            }
        })
        if (course.length != 0 || examslot.length != 0 || examPhases[i].alive == 0) {
            //1 ko xoa
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 1, examPhases[i].status, examPhases[i].des, 1)
        } else {
            //0 la dc
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 0, examPhases[i].status, examPhases[i].des, 0)
        }
    }
    if (!detailExamPhase) throw new Error("Can not find exam phases !")
    return {
        total: examPhaseslist.length,
        data: detailExamPhase
    }
}

export async function findPhaseBySemIdv2(id) {
    const detailExamPhase = []
    function insertExamPhase(id, semId, pN, sd, ed, cd, status, des, del) {
        const EPDetail = {
            id: id, semId: semId, ePName: pN, sDay: sd, eDay: ed, courseDone: cd, status: status, des: des, del: del// 1 done, 0 chưa done
        }
        detailExamPhase.push(EPDetail)
    }

    const examPhases = await ExamPhase.findAll({
        where: {
            semId: id,
            alive: 1
        }
    })

    for (let i = 0; i < examPhases.length; i++) {
        const course = await Course.findAll({
            where: {
                ePId: examPhases[i].id
            }
        })
        const examslot = await ExamSlot.findAll({
            where: {
                ePId: examPhases[i].id
            }
        })
        if (course.length != 0 || examslot.length != 0 || examPhases[i].alive == 0) {
            //1 ko xoa
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 1, examPhases[i].status, examPhases[i].des, 1)
        } else {
            //0 la dc
            insertExamPhase(examPhases[i].id, examPhases[i].semId, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay, 0, examPhases[i].status, examPhases[i].des, 0)
        }
    }
    if (!detailExamPhase) throw new Error("Can not find exam phases !")
    return detailExamPhase
}