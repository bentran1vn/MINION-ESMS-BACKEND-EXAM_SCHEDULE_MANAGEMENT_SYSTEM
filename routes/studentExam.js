import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamRoom from '../models/ExamRoom.js'
import Student from '../models/Student.js'
import StudentExam from '../models/StudentExam.js'
import Course from '../models/Course.js'
import SubInSlot from '../models/SubInSlot.js'
import fs from 'fs'
import StaffLogChange from '../models/StaffLogChange.js'
import StudentSubject from '../models/StudentSubject.js'
import Subject from '../models/Subject.js'
import ExamSlot from '../models/ExamSlot.js'
import { where } from 'sequelize'


const router = express.Router()

router.post('/', async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);
    try {
        const subIdInCourse = await Course.findAll({ where: { status: 1 } })// Lấy tất cả subject id trong course cần thi

        for (let i = 0; i < subIdInCourse.length; i++) { // Duyệt từng subject
            const ArrStudentIdInCourse = await StudentSubject.findAll({ // Lấy ra tất cả học sinh thi của 1 subject bằng subjectId
                where: {
                    subjectId: subIdInCourse[i].subId,
                    status: 1
                },
            })

            const ListStudentIdInCourse = [] // Array tổng số student ID 
            if (ArrStudentIdInCourse.length !== 0) {
                ArrStudentIdInCourse.forEach(e => { // Lấy ID ra và nhét vào array tổng số student ID của học sinh (cho dễ những thao tác sau)
                    ListStudentIdInCourse.push(e.stuId)
                });
            }
            const SubInSlotList = await SubInSlot.findAll({ // Lấy ra những slot trong SubInSlot bằng courId
                where: {
                    courId: subIdInCourse[i].id
                }
            })

            const ListExamRoom = []  // Array tổng các Exam room cần cho course 
            if (SubInSlotList.length !== 0) {
                for (let i = 0; i < SubInSlotList.length; i++) { // Duyệt từng slot
                    const examRoom = await ExamRoom.findAll({ // Lấy ra những room tương ứng với slot
                        where: {
                            sSId: SubInSlotList[i].id
                        }
                    })
                    if (examRoom.length === 0) {
                        res.json(MessageResponse('Error found in examRoom'))
                        return
                    } else {
                        examRoom.forEach(e => {
                            ListExamRoom.push(e) // Có room thì nhét vào Array tổng
                        });
                    }
                }
            } else {
                res.json(MessageResponse('Error found in SubInSlot'))
                return
            }

            const numStuInRoom = Math.floor(ListStudentIdInCourse.length / ListExamRoom.length) // Số học sinh có thể trong 1 lớp

            for (let i = 0; i < ListExamRoom.length; i++) { // Duyệt từng room trong array tổng các Exam room
                const listStu = ListStudentIdInCourse.slice(0, numStuInRoom) // Biến chứa tổng số học sinh trong 1 room (<= 15)
                ListStudentIdInCourse.splice(0, numStuInRoom) // Bỏ những phần tử đã dc sử dụng trong Array tổng số student ID

                for (let j = 0; j < listStu.length; j++) { // Duyệt từng student
                    const item = await StudentExam.create({ // Tạo row trong StudentExam
                        eRId: ListExamRoom[i].id,
                        stuId: listStu[j]
                    })
                    let dataT = item.eRId + " - " + item.stuId // Xuất ra file để kiểm tra. Ko push lên
                    fs.appendFileSync("test.txt", dataT + "\n");
                }
            }
            console.log("Số hs còn lại trc khi chia: " + ListStudentIdInCourse);
            while (ListStudentIdInCourse.length != 0) {
                for (let i = 0; i < ListExamRoom.length; i++) {
                    const item = await StudentExam.create({
                        eRId: ListExamRoom[i].id,
                        stuId: ListStudentIdInCourse[0],
                    })
                    let dataT = item.eRId + " - " + item.stuId // Xuất ra file để kiểm tra. Ko push lên
                    fs.appendFileSync("test.txt", dataT + "\n");
                    ListStudentIdInCourse.splice(0, 1)
                    if (ListStudentIdInCourse.length == 0) break
                }
            }
        }
        const staffLog = await StaffLogChange.create({
            tableName: 2,
            userId: staffId,
            typeChange: 5
        })
        if (!staffLog) {
            throw new Error("Create staff log failed");
        }
        res.json(MessageResponse('Auto fill completed'))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Auto fill student to exam room (đã có trong autoFillStu)

router.get('/', async (req, res) => {

    try {
        const numOfStuNotShe = []
        function insertNumOfStuNotShe(courID, subCode, numOfStu) {
            const detail = {
                courId: courID, subCode: subCode, numOfStu: numOfStu
            }
            numOfStuNotShe.push(detail)
        }

        const ePId = parseInt(req.query.ePId)
        const exslotId = parseInt(req.query.exslotId);

        const course = await Course.findAll({
            where: {
                ePId: ePId,
                status: 1
            }
        });

        let arrCour = [];
        let arrSem = [];
        if (course.length == 0) {
            res.json(MessageResponse('All courses and students are scheduled'))
            return;
        } else {
            const subSlot = await SubInSlot.findAll({
                where: {
                    exSlId: exslotId
                }
            })

            if (subSlot.length != 0) {
                for (const i of subSlot) {
                    const cour = await Course.findOne({
                        where: {
                            id: i.dataValues.courId,
                        },
                        include: [
                            { model: Subject }
                        ]
                    })
                    arrSem.push(cour.dataValues.subject.semester); //nhét đc kì nào xếp rồi
                }
                for (const c of course) {
                    for (const i of subSlot) {
                        if (c.dataValues.id === i.dataValues.courId) {
                            arrCour.push(c.dataValues.id)
                        }
                    }
                }
                for (const c of course) {
                    const cour = await Course.findOne({
                        where: {
                            id: c.dataValues.id,
                        },
                        include: [
                            { model: Subject }
                        ]
                    })
                    if (!arrSem.includes(cour.dataValues.subject.semester)) {
                        arrCour.push(c.dataValues.id)
                    }
                }
            } else {
                for (const c of course) {
                    arrCour.push(c.dataValues.id);
                }
            }
        }

        const course2 = await Course.findAll({
            where: {
                id: arrCour
            }
        })

        for (let i = 0; i < course2.length; i++) {
            const subject = await Subject.findOne({
                where: {
                    id: course2[i].subId
                }
            });
            insertNumOfStuNotShe(course2[i].id, subject.code, course2[i].numOfStu)
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
                        sSId: item.dataValues.id
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
            res.json(DataResponse(newArray))
            return;
        } else {
            res.json(MessageResponse('All courses and students are scheduled'))
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

// router.get('/', async (req, res) => {
//     try {
//         // Đọc nội dung từ tệp văn bản
//         const fileContent = fs.readFileSync("test.txt", "utf8")

//         // Tách nội dung thành các dòng
//         const lines = fileContent.split('\n');
//         console.log(lines);
//         // Khởi tạo hàm chứa fpath
//         const tmp = [];
//         let count = 0
//         let count2 = 0
//         let flag = false
//         let flag2 = false

//         // Duyệt qua từng dòng và kiểm tra định dạng 'FPath- LPath'
//         lines.forEach(line => {
//             const parts = line.trim().split('-');
//             const fpath = parts[0].trim();

//             if (!tmp.includes(fpath)) {
//                 tmp.push(fpath)
//                 count++
//                 flag = true
//                 flag2 = false
//             } else {
//                 count++
//                 flag = false
//                 flag2 = true
//             }
//             if (flag2) {
//                 count2 = count
//             } else {
//                 console.log('Tổng số học sinh: ' + count2);
//             }
//             if (flag) {
//                 console.log('Bắt đầu phòng mới: ' + fpath);
//                 count = 1
//             }

//         });

//         // Trả về số lượng hàng chứa FPath hợp lệ;
//         res.json(MessageResponse('Alooo'))
//     } catch (error) {
//         console.error(error);
//         res.json(MessageResponse('Error found'))
//     }
// })

// router.get('/searchToUpdate', async (req, res) => {
//     const uniId = parseInt(req.query.uniId) || null;
//     try {
//         if (uniId == null) {
//             res.json(MessageResponse("Student ID must be filled to search"));
//             return;
//         } else {
//             const student = await Student.findOne({
//                 where: {
//                     uniId: uniId
//                 }
//             })
//             if (student) {
//                 const stuEx = await StudentExam.findAll({
//                     where: {
//                         stuId: student.id
//                     }
//                 })
//                 if (stuEx) {
//                     res.json(DataResponse(stuEx));
//                     return;
//                 } else {
//                     res.json(MessageResponse("This student doesn't have any schedule"));
//                     return;
//                 }
//             } else {
//                 res.json(MessageResponse("This student ID doesn't exist!"))
//                 return;
//             }
//         }
//     } catch (error) {
//         res.json(InternalErrResponse());
//         console.log(error);
//     }
// })

// router.put('/', async (req, res) => {
//     const staffId = parseInt(res.locals.userData.id);

//     const id = parseInt(req.body.id);
//     const status = req.body.status
//     try {
//         const stuExStatus = await StudentExam.update({
//             status: status
//         }, {
//             where: {
//                 id: id
//             }
//         })
//         if (stuExStatus[0] != 0) {
//             const staffLog = await StaffLogChange.create({
//                 rowId: id,
//                 staffId: staffId,
//                 tableName: 3,
//                 typeChange: 11
//             })
//             if (!staffLog) {
//                 throw new Error("Create staff log failed");
//             }
//             res.json(MessageResponse("Status updated"));
//         }
//     } catch (error) {
//         res.json(InternalErrResponse());
//         console.log(error);
//     }

// })

// router.put('/updateAll', async (req, res) => {
//     const staffId = parseInt(res.locals.userData.id);
//     const status = req.body.status;
//     try {
//         if (status == false) {
//             const studentEx = await StudentExam.update({
//                 status: false
//             }, {
//                 where: {}
//             })
//             if (studentEx[0] != 0) {
//                 const staffLog = await StaffLogChange.create({
//                     tableName: 3,
//                     staffId: staffId,
//                     typeChange: 10
//                 })
//                 if (!staffLog) {
//                     throw new Error("Create staff log failed");
//                 }
//                 res.json(MessageResponse("All status are updated"));
//             }
//         } else if (status == true) {
//             const studentEx = await StudentExam.update({
//                 status: true
//             }, {
//                 where: {}
//             })
//             if (studentEx[0] != 0) {
//                 const staffLog = await StaffLogChange.create({
//                     tableName: 3,
//                     staffId: staffId,
//                     typeChange: 10
//                 })
//                 if (!staffLog) {
//                     throw new Error("Create staff log failed");
//                 }
//                 res.json(MessageResponse("All status are updated"));
//             }
//         } else {
//             res.json(MessageResponse("Status is invalid"));
//         }

//     } catch (error) {
//         res.json(InternalErrResponse());
//         console.log(error);
//     }
// })

export default router