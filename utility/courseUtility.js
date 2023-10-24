import StudentSubject from '../models/StudentSubject.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import { Op } from 'sequelize'


export async function autoCreateCourse() {
    const arrIdSub = []
    const stuSub = await StudentSubject.findAll()

    stuSub.forEach(e => {
        if (!arrIdSub.includes(e.subjectId)) {
            arrIdSub.push(e.subjectId);
        }
    });

    const subject = await Subject.findAll({
        where: {
            id: {
                [Op.or]: arrIdSub
            }
        }
    })

    for (let i = 0; i < subject.length; i++) {
        const stuSub = await StudentSubject.findAll({
            where: {
                subjectId: subject[i].id
            }
        })

        await Course.create({
            subId: subject[i].id,
            numOfStu: stuSub.length,
            semesterId: subject[i].semesterNo,
            status: 1
        })
    }
    return true
}

export async function countCourse() {

    const courses = await Course.findAll();
    let FE = 0
    let PE = 0
    let FEc = 0
    let PEc = 0
    const subjectPromises = [];

    courses.forEach(element => {
        const subjectId = element.subId;

        subjectPromises.push(
            Subject.findOne({
                where: {
                    id: subjectId
                }
            })
        );
    });

    const subjects = await Promise.all(subjectPromises);

    subjects.forEach(subject => {
        if (subject.dataValues.code.slice(-1) != 'c') {
            if (subject.dataValues.fe) {
                FE = FE + 1;
            }
            if (subject.dataValues.pe) {
                PE = PE + 1;
            }
        } else {
            if (subject.dataValues.fe) {
                FEc = FEc + 1;
            }
            if (subject.dataValues.pe) {
                PEc = PEc + 1;
            }
        }
    });

    return { numFE: FE, numPE: PE, numFEc: FEc, numPEc: PEc }
}

export async function courseByPhase(examPhase) {

    const course = await Course.findAll(
        {
            where: {
                status: {
                    [Op.eq]: 1
                }
            }
        },
        {
            order: [
                ['numOfStu', 'ASC']
            ]
        }
    )

    let subList = []

    for (const key in course) {
        subList.push(course[key].subId)
    }//Lấy ra các SubID Với Course Tương Ứng

    const subjectList = await Subject.findAll({
        where: {
            id: subList
        }
    })//Lấy ra các Subject với SubID tương ứng

    const examType = await ExamType.findOne({
        where: {
            id: examPhase.eTId
        }
    })//Lấy ra Loại Examtype của ExamPhase tương ứng

    let listSubByPhase = []

    for (const key in subjectList) {
        if (subjectList[key][examType.type.toLowerCase()] > 0) {
            listSubByPhase.push(subjectList[key].id)
        };
    }//Lấy ra các Subject tương ứng với ExamType của Examphase


    let courseByPhase = await Course.findAll({
        where: {
            subId: listSubByPhase
        }
    })//Lấy ra các Course tương ứng với SubId, những thằng mà có cùng loại với ExamPhase

    return courseByPhase

}
