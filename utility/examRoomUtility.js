import ExamRoom from '../models/ExamRoom.js'
import StudentExam from '../models/StudentExam.js'
import Subject from '../models/Subject.js'
import StudentSubject from '../models/StudentSubject.js'
import SubInSlot from '../models/SubInSlot.js'
import Course from '../models/Course.js'

export async function autoFillStu() {
    try {
        console.log(`Start arranging rooms`);
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
                        throw new Error('Error found in examRoom')
                    } else {
                        examRoom.forEach(e => {
                            ListExamRoom.push(e) // Có room thì nhét vào Array tổng
                        });
                    }
                }
            } else {
                throw new Error('Error found in SubInSlot')
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
                }
            }
            while (ListStudentIdInCourse.length != 0) {
                for (let i = 0; i < ListExamRoom.length; i++) {
                    const item = await StudentExam.create({
                        eRId: ListExamRoom[i].id,
                        stuId: ListStudentIdInCourse[0],
                    })
                    ListStudentIdInCourse.splice(0, 1)
                    if (ListStudentIdInCourse.length == 0) break
                }
            }
        }
        await StudentSubject.update({ status: 0 }, { where: { status: 1 } })
        console.log('Arrangement completed');
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found in Auto fill student completed'))
    }
}
