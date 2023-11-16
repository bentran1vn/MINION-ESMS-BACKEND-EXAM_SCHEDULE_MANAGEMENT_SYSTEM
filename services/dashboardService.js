import ExamPhase from "../models/ExamPhase.js";
import ExamSlot from "../models/ExamSlot.js";
import Examiner from "../models/Examiner.js";
import ExaminerLogTime from "../models/ExaminerLogTime.js";
import { Op } from "sequelize";
import SubInSlot from "../models/SubInSlot.js";
import ExamRoom from "../models/ExamRoom.js";
import { getNotSheduleOfCourse } from "./studentExamService.js";
import Semester from "../models/Semester.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Subject from "../models/Subject.js";
import TimeSlot from "../models/TimeSlot.js";
import Room from "../models/Room.js"

export async function countExaminerInPhase(exPhaseId) {
    const statusMap = new Map([
        [0, 'lecturer'],
        [1, 'staff'],
        [2, 'volunteer']
    ]);
    let examinerLists = [];
    const exPhase = await ExamPhase.findOne({
        where: {
            id: exPhaseId,
            alive: 1
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
            throw new Error("No examiner in this phase");
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
        return examinerLists.length;
    } else {
        throw new Error("ExamPhase not found");
    }
}

export async function countTotalSlot(exPhaseId) {
    const phase = await ExamPhase.findOne({
        where: {
            id: exPhaseId,
            alive: 1
        }
    });
    if (!phase) {
        throw new Error("Can not find this phase to Count Total Slot");
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
        throw new Error("No slot in this phase");
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
    return totalSlot;
}

export async function countStaff() {
    let staffs = await User.findAll({
        where: {
            role: { [Op.like]: 'staff' }
        }
    })
    if (!staffs) throw new Error("Can not find staffs")
    return staffs.length
}

export async function topThreeExaminerDashBoard(exPhaseId) {
    const phase = await ExamPhase.findOne({
        where: {
            id: exPhaseId,
            alive: 1
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
        throw new Error("This phase doesn't have any slots")
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
    const top3UniqueValues = uniqueValues.slice(0, 3);

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
    if (returnL.length === 0) {
        throw new Error("Can not find top 3 Examiner");
    } else {
        returnL.sort((a, b) => b.quantity - a.quantity);
        return returnL
    }

}

export async function numberByCourse(ePId) {
    let listCourse = [];
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
            id: ePId,
            alive: 1
        }
    })
    if (!examPhase) {
        throw new Error("Can not find examPhase");
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
        throw new Error("Can not find any course");
    } else {
        return listCourse;
    }
}

export async function numOfCourseNotScheduled(ePId) {
    const numOfCourse = await getNotSheduleOfCourse(ePId)
    const courseInEp = await Course.findAll({
        where: {
            ePId: ePId
        }
    })
    if (courseInEp.length === 0 || courseInEp == null) throw new Error("Can not find any course")
    const s = {
        assigned: numOfCourse.length,
        total: courseInEp.length
    }
    return s
}

export async function numOfDayRegister(ePId) {
    const numRegister = []
    function insertnumRegister(day, num) {
        const detail = {
            day: day, num: num
        }
        numRegister.push(detail)
    }

    const examPhase = await ExamPhase.findOne({
        where: {
            id: ePId,
            alive: 1
        }
    })
    if (!examPhase) {
        throw new Error('Error in find examPhase');
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
    }
    return numRegister
}

export async function totalRegistionOfLec(userId) {
    let count = 0;
    const examiner = await Examiner.findAll({
        where: {
            userId: userId
        }
    })
    if (!examiner) throw new Error("Can not find examiner")
    for (const exId of examiner) {
        const examRoom = await ExamRoom.findAll({
            where: {
                examinerId: exId.dataValues.id
            }
        })
        count += examRoom.length;
    }
    return count;
}

export async function totalRegistionOfLecOnePhase(userId, phaseId) {
    let count = 0;
    const phase = await ExamPhase.findOne({
        where: {
            id: phaseId,
            alive: 1
        }
    })
    if (!phase) throw new Error("Can not find phase")
    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: phase.startDay },
            end: { [Op.gte]: phase.endDay }
        }
    })
    if (!semester) throw new Error("Can not find semester")
    const examiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semester.id
        }
    })
    if (!examiner) throw new Error("Can not find examiner")
    const exslot = await ExamSlot.findAll({
        where: {
            ePId: phaseId
        }
    })
    if (!exslot) throw new Error("Can not find exam slot")
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
    return count;
}

export async function futureSlotOfLecOnePhase(userId, phaseId) {
    let count = 0;
    const phase = await ExamPhase.findOne({
        where: {
            id: phaseId,
            alive: 1
        }
    })
    if (!phase) throw new Error("Can not find phase")
    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: phase.startDay },
            end: { [Op.gte]: phase.endDay }
        }
    })
    if (!semester) throw new Error("Can not find semester")
    const examiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semester.id
        }
    })
    if (!examiner) throw new Error("Can not find examiner")
    const exslot = await ExamSlot.findAll({
        where: {
            ePId: phaseId
        }
    })
    if (!exslot) throw new Error("Can not find exam slot")
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
    return count;
}

export async function detailFutureSlotOfLecOnePhase(userId, phaseId) {
    const detailExamSlot = []
    function insertDetailExamSlot(day, room, location, sTime, eTime) {
        const detail = {
            day, room, location, sTime, eTime
        }
        detailExamSlot.push(detail)
    }

    const phase = await ExamPhase.findOne({
        where: {
            id: phaseId,
            alive: 1
        }
    })
    if (!phase) throw new Error("Can not find phase")
    const semester = await Semester.findOne({
        where: {
            start: { [Op.lte]: phase.startDay },
            end: { [Op.gte]: phase.endDay }
        }
    })
    if (!semester) throw new Error("Can not find semester")
    const examiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semester.id
        }
    })
    if (!examiner) throw new Error("Can not find examiner")
    const exslot = await ExamSlot.findAll({
        where: {
            ePId: phaseId
        }
    })
    if (!exslot) throw new Error("Can not find exam slot")
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)

    for (const exSl of exslot) {
        if (exSl.dataValues.day > timeFormatted) {
            const timeSLot = await TimeSlot.findOne({
                where: {
                    id: exSl.dataValues.timeSlotId
                }
            })
            const subSlot = await SubInSlot.findAll({
                where: {
                    exSlId: exSl.dataValues.id
                }
            })
            for (const sb of subSlot) {
                const examRoom = await ExamRoom.findAll({
                    where: {
                        sSId: sb.dataValues.id,
                        examinerId: examiner.id
                    }
                })
                for (const item of examRoom) {
                    const room = await Room.findOne({
                        where: {
                            id: item.roomId
                        }
                    })
                    insertDetailExamSlot(exSl.day, room.roomNum, room.location, timeSLot.startTime, timeSLot.endTime)
                }
            }
        }
    }
    return detailExamSlot;
}

export async function totalRegistionEachPhase(userId, semesterId) {
    const examiner = await Examiner.findAll({
        where: {
            userId: userId
        }
    })
    if (!examiner) throw new Error("Can not find examiner")
    const semester = await Semester.findOne({
        where: {
            id: semesterId
        }
    })
    if (!semester) throw new Error("Can not find semester")
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
    if (room.length === 0) throw new Error("Can not find any room")
    //mảng room đã chứa tất cả slot đã đk từ trước tới giờ
    const examphase = await ExamPhase.findAll({
        where: {
            alive: 1
        }
    });
    if (examphase.length === 0) throw new Error("Can not find any exam phase")
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
    if (sloteachphase.length === 0) throw new Error("Can not find any slot")
    return sloteachphase;
}

export async function totalExamSLotByPhase(ePId) {
    const examPhase = await ExamPhase.findOne({
        where: {
            id: ePId,
            alive: 1
        }
    })
    if (examPhase) {
        const examSlot = await ExamSlot.findAll({
            where: {
                ePId
            }
        })
        return examSlot.length;
    } else {
        throw new Error("ExamPhase not found");
    }
}

export async function totalExaminerByPhase(ePId) {
    const examPhase = await ExamPhase.findOne({
        where: {
            id: ePId,
            alive: 1
        }
    })
    if (!examPhase) throw new Error("Can not find exam phase")
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
    if (!exminerLogTime) throw new Error("Can not find examiner log time")
    let arr = []
    for (const item of exminerLogTime) {
        if (!arr.includes(item.examinerId)) {
            arr.push(item.examinerId)
        }
    }
    return arr.length;
}

export async function totalCourseByPhase(ePId) {
    const course = await Course.findAll({
        where: {
            ePId
        }
    })
    if (!course) throw new Error("Can not find course")
    return course.length;
}

export async function totalExamroomByPhase(ePId) {
    const arr = []
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
    if (!examSlots) throw new Error("Can not find exam slot")
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
    if (arr.length == 0) throw new Error("Can not find any exam room")
    return arr
}

export async function percentRegis(ePId) {
    let countAll = 0;
    let countNotNull = 0;
    const examslot = await ExamSlot.findAll({
        where: {
            ePId: ePId
        }
    })
    if (examslot.length == 0) {
        throw new Error("Phase have no exam slot");
    } else {
        // console.log("hello");
        for (const e of examslot) {
            const subslot = await SubInSlot.findAll({
                where: {
                    exSlId: e.dataValues.id
                }
            })

            for (const sub of subslot) {
                const examroom = await ExamRoom.findAll({
                    where: {
                        sSId: sub.dataValues.id
                    }
                })
                countAll += examroom.length;
                for (const eRoom of examroom) {
                    if (eRoom.dataValues.examinerId != null) {
                        countNotNull++;
                    }
                }
            }
        }
    }

    let roundedRatio = (countNotNull / countAll * 100).toFixed(2);
    return `${roundedRatio}%`;
}