import StudentExam from '../models/StudentExam.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'
import Subject from '../models/Subject.js'
import ExamSlot from '../models/ExamSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import StudentSubject from '../models/StudentSubject.js'
import ExamPhase from '../models/ExamPhase.js'

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

export async function handleFillStu(courId, numOfStu, exRoomId) {
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
    if (ArrStudentIdInCourse.length == 0) throw new Error('Error in get all student')

    const ListStudentIdInCourse = [] // Array tổng số student ID 
    if (ArrStudentIdInCourse.length !== 0) {
        ArrStudentIdInCourse.forEach(e => { // Lấy ID ra và nhét vào array tổng số student ID của học sinh (cho dễ những thao tác sau)
            ListStudentIdInCourse.push(e.stuId)
        });
    } else {
        throw new Error('Error in ArrStudentIdInCourse')
    }

    if (numOfStu > ListStudentIdInCourse.length) {
        throw new Error('The number of students needing placement must be less than or equal to the number of unplaced students')
    }

    const examRoom = await ExamRoom.findOne({ // Lấy ra những room tương ứng với slot
        where: {
            id: exRoomId
        }
    })
    if (!examRoom) {
        throw new Error('Error found in examRoom')
    }
    const numStuInRoom = ListStudentIdInCourse.slice(0, numOfStu)

    for (let i = 0; i < numOfStu; i++) { // Duyệt từng student
        await StudentExam.create({ // Tạo row trong StudentExam
            eRId: examRoom.id,
            stuId: numStuInRoom[i]
        })
        await StudentSubject.update({ status: 0 }, {
            where: {
                subjectId: subIdInCourse.subId,
                stuId: numStuInRoom[i],
                status: 1
            }
        })
    }
}

export async function handleFillStuLittle(courId, numOfStu, examslotId) {
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
    if (ArrStudentIdInCourse.length == 0) {
        throw new Error('Error in get all student')
    }

    const ePName = ArrStudentIdInCourse[0].ePName || ArrStudentIdInCourse.ePName || ArrStudentIdInCourse.dataValues.ePName;
    const examPhase = await ExamPhase.findOne({
        where: {
            ePName: ePName
        }
    })

    const exSlot = await ExamSlot.findOne({
        where: {
            id: examslotId
        }
    })

    const ListStudentIdInCourse = [] // Array tổng số student ID 
    if (ArrStudentIdInCourse.length !== 0) {
        ArrStudentIdInCourse.forEach(e => { // Lấy ID ra và nhét vào array tổng số student ID của học sinh (cho dễ những thao tác sau)
            ListStudentIdInCourse.push(e.stuId)
        });
    } else {
        throw new Error('Error in ArrStudentIdInCourse')
    }

    if (numOfStu > ListStudentIdInCourse.length) {
        throw new Error('The number of students needing placement must be less than or equal to the number of unplaced students')
    }

    const subInSlot = await SubInSlot.findOne({
        where: {
            courId: courId,
            exSlId: exSlot.id,
        }
    })

    let arrReversed = [];
    console.log(subInSlot);
    const examRoom = await ExamRoom.findAll({ // Lấy ra những room tương ứng với slot
        where: {
            sSId: subInSlot.id
        }
    })

    if (examRoom.length == 0) {
        throw new Error('Error found in examRoom')
    }
    for (let i = examRoom.length - 1; i >= 0; i--) {
        arrReversed.push(examRoom[i].id);
    }

    const numStuInRoom = ListStudentIdInCourse.slice(0, numOfStu)

    for (let i = 0; i < numOfStu; i++) {
        for (let j = 0; j < arrReversed.length; j++) {
            let count = 0
            const a = await StudentExam.create({
                eRId: arrReversed[j],
                stuId: numStuInRoom[count]
            })
            const b = await StudentSubject.update({ status: 0 }, {
                where: {
                    subjectId: subIdInCourse.subId,
                    stuId: numStuInRoom[count],
                    ePName: ePName,
                    status: 1
                }
            })
            if (a && b) {
                numStuInRoom.splice(0, 1)
            }
            if (numStuInRoom.length == 0) {
                return
            }
        }
    }
}

export async function getNotSheduleOfCourse(ePId) {

    const numOfStuNotShe = []
    function insertNumOfStuNotShe(courID, subCode, numOfStu) {
        const detail = {
            courId: courID, subCode: subCode, numOfStu: numOfStu
        }
        numOfStuNotShe.push(detail)
    }

    const course = await Course.findAll({
        where: {
            ePId: ePId
        }
    })

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
    let newArray = numOfStuNotShe.filter(item => item.numOfStu == 0)
    return newArray
}