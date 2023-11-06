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

const router = express.Router()

//------------------------------------dash của admin
router.get('/examinerDashBoard', requireRole('admin'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        const statusMap = new Map([
            [0, 'lecturer'],
            [1, 'staff'],
            [2, 'volunteer']
        ]);
        let examinerLists = [];
        const exPhase = await ExamPhase.findOne({
            where: {
                id: exPhaseId
            }
        })
        if (exPhase) {
            const examiners = await ExaminerLogTime.findAll({
                where: {
                    day: {
                        [Op.gte]: exPhase.startDay, // Lấy examiner có day lớn hơn hoặc bằng startDay
                        [Op.lte]: exPhase.endDay,   // và nhỏ hơn hoặc bằng endDay
                    }
                }
            });
            if (examiners.length == 0) {
                res.json(MessageResponse("This phase has no examiners"));
                return;
            }
            const uniqueExaminers = examiners.reduce((acc, current) => {
                const x = acc.find(item => item.examinerId === current.examinerId);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);

            for (const item of uniqueExaminers) {
                const examiner = await Examiner.findOne({
                    where: {
                        id: item.examinerId,
                        semesterId: item.semId
                    }
                });

                const ex = {
                    exEmail: examiner.exEmail,
                    exName: examiner.exName,
                    role: statusMap.get(examiner.typeExaminer),
                    status: examiner.status
                };

                examinerLists.push(ex);
            }
            res.json(DataResponse(examinerLists.length));
            return;
        } else {
            res.json(NotFoundResponse());
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
    //trả ra email name, role, status
})// Tổng số examiner tham gia trong phase

router.get('/totalSlotDashBoard', requireRole('admin'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        const phase = await ExamPhase.findOne({
            where: {
                id: exPhaseId
            }
        });
        if (!phase) {
            res.json(NotFoundResponse());
            return;
        }

        const exSlot = await ExamSlot.findAll({
            where: {
                [Op.and]: [
                    { day: { [Op.gte]: phase.startDay } },
                    { day: { [Op.lte]: phase.endDay } }
                ]
            }
        });
        if (exSlot.length == 0) {
            res.json(MessageResponse("This phase doesn't have any slots"));
            return;
        }
        let totalSlot = 0;
        for (const slot of exSlot) {
            const subSlot = await SubInSlot.findAll({
                where: {
                    exSlId: slot.dataValues.id
                }
            })
            for (const sub of subSlot) {
                const exRoom = await ExamRoom.findAll({
                    where: {
                        sSId: sub.dataValues.id
                    }
                })
                totalSlot += exRoom.length;
            }
        }
        res.json(DataResponse(totalSlot));
        return;
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số slot trong phase

router.get('/totalStaffDashBoard', requireRole('admin'), async (req, res) => {
    try {
        const user = await User.findAll({
            where: {
                role: { [Op.like]: 'staff' }
            }
        })
        res.json(DataResponse(user.length))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số Staff

router.get('/topThreeExaminerDashBoard', requireRole('admin'), async (req, res) => {
    const exPhaseId = parseInt(req.query.ePId);
    try {
        const phase = await ExamPhase.findOne({
            where: {
                id: exPhaseId
            }
        });

        const exSlot = await ExamSlot.findAll({
            where: {
                [Op.and]: [
                    { day: { [Op.gte]: phase.startDay } },
                    { day: { [Op.lte]: phase.endDay } }
                ]
            }
        });
        if (exSlot.length == 0) {
            res.json(MessageResponse("This phase doesn't have any slots"));
            return;
        }
        let examRoomWithExaminer = [];
        for (const slot of exSlot) {
            const subSlot = await SubInSlot.findAll({
                where: {
                    exSlId: slot.dataValues.id
                }
            })
            for (const sub of subSlot) {
                const exRoom = await ExamRoom.findAll({
                    where: {
                        sSId: sub.dataValues.id,
                        examinerId: { [Op.ne]: null }
                    }
                })
                if (exRoom.length != 0) {
                    for (const ex of exRoom) {
                        const s = {
                            sSId: ex.dataValues.sSId,
                            examinerId: ex.dataValues.examinerId
                        }
                        examRoomWithExaminer.push(s);
                    }
                }
            }
        }

        const examinerCount = {};

        for (const item of examRoomWithExaminer) {
            const examinerId = item.examinerId;
            if (examinerCount[examinerId]) {
                examinerCount[examinerId]++;
            } else {
                examinerCount[examinerId] = 1;
            }
        }
        const uniqueValues = [...new Set(Object.values(examinerCount))];
        uniqueValues.sort((a, b) => b - a);
        const top3UniqueValues = uniqueValues.slice(0, 1);

        const keysWithTopValues = [];

        for (const key in examinerCount) {
            const value = examinerCount[key];
            if (top3UniqueValues.includes(value)) {
                const s = {
                    id: key,
                    quantity: value,
                }
                keysWithTopValues.push(s);
            }
        }

        let returnL = [];
        for (const item of keysWithTopValues) {
            const examiner = await Examiner.findOne({
                where: {
                    id: item.id
                }
            })
            const s = {
                exName: examiner.exName,
                exEmail: examiner.exEmail,
                quantity: item.quantity
            }
            returnL.push(s);
        }
        if (returnL.length != 0) {
            res.json(DataResponse(returnL));
        } else {
            res.json(NotFoundResponse());
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Top 3 examiner canh thi

router.get('/courseAndNumOfStuDashBoard', requireRole('admin'), async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    let listCourse = [];
    try {
        const result = await Course.findAll({
            where: {
                ePId
            },
            include: [{
                model: Subject,
                attributes: ['code']
            }]
        });

        const examPhase = await ExamPhase.findOne({
            where: {
                id: ePId
            }
        })
        if (!examPhase) {
            res.json(NotFoundResponse());
            return;
        }
        for (const course of result) {
            if (course.dataValues.status == 1) {
                const subject = course.subject;
                const sub = {
                    courseId: course.dataValues.id,
                    subCode: subject.code,
                    numOfStu: course.dataValues.numOfStu
                };
                listCourse.push(sub);
            } else {
                const subject = course.subject;
                const sub = {
                    courseId: course.dataValues.id,
                    subCode: subject.code,
                    numOfStu: course.dataValues.numOfStu
                };
                listCourse.push(sub);
            }
        }
        if (listCourse.length == 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(DataResponse(listCourse));
        }

    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Course và số lượng hs mỗi course

router.get('/numOfCourseNotScheduled', requireRole('admin'), async (req, res) => {
    try {
        const ePId = req.query.ePId
        const numOfCourse = await getNotSheduleOfCourse(ePId)
        const courseInEp = await Course.findAll({
            where: {
                ePId: ePId
            }
        })
        const s = {
            assigned: numOfCourse.length,
            total: courseInEp.length
        }
        res.json(DataResponse(s))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Số lượng course chưa dc xếp lịch xong

router.get('/numOfDayRegister', requireRole('admin'), async (req, res) => {
    try {
        const numRegister = []
        function insertnumRegister(day, num) {
            const detail = {
                day: day, num: num
            }
            numRegister.push(detail)
        }

        const ePId = parseInt(req.query.ePId)
        const examPhase = await ExamPhase.findOne({
            where: {
                id: ePId
            }
        })
        if (!examPhase) {
            res.json(MessageResponse('Error in find examPhase'))
        } else {
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
            for (let i = 0; i < exminerLogTime.length; i++) {
                let timeformat = exminerLogTime[i].createdAt.toISOString().slice(0, 10)
                if (!arr.includes(timeformat)) {
                    arr.push(timeformat)
                }
            }

            let count = 0
            for (let j = 0; j < arr.length; j++) {
                for (let m = 0; m < exminerLogTime.length; m++) {
                    let timeformat = exminerLogTime[m].createdAt.toISOString().slice(0, 10)
                    if (timeformat == arr[j])
                        count++
                }
                let timeFormat2 = new Date(arr[j]).toISOString().slice(0, 10)
                insertnumRegister(timeFormat2, count)
                count = 0
            }
            res.json(DataResponse(numRegister))
        }
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
        let count = 0;
        const examiner = await Examiner.findAll({
            where: {
                userId: userId
            }
        })
        for (const exId of examiner) {
            const examRoom = await ExamRoom.findAll({
                where: {
                    examinerId: exId.dataValues.id
                }
            })
            count += examRoom.length;
        }
        res.json(DataResponse(count));
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
        let count = 0;
        const phase = await ExamPhase.findOne({
            where: {
                id: phaseId
            }
        })
        const semester = await Semester.findOne({
            where: {
                start: { [Op.lte]: phase.startDay },
                end: { [Op.gte]: phase.endDay }
            }
        })
        const examiner = await Examiner.findOne({
            where: {
                userId: userId,
                semesterId: semester.id
            }
        })
        const exslot = await ExamSlot.findAll({
            where: {
                ePId: phaseId
            }
        })
        for (const exSl of exslot) {
            const subSlot = await SubInSlot.findAll({
                where: {
                    exSlId: exSl.dataValues.id
                }
            })
            for (const sub of subSlot) {
                const examRoom = await ExamRoom.findAll({
                    where: {
                        sSId: sub.dataValues.id,
                        examinerId: examiner.id
                    }
                })
                count += examRoom.length
            }
        }
        res.json(DataResponse(count));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tất cả slot đk 1 phase


router.get('/futureSlotOfLecOnePhase',requireRole('lecturer'), async (req, res) => {
    // const userId = parseInt(req.locals.userData.id);//nhận từ token
    const userId = 256;
    const phaseId = parseInt(req.query.phaseId);
    try {
        let count = 0;
        const phase = await ExamPhase.findOne({
            where: {
                id: phaseId
            }
        })
        const semester = await Semester.findOne({
            where: {
                start: { [Op.lte]: phase.startDay },
                end: { [Op.gte]: phase.endDay }
            }
        })
        const examiner = await Examiner.findOne({
            where: {
                userId: userId,
                semesterId: semester.id
            }
        })
        const exslot = await ExamSlot.findAll({
            where: {
                ePId: phaseId
            }
        })
        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)

        for (const exSl of exslot) {
            if (exSl.dataValues.day > timeFormatted) {
                const subSlot = await SubInSlot.findAll({
                    where: {
                        exSlId: exSl.dataValues.id
                    }
                })
                for (const sub of subSlot) {
                    const examRoom = await ExamRoom.findAll({
                        where: {
                            sSId: sub.dataValues.id,
                            examinerId: examiner.id
                        }
                    })
                    count += examRoom.length
                }
            }
        }
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
        const examiner = await Examiner.findAll({
            where: {
                userId: userId
            }
        })
        const semester = await Semester.findOne({
            where: {
                id: semesterId
            }
        })
        let room = [];
        for (const ex of examiner) {
            const exroom = await ExamRoom.findAll({
                where: {
                    examinerId: ex.dataValues.id
                }
            })
            const a = exroom.map(e => e.dataValues);
            room = [...room, ...a];
        }
        //mảng room đã chứa tất cả slot đã đk từ trước tới giờ
        const examphase = await ExamPhase.findAll();
        let sloteachphase = [];
        for (const phase of examphase) {
            if (phase.startDay >= semester.start && phase.endDay <= semester.end) {
                let slotperphase = 0;
                for (const ex of room) {
                    const sub = await SubInSlot.findOne({
                        where: {
                            id: ex.sSId
                        }
                    })
                    const exslot = await ExamSlot.findOne({
                        where: {
                            id: sub.exSlId
                        }
                    })
                    if (exslot.day >= phase.dataValues.startDay && exslot.day <= phase.dataValues.endDay) {
                        slotperphase++;
                    }
                }
                const s = {
                    phaseId: phase.dataValues.id,
                    phaseName: phase.dataValues.ePName,
                    slot: slotperphase
                }
                sloteachphase.push(s);
            }
        }
        res.json(DataResponse(sloteachphase));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Tổng số lượt canh thi mỗi phase từ trc tới hiện tại


//------------------------------------dash của staff
router.get('/totalExamSLotByPhase', requireRole('staff'), async (req, res) => {
    try {
        const ePId = parseInt(req.query.ePId)
        const examSlot = await ExamSlot.findAll({
            where: {
                ePId
            }
        })
        res.json(DataResponse(examSlot.length))
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
                id: ePId
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