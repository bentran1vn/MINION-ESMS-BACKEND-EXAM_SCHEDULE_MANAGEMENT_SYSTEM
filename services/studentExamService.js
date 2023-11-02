import express from 'express'
import StudentExam from '../models/StudentExam.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'
import Subject from '../models/Subject.js'
import ExamSlot from '../models/ExamSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import StudentSubject from '../models/StudentSubject.js'

export async function getNotSheduleOfStudent(ePId) {

    const numOfStuNotShe = []
    function insertNumOfStuNotShe(courID, subCode, numOfStu) {
        const detail = {
            courId: courID, subCode: subCode, numOfStu: numOfStu
        }
        numOfStuNotShe.push(detail)
    }

    const course = await Course.findAll({
        where: {
            ePId: ePId,
            status: 1
        }
    });
    if (!course) throw new Error("Problem with find course in 'count Student not Sheduled!'")

    for (let i = 0; i < course.length; i++) {
        const subject = await Subject.findOne({
            where: {
                id: course[i].subId
            }
        });
        insertNumOfStuNotShe(course[i].id, subject.code, course[i].numOfStu)
    }

    const coursesWithSlot = [];
    const exSlot = await ExamSlot.findAll({
        where: {
            ePId: ePId
        }
    })
    for (let j = 0; j < exSlot.length; j++) {
        const subWithSlot = await SubInSlot.findAll({
            where: {
                exSlId: exSlot[j].id
            }
        })
        for (const item of subWithSlot) {
            const course = await Course.findOne({
                where: {
                    id: item.dataValues.courId
                }
            });

            const subject = await Subject.findOne({
                where: {
                    id: course.subId
                }
            });

            const exRoom = await ExamRoom.findAll({
                where: {
                    sSid: item.dataValues.id
                }
            })

            let count = 0;

            for (const ex of exRoom) {
                const stuExams = await StudentExam.findAll({
                    where: {
                        eRId: ex.dataValues.id
                    }
                });
                count += stuExams.length;
            }
            const cour = {
                courId: course.id,
                subCode: subject.code,
                numOfStu: count,
            };
            coursesWithSlot.push(cour);
        }
    }
    for (let m = 0; m < numOfStuNotShe.length; m++) {
        for (let n = 0; n < coursesWithSlot.length; n++) {
            if (numOfStuNotShe[m].courId == coursesWithSlot[n].courId && numOfStuNotShe[m].numOfStu > coursesWithSlot[n].numOfStu) {
                numOfStuNotShe[m].numOfStu = numOfStuNotShe[m].numOfStu - coursesWithSlot[n].numOfStu
            }
            else if (numOfStuNotShe[m].courId == coursesWithSlot[n].courId && numOfStuNotShe[m].numOfStu == coursesWithSlot[n].numOfStu) {
                numOfStuNotShe[m].numOfStu = 0
            }
        }
    }
    let newArray = numOfStuNotShe.filter(item => item.numOfStu != 0)
    if (newArray.length != 0) {
        return newArray
    } else {
        throw new Error("Problem in 'count Student not Sheduled!'")
    }
}

export async function handleFillStu(courId, numStu, subInSLotId) {
    const subIdInCourse = await Course.findOne({
        where: {
            status: 1,
            id: courId
        }
    })// Lấy subject id trong course cần thi

    const ArrStudentIdInCourse = await StudentSubject.findAll({ // Lấy ra tất cả học sinh thi của 1 subject bằng subjectId
        where: {
            subjectId: subIdInCourse.subId,
            status: 1
        },
    })
    if (!ArrStudentIdInCourse) throw new Error('Error in get all student')

    const ListStudentIdInCourse = [] // Array tổng số student ID 
    if (ArrStudentIdInCourse.length !== 0) {
        ArrStudentIdInCourse.forEach(e => { // Lấy ID ra và nhét vào array tổng số student ID của học sinh (cho dễ những thao tác sau)
            ListStudentIdInCourse.push(e.stuId)
        });
    } else {
        throw new Error('Error in ArrStudentIdInCourse')
    }

    if (numStu > ListStudentIdInCourse.length) {
        throw new Error('The number of students needing placement must be less than or equal to the number of unplaced students')
    }

    const ListStudentIdInCourseV2 = ListStudentIdInCourse.slice(0, numStu)
    let arrListStudentId = ListStudentIdInCourseV2
    const ListExamRoom = []  // Array tổng các Exam room cần cho course 

    const examRoom = await ExamRoom.findAll({ // Lấy ra những room tương ứng với slot
        where: {
            sSId: subInSLotId
        }
    })
    if (examRoom.length === 0) {
        throw new Error('Error found in examRoom')
    } else {
        examRoom.forEach(e => {
            ListExamRoom.push(e) // Có room thì nhét vào Array tổng
        });
    }

    const numStuInRoom = Math.floor(ListStudentIdInCourseV2.length / ListExamRoom.length) // Số học sinh có thể trong 1 lớp

    for (let i = 0; i < ListExamRoom.length; i++) { // Duyệt từng room trong array tổng các Exam room
        const listStu = ListStudentIdInCourseV2.slice(0, numStuInRoom) // Biến chứa tổng số học sinh trong 1 room (<= 15)
        ListStudentIdInCourseV2.splice(0, numStuInRoom) // Bỏ những phần tử đã dc sử dụng trong Array tổng số student ID

        for (let j = 0; j < listStu.length; j++) { // Duyệt từng student
            const item = await StudentExam.create({ // Tạo row trong StudentExam
                eRId: ListExamRoom[i].id,
                stuId: listStu[j]
            })
        }
    }
    while (ListStudentIdInCourseV2.length != 0) {
        for (let i = 0; i < ListExamRoom.length; i++) {
            const item = await StudentExam.create({
                eRId: ListExamRoom[i].id,
                stuId: ListStudentIdInCourseV2[0],
            })
            ListStudentIdInCourseV2.splice(0, 1)
            if (ListStudentIdInCourseV2.length == 0) break
        }
    }
    for (let i = 0; i < arrListStudentId.length; i++) {
        await StudentSubject.Update({ status: 0 }, {
            where: {
                id: arrListStudentId[i],
                status: 1
            }
        })
    }
}