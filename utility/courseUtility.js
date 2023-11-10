import StudentSubject from '../models/StudentSubject.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import ExamPhase from '../models/ExamPhase.js'
import { Op } from 'sequelize'
import { check } from 'express-validator'


export async function autoCreateCourse() {
    const stuSub = await StudentSubject.findAll({
        where: {
            status: 1
        }
    })
    const ePName = stuSub[0].ePName
    const examPhase = await ExamPhase.findOne({
        where: {
            ePName: ePName,
            alive: 1
        }
    })

    if (examPhase) {
        const subId = stuSub.map(st => st.dataValues)

        const subIdList = subId.map(s => s.subjectId)

        const uniqueSubIdList = [...new Set(subIdList)];
        for (let i = 0; i < uniqueSubIdList.length; i++) {
            const item = uniqueSubIdList[i];
            const check = await Course.findOne({
                where: {
                    subId: item,
                    ePId: examPhase.id
                }
            });
            if (check) {
                // Xóa item khỏi mảng uniqueSubIdList
                uniqueSubIdList.splice(i, 1);
                // Giảm biến i đi 1 để không bỏ lỡ phần tử kế tiếp sau khi xóa
                i--;
            }
        }
        console.log(uniqueSubIdList);
        let count = 0;
        for (let i = 0; i < uniqueSubIdList.length; i++) {
            const stuSubV2 = await StudentSubject.findAll({
                where: {
                    subjectId: uniqueSubIdList[i],
                    status: 1
                }
            })

            if (count != uniqueSubIdList.length) {
                const a = await Course.create({
                    subId: uniqueSubIdList[i],
                    numOfStu: stuSubV2.length,
                    ePId: examPhase.id,
                    status: 1
                })
                if (a) {
                    count++;
                }
            }
        }
        return true
    }

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
        })

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
