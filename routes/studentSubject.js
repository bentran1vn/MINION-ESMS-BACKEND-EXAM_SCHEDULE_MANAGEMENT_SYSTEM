import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import StudentSubject from '../models/StudentSubject.js'
import { Op } from 'sequelize'
import excel from 'exceljs';
import multer from 'multer';
import Course from '../models/Course.js'
import ExamPhase from '../models/ExamPhase.js'
import { checkClass } from '../services/studentService.js'


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router()

// router.get('/', async (req, res) => {
//     try {
//         //dữ liệu vừa được thêm thì phải xếp ngay
//         //start và end day trong dữ liệu kiểu gì cũng là tương lai so với hiện tại
//         //nên thg mới nhất sẽ là start >= ngày hiện tại
//         const time = new Date() //ngày hiện tại
//         var timeFormatted = time.toISOString().slice(0, 10)

//         const dataForIncomingPhase = await StudentSubject.findAll({
//             where: {
//                 startDay: {
//                     [Op.gt]: timeFormatted
//                 },
//                 status: 1
//             }
//         })

//         if (!dataForIncomingPhase) {
//             res.json(MessageResponse("Nothing new to create schedule!"));
//             return;
//         } else {
//             res.json(DataResponse(dataForIncomingPhase));
//             return;
//         }
//     } catch (error) {
//         res.json(InternalErrResponse());
//         return;
//     }
// })

//
router.post('/excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json("No file uploaded.");
        }

        function isDateOnlyString(inputString) {
            const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateOnlyRegex.test(inputString)) {
                const year = inputString.split("-")[0];
                const month = inputString.split("-")[1];
                const day = inputString.split("-")[2];
                let max = 31;
                if (month == 4 || month == 6 || month == 9 || month == 11) max = 30;
                else {
                    if (month == 2) {
                        if (year % 400 == 0 || (year % 4 == 0 && year % 100 != 0)) max = 29;
                        else max = 28;
                    }
                }
                return day <= max;
            } else {
                return false;
            }
        }

        let dataArr = [];
        const workbook = new excel.Workbook();
        await workbook.xlsx.load(req.file.buffer).then(async () => {
            const worksheet = workbook.getWorksheet(1);

            // Lặp qua từng dòng trong tệp Excel và thêm vào cơ sở dữ liệu
            let currentRow = 1; // Đánh dấu hàng hiện tại

            // Lặp qua từng dòng trong tệp Excel và thêm vào cơ sở dữ liệu, bắt đầu từ hàng thứ 2
            worksheet.eachRow(async (row, rowNumber) => {
                if (currentRow === 1) {
                    // Bỏ qua tiêu đề (hàng đầu tiên)
                    currentRow++;
                    return;
                }
                const start = new Date(row.getCell(4).value);
                const end = new Date(row.getCell(5).value);
                const startFormatted = start.toISOString().slice(0, 10);
                const endFormatted = end.toISOString().slice(0, 10);

                const data = {
                    subjectId: parseInt(row.getCell(1).value),
                    stuId: parseInt(row.getCell(2).value),
                    ePName: row.getCell(3).value,
                    startDay: startFormatted,
                    endDay: endFormatted,
                    status: parseInt(row.getCell(6).value),
                };
                dataArr.push(data);
                // await StudentSubject.create(data);
                currentRow++;
            });
        });
        let errorCheck = 0;
        if (dataArr.length == 0) {
            throw new Error("File has no data");
            return;
        }
        for (const item of dataArr) {
            if (!Number.isInteger(item.subjectId) ||
                !Number.isInteger(item.stuId) ||
                item.status != 1 ||
                !(typeof item.ePName === 'string' && item.ePName.trim() !== '') ||
                isDateOnlyString(item.startDay) == false ||
                isDateOnlyString(item.endDay) == false
            ) {
                errorCheck++;
            }
        }
        if (errorCheck != 0) {
            throw new Error("Excel file data is invalid");
            return;
        }
        for (const item of dataArr) {
            const ex = await StudentSubject.create({
                subjectId: item.subjectId,
                stuId: item.stuId,
                ePName: item.ePName,
                startDay: item.startDay,
                endDay: item.endDay,
                status: item.status
            })
        }
        res.json(MessageResponse("Import data success"));
        return;
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.get('/', async (req, res) => {
    res.json(checkClass(1, 2));
})

export default router