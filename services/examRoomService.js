import Room from '../models/Room.js'
import Examiner from '../models/Examiner.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import ExaminerLogTime from '../models/ExaminerLogTime.js'
import RoomLogTime from '../models/RoomLogTime.js'
import StaffLogChange from '../models/StaffLogChange.js'
import Semester from '../models/Semester.js'
import User from '../models/User.js'
import { Op } from 'sequelize'
import ExamPhase from '../models/ExamPhase.js'


export async function autoFillLecturerToExamRoom(staffId) {
    let message = "";
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
        // res.json(MessageResponse("Table semester hasn't have data for this semester"))
        return message = "Table semester hasn't have data for this semester";
    }

    const lecturer = await User.findAll({
        where: {
            role: 'lecturer'
        }
    })

    lecturer.forEach(async (item) => {
        const check = await Examiner.findOne({
            where: {
                userId: item.dataValues.id,
                semesterId: parseInt(semester.id)
            }
        })
        if (!check) {
            const lecToExaminer = await Examiner.create({
                userId: item.dataValues.id,
                typeExaminer: 0,
                semesterId: parseInt(semester.id),
                status: 0
            })
            if (!lecToExaminer) {
                // res.json(MessageResponse(`Error when add lecturer ${item.dataValues.id} to examiner`));
                return message = `Error when add lecturer ${item.dataValues.id} to examiner`;
            } else {
                const stafflog = await StaffLogChange.create({
                    rowId: parseInt(lecToExaminer.id),
                    tableName: 5,
                    userId: staffId,
                    typeChange: 10
                })
                if (!stafflog) {
                    // res.json("Fail to update staff log change");
                    return message = "Fail to update staff log change";
                }
            }
        } else if (check && check.status == 1) {
            const row = await Examiner.update({ status: 0 }, {
                where: {
                    userId: item.dataValues.id,
                    semesterId: parseInt(semester.id)
                }
            })
            if (row[0] == 0) {
                // res.json(MessageResponse(`Fail to update status of examiner ${check.id}`));
                return message = `Fail to update status of examiner ${check.id}`;
            } else {
                const stafflog = await StaffLogChange.create({
                    rowId: parseInt(check.id),
                    tableName: 5,
                    userId: staffId,
                    typeChange: 10
                })
                if (!stafflog) {
                    // res.json("Fail to update staff log change");
                    return message = "Fail to update staff log change";
                }
            }
        }
    });

    const examiner = await Examiner.findAll({
        where: {
            semesterId: parseInt(semester.id),
            status: 0
        }
    });

    if (examiner.length == 0) {
        // res.json(MessageResponse("Current semester doesn't have any examiner"));
        return message = "Current semester doesn't have any examiner";
    }
    const examinerList = examiner.map(ex => ex.dataValues);
    const examinerIdList = examinerList.map(exL => exL.id);

    const roomNoExaminer = await ExamRoom.findAll({
        where: {
            examinerId: null
        }
    });
    if (roomNoExaminer.length == 0) {
        // res.json(MessageResponse("All rooms assigned"));
        return message = "All rooms assigned";
    }

    let roomToSchedule = [];
    const promises = roomNoExaminer.map(async (item) => {
        const subInSlot = await SubInSlot.findOne({
            where: {
                id: item.dataValues.sSId
            }
        });
        const examSlot = await ExamSlot.findOne({
            where: {
                id: subInSlot.exSlId
            }
        });

        if (examSlot.day > timeFormatted) {
            const i = {
                id: item.dataValues.id,
                sSId: item.dataValues.sSId,
                roomId: item.dataValues.roomId,
                examinerId: item.dataValues.examinerId
            };
            roomToSchedule.push(i);
        }
    });

    // Sử dụng Promise.all() để đợi tất cả các promise hoàn thành
    await Promise.all(promises);
    if (roomToSchedule.length == 0) {
        // res.json(MessageResponse("Register time ended!"));
        return message = "Register time ended!";
    }

    for (const item of roomToSchedule) {
        const id = item.id;
        const sSId = item.sSId;

        const subjectInSlot = await SubInSlot.findOne({
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
        let i = 0;
        for (i; i < examinerIdList.length; i++) {
            const randomLecId = examinerIdList[i];
            const checkLecLogTime = await ExaminerLogTime.findOne({
                where: {
                    examinerId: randomLecId,
                    timeSlotId: timeSlot.id,
                    day: examSlot.day,
                    semId: parseInt(semester.id),
                }
            })
            if (!checkLecLogTime) {
                const examRoom = await ExamRoom.update({
                    examinerId: randomLecId
                }, {
                    where: {
                        id: id
                    }
                })
                if (examRoom) {

                    const updateLecLogTime = await ExaminerLogTime.create({
                        examinerId: randomLecId,
                        timeSlotId: timeSlot.id,
                        day: examSlot.day,
                        semId: parseInt(semester.id)
                    })
                    break;
                }
            }
        }
    }
    const examRoomAtferfill = await ExamRoom.findAll({
        where: {
            examinerId: null
        }
    })
    if (examRoomAtferfill.length != 0) {
        const staffLog = await StaffLogChange.create({
            tableName: 0,
            userId: staffId,
            typeChange: 1,
        })
        // res.json(MessageResponse("Number of examiner not enough to fill up exam room"));
        return message = "Number of examiner not enough to fill up exam room";
    } else {
        const staffLog = await StaffLogChange.create({
            tableName: 0,
            userId: staffId,
            typeChange: 1,
        })
        // res.json(MessageResponse("All rooms assigned"));
        return message = "All rooms assigned";
    }
}