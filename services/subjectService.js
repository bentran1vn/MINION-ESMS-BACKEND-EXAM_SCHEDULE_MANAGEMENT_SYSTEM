import Subject from '../models/Subject.js'
import Course from '../models/Course.js'

export async function createSubject(body){
    const subject = await Subject.findOne({
        where: {
            code: body.code,
            status: 1
        }
    })
    if (subject) {
        await Subject.update(
            {
                code: body.code,
                name: body.name,
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

export async function deleteSubject(id){
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

export async function updateSubject(id, data){
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

export async function getAvailableSubject(){
    const subjects = await Subject.findAll({
        where: {
            status: 1
        }
    });
    if (subjects.length == 0) {
        return "Not Found!";
    } else {
        return subjects;
    }
}