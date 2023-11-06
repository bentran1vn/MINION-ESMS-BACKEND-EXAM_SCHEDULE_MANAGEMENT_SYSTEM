import express from 'express'
import { DataResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Examiner from '../models/Examiner.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import ExamSlot from '../models/ExamSlot.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import { Op } from 'sequelize'
import ExamPhase from '../models/ExamPhase.js'
import { getNotSheduleOfCourse } from '../services/studentExamService.js'
import Semester from '../models/Semester.js'
import User from '../models/User.js'
import { countExaminerInPhase, countStaff, countTotalSlot, futureSlotOfLecOnePhase, numOfCourseNotScheduled, numOfDayRegister, numberByCourse, totalExamSLotByPhase, totalRegistionEachPhase, totalRegistionOfLec, totalRegistionOfLecOnePhase } from '../services/dashboardService.js'
import { json } from 'body-parser'

const router = express.Router()

//------------------------------------dash của admin
router.get('/examinerDashBoard', requireRole('admin'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        let total = await countExaminerInPhase(exPhaseId);
        res.json(DataResponse(total));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
    //trả ra email name, role, status
})// Tổng số examiner tham gia trong phase

router.get('/totalSlotDashBoard', requireRole('admin'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        let totalSlot = await countTotalSlot(exPhaseId)
        res.json(DataResponse(totalSlot));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số slot trong phase

router.get('/totalStaffDashBoard', requireRole('admin'), async (req, res) => {
    try {
        const total = await countStaff()
        res.json(DataResponse(total))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số Staff

router.get('/topThreeExaminerDashBoard', requireRole('admin'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        let topThree = await topThreeExaminerDashBoard(exPhaseId)
        res.json(DataResponse(topThree));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Top 3 examiner canh thi

router.get('/courseAndNumOfStuDashBoard', requireRole('admin'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let courses = await numberByCourse(ePId)
        res.json(DataResponse(courses))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Course và số lượng hs mỗi course

router.get('/numOfCourseNotScheduled', requireRole('admin'), async (req, res) => {
    try {
        let total = await numOfCourseNotScheduled()
        res.json(DataResponse(total))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số lượng course chưa dc xếp lịch xong

router.get('/numOfDayRegister', requireRole('admin'), async (req, res) => {
    try {
        let numRegister = await numOfDayRegister()
        res.json(DataResponse(numRegister))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số lượng đăng kí coi thi theo những ngày trong phase

//------------------------------------dash của lecturer
router.get('/totalRegistionOfLec', requireRole('lecturer'), async (req, res) => {
    // const userId = parseInt(req.locals.userData.id);//nhận từ token
    const userId = 256;
    try {
        let total = await totalRegistionOfLec(userId);
        res.json(DataResponse(total));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tất cả slot đã đk của lec

router.get('/totalRegistionOfLecOnePhase', requireRole('lecturer'), async (req, res) => {
    // const userId = parseInt(req.locals.userData.id);//nhận từ token
    const userId = 256;
    const phaseId = parseInt(req.query.phaseId);
    try {
        let count = await totalRegistionOfLecOnePhase(userId, phaseId);
        res.json(DataResponse(count));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tất cả slot đk 1 phase


router.get('/futureSlotOfLecOnePhase', requireRole('lecturer'), async (req, res) => {
    // const userId = parseInt(req.locals.userData.id);//nhận từ token
    const userId = 256;
    const phaseId = parseInt(req.query.phaseId);
    try {
        let count = await futureSlotOfLecOnePhase(userId, phaseId);
        res.json(DataResponse(count));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số slot chưa đi coi của 1 phase 

router.get('/totalRegistionEachPhase', requireRole('lecturer'), async (req, res) => {
    const userId = 256;
    const semesterId = parseInt(req.query.semesterId)
    try {
        let sloteachphase = await totalRegistionEachPhase(userId, semesterId)
        res.json(DataResponse(sloteachphase));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số lượt canh thi mỗi phase từ trc tới hiện tại


//------------------------------------dash của staff
router.get('/totalExamSLotByPhase', requireRole('staff'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let total = await totalExamSLotByPhase(ePId)
        res.json(DataResponse(total))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số examSlot theo phaseId

router.get('/totalExaminerByPhase', requireRole('staff'), async (req, res) => {
    try {
        const ePId = parseInt(req.query.ePId)
        const examPhase = await ExamPhase.findOne({
            where: {
                id: ePId,
                alive: 1
            }
        })
        const exminerLogTime = await ExaminerLogTime.findAll({
            where: {
                day: {
                    [Op.and]: {
                        [Op.gte]: examPhase.startDay,
                        [Op.lt]: examPhase.endDay
                    }
                }
            }
        })
        let arr = []
        for (const item of exminerLogTime) {
            if (!arr.includes(item.examinerId)) {
                arr.push(item.examinerId)
            }
        }
        res.json(DataResponse(arr.length))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số Examiner theo phaseId

router.get('/totalCourseByPhase', requireRole('staff'), async (req, res) => {
    try {
        const ePId = parseInt(req.query.ePId)
        const course = await Course.findAll({
            where: {
                ePId
            }
        })
        res.json(DataResponse(course.length))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số course theo phaseId

// Số lượng course chưa dc xếp lịch xong - giống admin
// Top 3 examiner canh thi - giống admin
// Course và số lượng hs mỗi course - giống admin

router.get('/totalExamroomByPhase', requireRole('staff'), async (req, res) => {
    try {
        const ePId = parseInt(req.query.ePId)
        let arr = []
        function insert(day, numExamroom) {
            const a = {
                day, numExamroom
            }
            arr.push(a)
        }
        const examSlots = await ExamSlot.findAll({
            where: {
                ePId: ePId
            }
        })
        let arrDay = []
        for (const item of examSlots) {
            if (!arrDay.includes(item.day)) {
                arrDay.push(item.day)
            }
        }
        for (const day of arrDay) {
            const examSlots = await ExamSlot.findAll({
                where: {
                    day: day
                }
            })
            let arrIdES = []
            for (let i = 0; i < examSlots.length; i++) {
                arrIdES.push(examSlots[i].id)
            }
            const subInSLot = await SubInSlot.findAll({
                where: {
                    exSlId: arrIdES
                }
            })

            let arrIdSIS = []
            for (let i = 0; i < subInSLot.length; i++) {
                arrIdSIS.push(subInSLot[i].id)
            }
            const examRoom = await ExamRoom.findAll({
                where: {
                    sSId: arrIdSIS
                }
            })
            insert(day, examRoom.length)
        }
        res.json(DataResponse(arr))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số schedule (examroom) theo ngày trong phase (mảng)

export default router