import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamRoom from '../models/ExamRoom.js'
import Student from '../models/Student.js'
import StudentExam from '../models/StudentExam.js'
import Course from '../models/Course.js'
import StudentCourse from '../models/StudentCourse.js'
import SubInSlot from '../models/SubInSlot.js'
import fs from 'fs'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const course = await Course.findAll() // Lấy tất cả course
        for (let i = 0; i < course.length; i++) { // Duyệt từng course bằng courId
            const ArrStudentIdInCourse = await StudentCourse.findAll({ // Lấy ra tất cả học sinh thi của 1 course bằng courId
                where: {
                    courId: course[i].id
                },
                attributes: ['stuId']
            })

            const ListStudentIdInCourse = [] // Array tổng số student ID 
            if (ArrStudentIdInCourse) {
                ArrStudentIdInCourse.forEach(e => { // Lấy ID ra và nhét vào array tổng số student ID của học sinh (cho dễ những thao tác sau)
                    ListStudentIdInCourse.push(e.stuId)
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
                        res.json(MessageResponse('Error found in examRoom'))
                        return
                    }
                    examRoom.forEach(e => {
                        ListExamRoom.push(e.id) // Có room thì nhét vào Array tổng
                    });
                }
            } else {
                res.json(MessageResponse('Error found in SubInSlot'))
                return
            }

            // console.log('Tổng số student trong 1 môn: ' + ListStudentIdInCourse.length);
            // console.log('Số phòng cần thiết cho 1 môn: ' + ListExamRoom.length);
            const numStuInRoom = Math.floor(ListStudentIdInCourse.length / ListExamRoom.length)
            // console.log('Số học sinh trong 1 phòng: ' + numStuInRoom);

            for (let i = 0; i < ListExamRoom.length; i++) { // Duyệt từng room trong array tổng các Exam room
                console.log('Room: ' + ListExamRoom[i]);
                const listStu = ListStudentIdInCourse.slice(0, numStuInRoom) // Biến chứa tổng số học sinh trong 1 room (<= 15)
                ListStudentIdInCourse.splice(0, numStuInRoom) // Bỏ những phần tử đã dc sử dụng trong Array tổng số student ID

                console.log('Nhóm student in room: ' + listStu);
                for (let j = 0; j < listStu.length; j++) { // Duyệt từng student
                    const item = await StudentExam.create({ // Tạo row trong StudentExam
                        eRId: ListExamRoom[i],
                        stuId: listStu[j]
                    })
                    let dataT = item.eRId + " - " + item.stuId // Xuất ra file để kiểm tra. Ko push lên
                    fs.appendFileSync("test.txt", dataT + "\n");
                }
            }
            if (ListStudentIdInCourse.length > 0) {
                console.log('Student dư: ' + ListStudentIdInCourse);
                for (let i = 0; i < ListExamRoom.length; i++) {
                    const item = await StudentExam.create({
                        eRId: ListExamRoom[i],
                        stuId: ListStudentIdInCourse[0]
                    })
                    let dataT = item.eRId + " - " + item.stuId // Xuất ra file để kiểm tra. Ko push lên
                    fs.appendFileSync("test.txt", dataT + "\n");
                    console.log(item.eRId + " - " + item.stuId);
                    ListStudentIdInCourse.splice(0, 1)
                }
            }

            // console.log('Số học sinh còn dư trong 1 phòng: ' + ListStudentIdInCourse.length);
            // console.log('==================');
        }
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found in Auto fill student completed'))
    }
})

router.get('/', async (req, res) => {
    try {
        // Đọc nội dung từ tệp văn bản
        const fileContent = fs.readFileSync("test.txt", "utf8")

        // Tách nội dung thành các dòng
        const lines = fileContent.split('\n');
        console.log(lines);
        // Khởi tạo hàm chứa fpath
        const tmp = [];
        let count = 0
        let count2 = 0
        let flag = false
        let flag2 = false

        // Duyệt qua từng dòng và kiểm tra định dạng 'FPath- LPath'
        lines.forEach(line => {
            const parts = line.trim().split('-');
            const fpath = parts[0].trim();

            if (!tmp.includes(fpath)) {
                tmp.push(fpath)
                count++
                flag = true
                flag2 = false
            } else {
                count++
                flag = false
                flag2 = true
            }
            if (flag2) {
                count2 = count
            } else {
                console.log('Tổng số học sinh: ' + count2);
            }
            if (flag) {
                console.log('Bắt đầu phòng mới: ' + fpath);
                count = 1
            }

        });

        // Trả về số lượng hàng chứa FPath hợp lệ;
        res.json(MessageResponse('Alooo'))
    } catch (error) {
        console.error(error);
        res.json(MessageResponse('Error found'))
    }
})

export default router