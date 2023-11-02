import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import StudentSubject from '../models/StudentSubject.js'
import { Op } from 'sequelize'
import excel from 'exceljs';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router()

//Swagger Model
/**
 * @swagger
 * components:
 *   schemas:
 *    StudentSubject:
 *       type: object
 *       required:
 *          - subjectId
 *          - stuId
 *          - ePName
 *          - startDay
 *          - endDay
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          subjectId:
 *              type: integer
 *              description: Reference to Subject id
 *          stuId:
 *              type: string
 *              description: Reference to Student id
 *          ePName:
 *              type: string
 *              description: Name of the exam phase of this list
 *          startDay:
 *              type: DATEONLY
 *              description: Estimate start day of the examphase
 *          endDay:
 *              type: DATEONLY
 *              description: Estimate end day of the examphase
 *       example:
 *           id: 1
 *           subjectId: 1
 *           stuId: 1
 *           ePName: FALL_2023_SE01
 *           startDay: 2023-11-12
 *           endDay: 2023-11-21
 */

//Swagger Tag
/**
 * @swagger
 * tags:
 *    name: StudentSubjects
 *    description: The StudentSubjects managing API
 */

//Swagger Get
/**
 * @swagger
 * /studentSubjects/:
 *   get:
 *     summary: Return all StudentSubject data of incoming ExamPhase
 *     tags: [StudentSubjects]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/studentSubjects'
 *       '500':
 *          description: Internal Server Error!
 */

//req role staff
// router.post('/', async (req, res) => {
//     //staff id thực chất là userId của role staff lấy từ token
//     const staffId = parseInt(res.locals.userData.id);

//     const subjectId = parseInt(req.body.subjectId);
//     const stuId = parseInt(req.body.stuId);
//     const ePName = req.body.ePName;
//     const startDay = req.body.startDay;
//     const endDay = req.body.endDay;

//     try {
//         const time = new Date() //ngày hiện tại
//         var timeFormatted = time.toISOString().slice(0, 10)
//         const curSemester = await Semester.findOne({
//             where: {
//                 start: {
//                     [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
//                 },
//                 end: {
//                     [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
//                 },
//             }
//         })
//         if (curSemester.start > startDay || curSemester.endDay < endDay) {
//             res.json(MessageResponse("You can't create student subject out of current semester"));;
//             return;
//         }

//         const subject = await Subject.findOne({
//             where: {
//                 id: subjectId
//             }
//         })
//         const student = await Student.findOne({
//             where: {
//                 id: stuId
//             }
//         })
//         if (!subject || !student) {
//             res.json(MessageResponse("Not found this subject or student"));
//             return;
//         } else {
//             const studentSubject = await StudentSubject.create({
//                 subjectId: subjectId,
//                 stuId: stuId,
//                 ePName: ePName,
//                 startDay: startDay,
//                 endDay: endDay
//             })
//             if (studentSubject) {
//                 const staffLog = await StaffLogChange.create({
//                     rowId: studentSubject.id,
//                     tableName: 1,
//                     staffId: staffId,
//                     typeChange: 2,
//                 })
//                 if (!staffLog) {
//                     throw new Error("Create staff log failed");
//                 }
//             }
//             res.json(MessageResponse("Create Success !"))
//         }
//     } catch (err) {
//         console.log(err)
//         res.json(InternalErrResponse());
//     }
// })

router.get('/', async (req, res) => {
    try {
        //dữ liệu vừa được thêm thì phải xếp ngay
        //start và end day trong dữ liệu kiểu gì cũng là tương lai so với hiện tại
        //nên thg mới nhất sẽ là start >= ngày hiện tại
        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)

        const dataForIncomingPhase = await StudentSubject.findAll({
            where: {
                startDay: {
                    [Op.gt]: timeFormatted
                },
                status: 1
            }
        })

        if (!dataForIncomingPhase) {
            res.json(MessageResponse("Nothing new to create schedule!"));
            return;
        } else {
            res.json(DataResponse(dataForIncomingPhase));
            return;
        }
    } catch (error) {
        res.json(InternalErrResponse());
        return;
    }
})

router.put('/', async (req, res) => {
    await StudentSubject.update({ status: 0 }, { where: { status: 1 } })
    res.json(MessageResponse('Update success'))
})// Update lại student subject từ status: 1 về 0

router.post('/excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json("No file uploaded.");
        }
        const workbook = new excel.Workbook();
        workbook.xlsx.load(req.file.buffer).then(() => {
            const worksheet = workbook.getWorksheet(1);

            // Lặp qua từng dòng trong tệp Excel và thêm vào cơ sở dữ liệu
            let currentRow = 1; // Đánh dấu hàng hiện tại

            // Lặp qua từng dòng trong tệp Excel và thêm vào cơ sở dữ liệu, bắt đầu từ hàng thứ 2
            worksheet.eachRow(async(row, rowNumber) => {
                if (currentRow === 1) {
                    // Bỏ qua tiêu đề (hàng đầu tiên)
                    currentRow++;
                    return;
                }
                const data = {
                    subjectId: parseInt(row.getCell(1).value),
                    stuId: parseInt(row.getCell(2).value),
                    ePName: row.getCell(3).value,
                    startDay: row.getCell(4).value,
                    endDay: row.getCell(5).value,
                    status: parseInt(row.getCell(6).value),
                };
                await StudentSubject.create(data);
                currentRow++;
            });
            
        });
        res.json(MessageResponse("Import student subject list success"));
        return;
    } catch(err){
        res.json("error");
        console.log(err);
    }
})

export default router