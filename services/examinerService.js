import ExamPhase from "../models/ExamPhase.js";
import Examiner from "../models/Examiner.js";
import ExamSlot from "../models/ExamSlot.js";
import TimeSlot from "../models/TimeSlot.js";
import SubInSlot from "../models/SubInSlot.js";
import ExamRoom from "../models/ExamRoom.js";
import ExaminerLogTime from "../models/ExaminerLogTime.js";
import Semester from "../models/Semester.js";
import Course from "../models/Course.js";
import Subject from "../models/Subject.js";
import Room from "../models/Room.js";
import { Op } from 'sequelize'



export async function getScheduleByPhase(userId, examPhaseId, semId) {
    //day - startTime - endTime - Room
    let scheduleWithPhase = [];

    const exPhase = await ExamPhase.findOne({
        where: {
            id: examPhaseId
        }
    })

    const exMiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semId
        }
    })

    const examSlot = await ExamSlot.findAll({
        where: {
            ePId: examPhaseId
        }
    })

    for (const item of examSlot) {
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: parseInt(item.dataValues.timeSlotId)
            }
        });

        const subSlot = await SubInSlot.findAll({
            where: {
                exSlId: parseInt(item.dataValues.id)
            }
        });

        for (const sub of subSlot) {
            const exRoom = await ExamRoom.findAll({
                where: {
                    sSId: sub.dataValues.id
                }
            });

            for (const ex of exRoom) {
                const examinerLog = await ExaminerLogTime.findOne({
                    where: {
                        day: item.dataValues.day,
                        timeSlotId: timeSlot.id,
                        examinerId: exMiner.id,
                        semId: semId
                    }
                });

                if (!examinerLog && exPhase.status == 1) {
                    const sche = {
                        day: item.dataValues.day,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime,
                        register: 1 // được đăng ký
                    };
                    scheduleWithPhase.push(sche);
                } else if (examinerLog || examPhaseId.status == 0) {
                    const sche = {
                        day: item.dataValues.day,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime,
                        register: 0 // không được đăng ký
                    };
                    scheduleWithPhase.push(sche);
                }
            }
        }
    }
    let result = [];
    const counts = {};
    // Duyệt qua danh sách slot available và đếm số lần xuất hiện của mỗi khung giờ khác nhau
    scheduleWithPhase.forEach(item => {
        // Tạo một chuỗi duy nhất để đại diện cho mục
        const key = JSON.stringify(item);
        // Kiểm tra nếu đã có mục này trong counts, nếu chưa thì đặt giá trị mặc định là 0
        if (!counts[key]) {
            counts[key] = 0;
        }
        // Tăng số lần xuất hiện lên 1
        counts[key]++;
    });

    // Hiển thị kết quả
    for (const key in counts) {
        const item = JSON.parse(key);
        const kq = {
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            available: counts[key],
            register: item.register
        }
        result.push(kq);
    }
    return result;
}

export async function getAllSchedule(examinerId) {
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)

    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    if (!semester) {
        res.json(MessageResponse("Table semester have no data for current day"));
        return;
    }

    let availableSlotList = [];
    const slotExaminer = await ExamRoom.findAll();
    if (!slotExaminer) {
        res.json(MessageResponse("Exam room has no data"));
        return;
    }
    const slotAvailable = slotExaminer.map(examRoom => examRoom.dataValues);

    for (const item of slotAvailable) {
        const sSId = item.sSId;

        const subjectInSlot = await SubInSlot.findOne({ // Lọc ra, chỉ láy những
            where: {
                id: sSId
            }
        })
        const examSlot = await ExamSlot.findOne({
            where: {
                id: subjectInSlot.exSlId
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: examSlot.timeSlotId
            }
        })

        if (examinerId != null) {
            const checkLecLogTime = await ExaminerLogTime.findOne({
                where: {
                    day: examSlot.day,
                    timeSlotId: timeSlot.id,
                    examinerId: examinerId,
                    semId: semester.id,
                }
            })
            if (checkLecLogTime) {
                const ob = {
                    day: examSlot.day,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime,
                    semId: semester.id,
                    busy: true, //status = true là không được nhận lịch nữa, bận rồi
                }
                availableSlotList.push(ob);
            } else {
                const ob = {
                    day: examSlot.day,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime,
                    semId: semester.id,
                    busy: false, //status = false là được nhận lịch nữa, rảnh
                }
                availableSlotList.push(ob);

            }
        } else if (examinerId == null) {
            const ob = {
                day: examSlot.day,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                semId: semester.id,
                busy: false, //status = false là được nhận lịch nữa, rảnh
            }
            availableSlotList.push(ob);
        }
    }
    const currentExamPhase = await ExamPhase.findOne({
        where: {
            startDay: {
                [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            endDay: {
                [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })

    const statusMap = new Map([
        [0, 'passed'],
        [1, 'on-going'],
        [2, 'future']
    ]);
    let passedSchedule = [];
    let currentSchedule = [];
    let futureSchedule = [];

    availableSlotList.forEach(item => {
        if (timeFormatted > item.day) {
            const s1 = {
                day: item.day,
                startTime: item.startTime,
                endTime: item.endTime,
                semId: item.semId,
                busy: item.busy,
                status: statusMap.get(0)
            }
            passedSchedule.push(s1)
        } else if (currentExamPhase && (item.day >= currentExamPhase.startDay && item.day <= currentExamPhase.endDay)) {
            const s2 = {
                day: item.day,
                startTime: item.startTime,
                endTime: item.endTime,
                semId: item.semId,
                busy: item.busy,
                status: statusMap.get(1)
            }
            currentSchedule.push(s2)
        } else if (item.day > timeFormatted) {
            const s3 = {
                day: item.day,
                startTime: item.startTime,
                endTime: item.endTime,
                semId: item.semId,
                busy: item.busy,
                status: statusMap.get(2)
            }
            futureSchedule.push(s3)
        }
    })

    let finalList = [...passedSchedule, ...currentSchedule, ...futureSchedule];
    let result = [];
    const counts = {};
    // Duyệt qua danh sách slot available và đếm số lần xuất hiện của mỗi khung giờ khác nhau
    finalList.forEach(item => {
        // Tạo một chuỗi duy nhất để đại diện cho mục
        const key = JSON.stringify(item);
        // Kiểm tra nếu đã có mục này trong counts, nếu chưa thì đặt giá trị mặc định là 0
        if (!counts[key]) {
            counts[key] = 0;
        }
        // Tăng số lần xuất hiện lên 1
        counts[key]++;
    });

    // Hiển thị kết quả
    for (const key in counts) {
        const item = JSON.parse(key);
        const kq = {
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            available: counts[key],
            busy: item.busy,
            status: item.status,
        }
        result.push(kq);
    }
    return result;
}

export async function getScheduledOneExaminer(id) {
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)
    const curPhase = await ExamPhase.findOne({
        where: {
            startDay: {
                [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            endDay: {
                [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    const result = await ExamRoom.findAll({
        where: { examinerId: id },
        include: [
            {
                model: SubInSlot,
                include: [
                    {
                        model: Course,
                        where: { status: 1 },
                        include: [
                            {
                                model: Subject,
                                where: { status: 1 },
                                attributes: ['code', 'name'], // Chọn các trường bạn muốn lấy từ bảng Subject
                            },
                        ],
                    },
                    {
                        model: ExamSlot,
                        include: [
                            {
                                model: TimeSlot,
                                attributes: ['startTime', 'endTime'], // Chọn các trường bạn muốn lấy từ bảng TimeSlot
                            },
                        ],
                    },
                ],
            },
            {
                model: Room,
                where: { status: 1 },
                attributes: ['roomNum', 'location'], // Chọn các trường bạn muốn lấy từ bảng Room
            },
        ],
    })
    let listSchedule = [];
    let finalList = [];
    if (result.length === 0) {
        res.json(MessageResponse("Your schedule is empty !"))
        return;
    } else {
        for (const schedule of result) {
            const room = schedule.room;
            const subject = schedule.subInSlot.course.subject;
            const examSlot = schedule.subInSlot.examSlot;
            const timeSlot = schedule.subInSlot.examSlot.timeSlot;
            const sche = { 
                subCode: subject.code,
                subName: subject.name,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                day: examSlot.day,
                roomCode: room.roomNum,
                roomLocation: room.location
            };
            listSchedule.push(sche);
        }
       
        for (const sche of listSchedule) {
            if (curPhase && (curPhase.startDay <= sche.day && sche.day <= curPhase.endDay)) {
                const f = {
                    subCode: sche.subCode,
                    subName: sche.subName,
                    startTime: sche.startTime,
                    endTime: sche.endTime,
                    day: sche.day,
                    roomCode: sche.roomCode, // corrected roomCode
                    roomLocation: sche.roomLocation, // corrected roomLocation
                    phase: "on-going",
                };
                finalList.push(f);
            } else if (!curPhase && (timeFormatted <= sche.day)) {
                const f = {
                    subCode: sche.subCode,
                    subName: sche.subName,
                    startTime: sche.startTime,
                    endTime: sche.endTime,
                    day: sche.day,
                    roomCode: sche.roomCode, // corrected roomCode
                    roomLocation: sche.roomLocation, // corrected roomLocation
                    phase: "future",
                };
                finalList.push(f);
            } else if (!curPhase && (timeFormatted > sche.day)) {
                const f = {
                    subCode: sche.subCode,
                    subName: sche.subName,
                    startTime: sche.startTime,
                    endTime: sche.endTime,
                    day: sche.day,
                    roomCode: sche.roomCode, // corrected roomCode
                    roomLocation: sche.roomLocation, // corrected roomLocation
                    phase: "passed",
                };
                finalList.push(f);
            }
        }
        
    }
    return finalList;
}