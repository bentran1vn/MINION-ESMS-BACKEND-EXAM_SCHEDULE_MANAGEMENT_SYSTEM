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
import StaffLogChange from "../models/StaffLogChange.js";

export async function createVolunteerExaminer(exName, exEmail, semesterId, staffId) {
    const checkExist = await Examiner.findOne({
        where: {
            exName: exName,
            exEmail: exEmail,
            semesterId: semesterId,
            typeExaminer: 2
        }
    })
    if (!checkExist) {
        const examiner = await Examiner.create({
            exName: exName,
            exEmail: exEmail,
            semesterId: semesterId,
            status: 0,
            typeExaminer: 2
        })
        if (examiner) {
            await StaffLogChange.create({
                rowId: examiner.id,
                tableName: 5,
                userId: staffId,
                typeChange: 8
            })
            return true
        } else {
            throw new Error('Error in create examiner volunteer')
        }
    } else if (checkExist && checkExist.status == 1) {
        await Examiner.update(
            {
                status: 0
            }, {
            where: {
                id: checkExist.id
            }
        })
        await StaffLogChange.create({
            rowId: checkExist.id,
            tableName: 5,
            userId: staffId,
            typeChange: 9
        })
    }

}//tạo examiner role ctv

export async function getAllExaminerCTVBySemId(semesterId) {
    const examiner = await Examiner.findAll({
        where: {
            semesterId: semesterId,
            typeExaminer: 2
        }
    })
    if (examiner) {
        return examiner
    } else {
        throw new Error('Error in get examiner volunteer')
    }
}//get ra examiner role ctv theo semester

export async function allScheduledOfExaminer(userId) {
    const examiner = await Examiner.findAll({
        where: {
            userId: userId,
        }
    })
    let ex = examiner.map(i => i.dataValues)
    let exId = ex.map(exI => exI.id);
    const finalList = await getAllScheduledOneExaminer(exId);
    if (Array.isArray(finalList)) {
        return finalList;
    } else if (!Array.isArray(finalList)) {
        throw new Error('Not found in allScheduledOfExaminer!')
    }
}//lấy tất cả lịch đã đăng kí của 1 examiner

export async function deleteExaminer(id) {
    const row = await Examiner.update({
        status: 1
    }, {
        where: {
            id: id
        }
    })
    if (row[0] != 0) {
        return true;
    }
}//xóa examiner

export async function scheduledByPhase(id, examphaseId) {
    const exPhase = await ExamPhase.findOne({
        where: {
            id: examphaseId,
            alive: 1
        }
    })
    if (!exPhase) {
        throw new Error('Not found examPhase!')
    }
    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: exPhase.startDay },
            end: { [Op.gte]: exPhase.endDay }
        }
    })

    const examiner = await Examiner.findOne({
        where: {
            userId: id,
            semesterId: semester.id
        }
    })
    const examinerId = examiner.id
    const finalList = await getScheduledOneExaminerByPhaseVer2(examinerId, examphaseId);

    if (Array.isArray(finalList)) {
        return finalList;
    } else if (!Array.isArray(finalList)) {
        throw new Error('Not found in scheduledByPhase !')
    }
}//lấy lịch đã đăng kí của 1 examiner theo phase

export async function getScheduleByPhase(userId, examPhaseId) {
    let message = "";
    //day - startTime - endTime - Room
    let scheduleWithPhase = [];

    const exPhase = await ExamPhase.findOne({
        where: {
            id: examPhaseId,
            alive: 1
        }
    })
    if (!exPhase) {
        return message = "Not Found";
    }

    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: exPhase.startDay },
            end: { [Op.gte]: exPhase.endDay }
        }
    })
    if (!semester) {
        return message = "Error";
    }
    const exMiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semester.id
        }
    })

    if (!exMiner) {
        return message = "Error";
    }
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
}//lấy lịch để đăng kí theo phase

export async function getExaminerByPhase(exPhaseId) {
    const statusMap = new Map([
        [0, 'lecturer'],
        [1, 'staff'],
        [2, 'volunteer']
    ]);

    const exPhase = await ExamPhase.findOne({//tìm phase hiện tại
        where: {
            id: exPhaseId,
            alive: 1
        }
    })
    if (exPhase) {
        const examiners = await ExaminerLogTime.findAll({//examinerId của 1 user trong 1 phase là riêng biệt, k thể 1 ng có 1 examinerId 1 phase
            where: { //lấy ra tất cả examiner có logtime trong phase này (đã từng đk, hủy dk trong phase)
                day: {
                    [Op.gte]: exPhase.startDay,
                    [Op.lte]: exPhase.endDay,
                },
                status: 0// = 0 tức là nó đk và k hủy lịch thì mới tính
            }
        });
        if (examiners.length == 0) {
            throw new Error('This phase has no examiners')
        }

        const uniqueExaminers = examiners.reduce((acc, current) => {//lấy examinerId trong logtime lọc lại unique
            const x = acc.find(item => item.examinerId === current.examinerId);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        let examinerLists = [];
        for (const item of uniqueExaminers) {
            const examiner = await Examiner.findOne({
                where: {
                    id: item.examinerId,
                    semesterId: item.semId
                }
            });

            const ex = {
                id: item.examinerId,
                exEmail: examiner.exEmail,
                exName: examiner.exName,
                role: statusMap.get(examiner.typeExaminer),
                status: examiner.status
            };
            examinerLists.push(ex);
        }

        if (examinerLists.length == 0) {
            throw new Error('Not found examiner !')
        }
        else {
            return examinerLists;
        }
    } else {
        throw new Error('Not found phase')
    }
}//lấy danh sách examiner by phase của màn hình admin

export async function getScheduledOneExaminerByPhaseVer2(examinerId, examphaseId) {
    let sheduledList = [];
    let message = "";
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)
    // var timeFormatted = "2023-11-15"
    const curPhase = await ExamPhase.findOne({
        where: {
            startDay: {
                [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            endDay: {
                [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
            alive: 1
        }
    })

    const examphase = await ExamPhase.findOne(
        {
            where:
            {
                id: examphaseId,
                alive: 1
            }
        }
    );
    if (!examphase) {
        throw new Error('Error in examPhase')
    }

    const exslot = await ExamSlot.findAll({
        where: {
            [Op.and]: [
                { day: { [Op.gte]: examphase.startDay } },
                { day: { [Op.lte]: examphase.endDay } }
            ]
        }
    });

    if (exslot.length == 0) {
        throw new Error('Not found')
    }

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
    if (sheduledList.length == 0) {
        throw new Error(`Your schedule in phase ${examphase.ePName} is empty`)
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
        } else if (!curPhase && (timeFormatted < sche.day)) {
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
        } else if ((!curPhase && (timeFormatted > sche.day)) || (curPhase && (curPhase.endDay < timeFormatted))) {
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
}//function của lấy hết lịch đã đk của 1 thg theo phase

export async function getAllScheduledOneExaminer(examinerId) {
    let sheduledList = [];
    let message = "";
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)
    // var timeFormatted = "2023-11-15"
    const curPhase = await ExamPhase.findOne({
        where: {
            startDay: {
                [Op.lt]: timeFormatted, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            endDay: {
                [Op.gt]: timeFormatted, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
            alive: 1
        }
    })

    const examinerScheduled = await ExamRoom.findAll({
        where: {
            examinerId: {
                [Op.or]: examinerId
            }
        }
    });
    if (examinerScheduled.length == 0) {
        return message = "Not Found";
    }
    for (const ex of examinerScheduled) {
        const subSlot = await SubInSlot.findOne({
            where: {
                id: ex.dataValues.sSId
            }
        })
        const cour = await Course.findOne({
            where: {
                id: subSlot.courId
            }
        })
        const subject = await Subject.findOne({
            where: {
                id: cour.subId
            }
        })
        const exSlot = await ExamSlot.findOne({
            where: {
                id: subSlot.exSlId
            }
        })
        const time = await TimeSlot.findOne({
            where: {
                id: exSlot.timeSlotId
            }
        })
        const room = await Room.findOne({
            where: {
                id: ex.dataValues.roomId
            }
        })
        const sche = {
            subCode: subject.code,
            subName: subject.name,
            startTime: time.startTime,
            endTime: time.endTime,
            day: exSlot.dataValues.day,
            roomCode: room.roomNum,
            roomLocation: room.location
        };
        sheduledList.push(sche);
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
        } else if (!curPhase && (timeFormatted < sche.day)) {
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
        } else if ((!curPhase && (timeFormatted > sche.day)) || (curPhase || (timeFormatted > curPhase.endDay))) {
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
        if (item.phase == "passed" || item.phase == "ongoing") {
            const s = {
                subCode: item.subCode,
                subName: item.subName,
                startTime: `${item.day} ${item.startTime}`,
                endTime: `${item.day} ${item.endTime}`,
                roomCode: item.roomCode,
                roomLocation: item.roomLocation,
                phase: item.phase,

            }
            returnList.push(s);
        } else if (item.phase == "future") {
            const s = {
                subCode: "N/A",
                subName: "N/A",
                startTime: `${item.day} ${item.startTime}`,
                endTime: `${item.day} ${item.endTime}`,
                roomCode: "N/A",
                roomLocation: item.roomLocation,
                phase: item.phase,
            }
            returnList.push(s);
        }
    }
    return returnList;

}
