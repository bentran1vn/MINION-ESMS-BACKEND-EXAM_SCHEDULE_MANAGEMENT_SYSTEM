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



export async function getScheduleByPhase(userId, examPhaseId) {
    //day - startTime - endTime - Room
    let scheduleWithPhase = [];

    const exPhase = await ExamPhase.findOne({
        where: {
            id: examPhaseId
        }
    })

    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: exPhase.startDay },
            end: { [Op.gte]: exPhase.endDay }
        }
    })

    const exMiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semester.id
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
            if(exRoom.length == 0){
                return message = "Current phase has no schedule";
            }

            for (const ex of exRoom) {
                const examinerLog = await ExaminerLogTime.findOne({
                    where: {
                        day: item.dataValues.day,
                        timeSlotId: timeSlot.id,
                        examinerId: exMiner.id,
                        semId: semester.id,
                    }
                });

                if (!examinerLog && exPhase.status == 1) {
                    const sche = {
                        examinerId: ex.dataValues.examinerId || null,
                        day: item.dataValues.day,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime,
                        register: 1 // được đăng ký
                    };
                    scheduleWithPhase.push(sche);
                } else if (examinerLog || examPhaseId.status == 0) {
                    const sche = {
                        examinerId: ex.dataValues.examinerId || null,
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
    const tempArray = [...scheduleWithPhase]; // Tạo một bản sao của mảng gốc

    for (const item of scheduleWithPhase) {
        const sche = {
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            register: item.register,
        };

        let check = 0;

        for (const i of tempArray) {
            if (item.day === i.day &&
                item.startTime === i.startTime &&
                item.endTime === i.endTime &&
                i.examinerId === null) {
                check++;
            }
        }

        if (check === 0) {
            sche.available = 0;
            const isContained = result.some(item => JSON.stringify(item) === JSON.stringify(sche));
            if (!isContained) {
                result.push(sche);
            }

        } else if (check !== 0) {
            sche.available = check;
            const isContained = result.some(item => JSON.stringify(item) === JSON.stringify(sche));
            if (!isContained) {
                result.push(sche);
            }
        }
    }
    return result;
}//lịch có thể đăng kí theo phase

//lấy hết lịch đã đk của 1 thg theo phase
export async function getScheduledOneExaminerByPhaseVer2(examinerId, examphaseId) {
    let sheduledList = [];
    let message = "";
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

    const examphase = await ExamPhase.findOne({ where: { id: examphaseId } });
    const exslot = await ExamSlot.findAll({
        where: {
            [Op.and]: [
                { day: { [Op.gte]: examphase.startDay } },
                { day: { [Op.lte]: examphase.endDay } }
            ]
        }
    });
    
    for (const exsl of exslot) {
        const timeslot = await TimeSlot.findOne({
            where: {
                id: exsl.dataValues.timeSlotId
            }
        })
        const subSlot = await SubInSlot.findAll({
            where: {
                exSlId: exsl.dataValues.id
            }
        })
        for (const subSl of subSlot) {
            const cour = await Course.findOne({
                where: {
                    id: subSl.dataValues.courId
                }
            })
            const sub = await Subject.findOne({
                where: {
                    id: cour.subId
                }
            })
            const examroom = await ExamRoom.findAll({
                where: {
                    examinerId: examinerId,
                    sSId: subSl.dataValues.id
                }
            })
            for (const exroom of examroom) {
                const room = await Room.findOne({
                    where: {
                        id: exroom.dataValues.roomId
                    }
                })
                const sche = {
                    subCode: sub.code,
                    subName: sub.name,
                    startTime: timeslot.startTime,
                    endTime: timeslot.endTime,
                    day: exsl.dataValues.day,
                    roomCode: room.roomNum,
                    roomLocation: room.location
                };
                sheduledList.push(sche);
            }
        }
    }
    if(sheduledList.length == 0){
        return message = `Your schedule in phase ${examphase.ePName} is empty`
    }
    let finalList = [];
    for (const sche of sheduledList) {
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

    let returnList = [];
    for (const item of finalList) {
        const current = new Date(timeFormatted);
        const startPhase = new Date(examphase.startDay);
        const timeDifference = Math.abs(startPhase.getTime() - current.getTime());
        const fiveDay = Math.ceil(timeDifference / (1000 * 3600 * 24));

        if (fiveDay >= 5 && startPhase >= current) {
            const s = {
                subCode: "N/A",
                subName: "N/A",
                startTime: item.startTime,
                endTime: item.endTime,
                day: item.day,
                roomCode: "N/A",
                roomLocation: item.roomLocation,
                phase: item.phase,
                register: true,
            }
            returnList.push(s);
        } else if (examphase.status == 0 || fiveDay < 5) {
            const s = {
                subCode: item.subCode,
                subName: item.subName,
                startTime: item.startTime,
                endTime: item.endTime,
                day: item.day,
                roomCode: item.roomCode,
                roomLocation: item.roomLocation,
                phase: item.phase,
                register: false,
            }
            returnList.push(s);
        }
    }
    return returnList;
}

//lấy hết lịch đã dk của 1 thg nhưng k theo bất kì gì hết
export async function getAllScheduledOneExaminer(id) {
    let message = "";
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
                        include: [
                            {
                                model: Subject,
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
                attributes: ['roomNum', 'location'], // Chọn các trường bạn muốn lấy từ bảng Room
            },
        ],
    })

    let listSchedule = [];
    let finalList = [];
    if (result.length === 0) {
        // res.json(MessageResponse("Your schedule is empty !"))
        return message = "Your schedule is empty !";
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
    let returnList = [];
    for (const item of finalList) {
        if (item.phase == "passed" || item.phase == "ongoing") {
            const s = {
                subCode: item.subCode,
                subName: item.subName,
                startTime: `${item.day} ${item.startTime}`,
                endTime: `${item.day} ${item.endTime}`,
                roomCode: item.roomCode,
                roomLocation: item.roomLocation,
                phase: item.phase
            }
            returnList.push(s)
        } else if (item.phase == "future") {
            const s = {
                startTime: `${item.day} ${item.startTime}`,
                endTime: `${item.day} ${item.endTime}`,
                phase: item.phase,
                roomLocation: item.roomLocation,
            }
            returnList.push(s)
        }
    }
    return returnList;
}


