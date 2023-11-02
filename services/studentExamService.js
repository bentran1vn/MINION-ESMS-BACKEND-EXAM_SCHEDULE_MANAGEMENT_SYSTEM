import express from 'express'
import StudentExam from '../models/StudentExam.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'
import Subject from '../models/Subject.js'
import ExamSlot from '../models/ExamSlot.js'
import ExamRoom from '../models/ExamRoom.js'

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