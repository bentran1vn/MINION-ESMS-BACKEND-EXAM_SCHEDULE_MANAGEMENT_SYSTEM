import ExamRoom from '../models/ExamRoom.js'
import StudentExam from '../models/StudentExam.js'
import Course from '../models/Course.js'
import StudentCourse from '../models/StudentCourse.js'
import SubInSlot from '../models/SubInSlot.js'
import fs from 'fs'

export async function autoFillStu() {
    try {
        console.log(`Start arranging rooms`);
        const course = await Course.findAll() // Lấy tất cả course
        for (let i = 0; i < course.length; i++) { // Duyệt từng course bằng courId  
            const ArrStudentIdInCourse = await StudentCourse.findAll({ // Lấy ra tất cả học sinh thi của 1 course bằng courId
                where: {
                    courId: course[i].id
                },
                attributes: ['stuId']
            })

            const ListStudentIdInCoursePE = [] // Array tổng số student ID (PE)
            const ListStudentIdInCourseFE = [] // Array tổng số student ID (FE)
            if (ArrStudentIdInCourse) {
                ArrStudentIdInCourse.forEach(e => { // Lấy ID ra và nhét vào array tổng số student ID của học sinh (cho dễ những thao tác sau)
                    ListStudentIdInCoursePE.push(e.stuId)
                    ListStudentIdInCourseFE.push(e.stuId)
                });
            }
            const SubInSlotList = await SubInSlot.findAll({ // Lấy ra những slot trong SubInSlot bằng courId
                where: {
                    courId: course[i].id
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
                    if (!examRoom) {
                        throw new Error('Error found in examRoom')
                    }
                    examRoom.forEach(e => {
                        ListExamRoom.push(e) // Có room thì nhét vào Array tổng
                    });
                }
            } else {
                throw new Error('Error found in SubInSlot')
            }

            let ListRoomPE = [] // Room cho type PE
            let ListRoomFE = [] // Room cho type FE
            ListExamRoom.forEach(e => {
                if (e.des === 'PE') {
                    ListRoomPE.push(e.id) // Ném id vào ListRoomPE 
                } else {
                    ListRoomFE.push(e.id) // Ném id vào ListRoomFE 
                }
            });

            while (ListRoomPE.length !== 0) { // Trường hợp có thi PE
                const numStuInRoom = Math.floor(ListStudentIdInCoursePE.length / ListRoomPE.length)
                for (let i = 0; i < ListRoomPE.length; i++) { // Duyệt từng room trong array tổng các Exam room
                    const listStu = ListStudentIdInCoursePE.slice(0, numStuInRoom) // Biến chứa tổng số học sinh trong 1 room (<= 15)
                    ListStudentIdInCoursePE.splice(0, numStuInRoom) // Bỏ những phần tử đã dc sử dụng trong Array tổng số student ID

                    for (let j = 0; j < listStu.length; j++) { // Duyệt từng student
                        await StudentExam.create({ // Tạo row trong StudentExam
                            eRId: ListRoomPE[i],
                            stuId: listStu[j]
                        })
                    }
                }
                while (ListStudentIdInCoursePE.length != 0) {
                    for (let i = 0; i <= ListRoomPE.length; i++) {
                        await StudentExam.create({
                            eRId: ListRoomPE[i],
                            stuId: ListStudentIdInCoursePE[0]
                        })
                        ListStudentIdInCoursePE.splice(0, 1)
                        if (ListStudentIdInCoursePE.length == 0) break
                    }
                }
                ListRoomPE = [] // Xóa list room PE
            }

            while (ListRoomFE.length !== 0) { // Trường hợp có thi FE
                const numStuInRoom = Math.floor(ListStudentIdInCourseFE.length / ListRoomFE.length)
                for (let i = 0; i < ListRoomFE.length; i++) {
                    const listStu = ListStudentIdInCourseFE.slice(0, numStuInRoom)
                    ListStudentIdInCourseFE.splice(0, numStuInRoom)

                    for (let j = 0; j < listStu.length; j++) {
                        await StudentExam.create({
                            eRId: ListRoomFE[i],
                            stuId: listStu[j]
                        })
                    }
                }
                while (ListStudentIdInCourseFE.length != 0) {
                    for (let i = 0; i <= ListRoomFE.length; i++) {
                        await StudentExam.create({
                            eRId: ListRoomFE[i],
                            stuId: ListStudentIdInCourseFE[0]
                        })
                        ListStudentIdInCourseFE.splice(0, 1)
                        if (ListStudentIdInCourseFE.length == 0) break
                    }
                }
                ListRoomFE = [] // Xóa list room FE
            }
        }
        console.log('Arrangement completed');
    } catch (error) {
        console.log(error);
    }
}
