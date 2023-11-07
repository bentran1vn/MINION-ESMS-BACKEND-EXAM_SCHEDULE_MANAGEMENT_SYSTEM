import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'

export async function createSubject(body) {
    const subject = await Subject.findOne({
        where: {
            code: body.code,
        }
    })
    if (subject) {
        await Subject.update(
            {
                code: body.code,
                name: body.name,
                status: 1
            }, {
            where: {
                id: subject.id
            }
        })
    } else {
        await Subject.create({
            code: body.code,
            name: body.name
        })
    }
    return "Create Success !"
}

export async function deleteSubject(id) {
    const row = await Subject.update({ status: 0 }, {
        where: {
            id: id,
            status: 1
        }
    })
    if (row != 0) {
        const course = await Course.update({ status: 0 }, {
            where: {
                subId: id
            }
        })
        if (course != 0) {
            return "Delete Success, Course updated !"
        } else {
            return "Not Found Subject Id !";
        }
    } else {
        return "Not found";
    }
}

export async function updateSubject(id, data) {
    const row = await Subject.update(data, {
        where: {
            id: id,
            status: 1
        }
    })
    if (row[0] == 0) {
        return "Not Found !";
    } else {
        return "Update Success !";
    }
}

export async function getAvailableSubject() {
    const subject = await Subject.findAll();
    return subject;
    // const current = new Date().toISOString.slice(0, 10);
    // const inSemester = await Semester.findOne({
    //     where: {
    //         start: { [Op.lte]: current },
    //         end: { [Op.gte]: current }
    //     }
    // })
    // let returnL = [];
    // const subjects = await Subject.findAll({
    //     where: {
    //         status: 1
    //     }
    // });
    // for (const sub of subjects) {
    //     if (inSemester || sub.dataValues.status == 0) {
    //         const s = {
    //             id: sub.dataValues.id,
    //             code: sub.dataValues.code,
    //             name: sub.dataValues.name,
    //             status: sub.dataValues.status,
    //             delete: 0//ko đc
    //         }
    //         returnL.push(s)
    //     } else if (!inSemester && sub.dataValues.status == 1) {
    //         const s = {
    //             id: sub.dataValues.id,
    //             code: sub.dataValues.code,
    //             name: sub.dataValues.name,
    //             status: sub.dataValues.status,
    //             delete: 1//đc
    //         }
    //         returnL.push(s)
    //     }
    // }

    // if (returnL.length == 0) {
    //     return "Not Found!";
    // } else {
    //     return returnL;
    // }
}