import express from 'express'
import { DataResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import {
    countExaminerInPhase, countStaff, countTotalSlot, futureSlotOfLecOnePhase,
    numOfCourseNotScheduled, numOfDayRegister, numberByCourse, totalExamSLotByPhase,
    totalExaminerByPhase, totalExamroomByPhase, totalRegistionEachPhase, totalRegistionOfLec,
    totalRegistionOfLecOnePhase, topThreeExaminerDashBoard, totalCourseByPhase, percentRegis,
    detailFutureSlotOfLecOnePhase
} from '../services/dashboardService.js'

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

router.get('/topThreeExaminerDashBoard', requireRole('staff'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        let topThree = await topThreeExaminerDashBoard(exPhaseId)
        res.json(DataResponse(topThree));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Top 3 examiner canh thi

router.get('/courseAndNumOfStuDashBoard', requireRole('staff'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let courses = await numberByCourse(ePId)
        res.json(DataResponse(courses))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Course và số lượng hs mỗi course

router.get('/numOfCourseNotScheduled', requireRole('staff'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let total = await numOfCourseNotScheduled(ePId)
        res.json(DataResponse(total))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số lượng course chưa dc xếp lịch xong

router.get('/numOfDayRegister', requireRole('admin'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let numRegister = await numOfDayRegister(ePId)
        res.json(DataResponse(numRegister))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số lượng đăng kí coi thi theo những ngày trong phase

//------------------------------------dash của lecturer
router.get('/totalRegistionOfLec', requireRole('lecturer'), async (req, res) => {
    const userId = parseInt(res.locals.userData.id);//nhận từ token
    // const userId = 256;
    try {
        let total = await totalRegistionOfLec(userId);
        res.json(DataResponse(total));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tất cả slot đã đk của lec

router.get('/totalRegistionOfLecOnePhase', requireRole('lecturer'), async (req, res) => {
    const userId = parseInt(res.locals.userData.id);//nhận từ token
    // const userId = 256;
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
    const userId = parseInt(res.locals.userData.id);//nhận từ token
    // const userId = 256;
    const phaseId = parseInt(req.query.phaseId);
    try {
        let count = await futureSlotOfLecOnePhase(userId, phaseId);
        res.json(DataResponse(count));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số slot chưa đi coi của 1 phase 

router.get('/detailFutureSlotOfLecOnePhase', requireRole('lecturer'), async (req, res) => {
    const userId = parseInt(res.locals.userData.id);//nhận từ token
    //const userId = 331;
    const phaseId = parseInt(req.query.phaseId);
    try {
        let count = await detailFutureSlotOfLecOnePhase(userId, phaseId);
        res.json(DataResponse(count));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.get('/totalRegistionEachPhase', requireRole('lecturer'), async (req, res) => {
    const userId = parseInt(res.locals.userData.id);//nhận từ token
    // const userId = 256;
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
    const ePId = parseInt(req.query.ePId)
    try {
        let total = await totalExaminerByPhase(ePId)
        res.json(DataResponse(total))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số Examiner theo phaseId

router.get('/totalCourseByPhase', requireRole('staff'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let course = await totalCourseByPhase(ePId)
        res.json(DataResponse(course))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số course theo phaseId

// Số lượng course chưa dc xếp lịch xong - giống admin
// Top 3 examiner canh thi - giống admin
// Course và số lượng hs mỗi course - giống admin

router.get('/totalExamroomByPhase', requireRole('staff'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let arr = await totalExamroomByPhase(ePId)
        res.json(DataResponse(arr))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số schedule (examroom) theo ngày trong phase (mảng)

router.get('/percentRegisOnePhase', requireRole("admin"), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    try {
        let arr = await percentRegis(ePId);
        res.json(DataResponse(arr))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

export default router