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
import StudentExam from '../models/StudentExam.js'
import { Op } from 'sequelize'
import ExamPhase from '../models/ExamPhase.js'
import { expandTimePhase } from '../services/examPhaseService.js'
import { findAll } from '../services/roomService.js'
import { changeCourseStatus } from '../services/courseService.js'

export async function autoCreateExamRoom(incomingPhase) {
    let roomList
    await findAll().then(value => roomList = value)
    if (roomList === null) {
        throw new Error("Can not create exam rooms! Room problem!")
    }

    let examPhase = await ExamPhase.findOne({
        where: {
            id: incomingPhase,
            status: true,
            alive: 1
        }
    })
    if (examPhase === null || examPhase.length == 0) {
        throw new Error("Can not create exam rooms! Examphase problem!")
    }
    let slotList = await TimeSlot.findAll(
        {
            where: {
                semId: {
                    [Op.eq]: examPhase.dataValues.semId
                },
                des: {
                    [Op.eq]: examPhase.dataValues.des
                },
            },
        },
    )
    //Lấy ra đúng loại Slot Time
    if (slotList === null || slotList.length == 0) {
        throw new Error("Can not create exam rooms! Examphase problem!")
    }

    let course = await Course.findAll(
        {
            where: {
                ePId: {
                    [Op.eq]: examPhase.id
                },
                status: {
                    [Op.eq]: 1
                }
            },
        },
        {
            order: [
                ['numOfStu', 'ASC']
            ]
        }
    )
    if (course === null || course.length == 0) {
        throw new Error("Can not create exam rooms! Course Problem!")
    }
    //Lấy ra danh sách các Course trong Examphase tương ứng
    const startDay = new Date(examPhase.startDay)
    const dayLength = expandTimePhase(examPhase)
    //Lấy ra khoảng thời gian giữa 2 ngày start và end của 1 examPhase

    let dayList = []

    for (let i = 0; i <= dayLength; i++) {
        let day = new Date(startDay);
        if (i !== 0) {
            day.setDate(startDay.getDate() + i);
        }
        dayList.push(day)
    }//Add day vào danh sách dayList của 1 examPhase

    let roomSlot = 0
    let dayCount = 0
    let slotCount = 0
    let roomCount = 0

    let examSlot = await ExamSlot.create({
        ePId: examPhase.id,
        day: dayList[0],
        timeSlotId: slotList[0].id
    })//Khởi tạo ExamSlot mặc định

    for (let i = 0; i < course.length; i++) { //Duyệt danh sách Môn Thi

        let daySlot = dayList[dayCount]
        let slot = slotList[slotCount].id

        if (roomSlot > process.env.NUMBER_OF_FLOOR * process.env.NUMBER_OF_ROOM_IN_FLOOR) {
            roomSlot = 0
            roomCount = 0
            slotCount++;
            if (slotCount <= slotList.length - 1) {
                slot = slotList[slotCount].id
                examSlot = await ExamSlot.create({
                    ePId: examPhase.id,
                    day: daySlot,
                    timeSlotId: slot,
                })
            }// Cộng thêm 1 Slot mỗi khi không đủ phòng thi


            if (slotCount > slotList.length - 1) {
                slotCount = 0
                dayCount++;
                if (slotCount <= slotList.length - 1) {
                    slot = slotList[slotCount].id
                    daySlot = dayList[dayCount]
                    examSlot = await ExamSlot.create({
                        ePId: examPhase.id,
                        day: daySlot,
                        timeSlotId: slot,
                    })

                }
            }// Cộng thêm 1 Day mỗi khi không đủ phòng thi
        }

        const val = course[i];

        let NumRoomOfCourse = Math.ceil(val.numOfStu / process.env.NUMBER_OF_STUDENT_IN_ROOM);

        roomSlot += NumRoomOfCourse

        if (roomSlot <= process.env.NUMBER_OF_FLOOR * process.env.NUMBER_OF_ROOM_IN_FLOOR) {

            //Tạo mới 1 SubjectInSlot
            let subjectInSlot = await SubInSlot.create({
                courId: val.id,
                exSlId: examSlot.id
            })

            for (let i = 0; i < NumRoomOfCourse; i++) {
                let room
                room = roomList[roomCount]

                await ExamRoom.create({
                    sSId: subjectInSlot.id,
                    roomId: room.id,
                    des: examPhase.des
                })
                await RoomLogTime.create({
                    roomId: room.id,
                    day: daySlot,
                    timeSlotId: slot,
                    semId: examPhase.semId
                })
                roomCount++
            }
        } else {
            i--
        }
    }
}

export async function autoFillLecturerToExamRoom(staffId, incomingPhase) {
    let message = "";

    const exPhase = await ExamPhase.findOne({
        where: {
            id: incomingPhase,
            alive: 1
        }
    })
    if (exPhase.status == 0) {
        return message = "Register time closed";
    }

    const getSemester = await Semester.findOne({
        where: {
            start: { [Op.lte]: exPhase.startDay },
            end: { [Op.gte]: exPhase.endDay }
        }
    })
    if (!getSemester) {
        return message = `This phase ${exPhase.ePName} not belong to any semester`;
    }

    const lecturer = await User.findAll({
        where: {
            role: 'lecturer'
        }
    })
    //xử lí tạo examiner role lecturer
    for (const item of lecturer) {
        const check = await Examiner.findOne({
            where: {
                userId: item.dataValues.id,
                semesterId: parseInt(getSemester.id)
            }
        })
        if (!check) {
            const lecToExaminer = await Examiner.create({
                userId: item.dataValues.id,
                typeExaminer: 0,
                semesterId: parseInt(getSemester.id),
                exName: item.dataValues.name,
                exEmail: item.dataValues.email,
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
                    semesterId: parseInt(getSemester.id)
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
    };
    //lấy tất examiner role lect semester này
    const examiner = await Examiner.findAll({
        where: {
            semesterId: parseInt(getSemester.id),
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

        if (examSlot.day >= exPhase.startDay && examSlot.day <= exPhase.endDay) {
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
        return message = `All schedule in ${exPhase.ePName} are assigned`;
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
                id: examSlot.timeSlotId,
                semId: parseInt(getSemester.id)
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
                    semId: parseInt(getSemester.id),
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
                        semId: parseInt(getSemester.id)
                    })
                    break;
                }
            }
        }
    }
    let count = 0;
    for (const room of roomToSchedule) {
        if (room.examinerId == null) {
            count++;
        }
    }
    if (count != 0) {
        const staffLog = await StaffLogChange.create({
            tableName: 0,
            userId: staffId,
            typeChange: 1,
        })
        // res.json(MessageResponse("Number of examiner not enough to fill up exam room"));
        return message = `Lecturer examiner not enough, need ${count} examiners to fill up`;
    } else if (count == 0) {
        const staffLog = await StaffLogChange.create({
            tableName: 0,
            userId: staffId,
            typeChange: 1,
        })
        // res.json(MessageResponse("All rooms assigned"));
        return message = "All rooms assigned";
    }
}

export async function lecRegister(lecturerId, startTime, endTime, day, incomingPhase) {
    let message = "";
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)


    const exPhase = await ExamPhase.findOne({
        where: {
            id: incomingPhase,
            alive: 1
        }
    })
    const startPhase = new Date(exPhase.startDay);
    const cur = new Date(timeFormatted);
    const timeDifference = Math.abs(startPhase.getTime() - cur.getTime());
    const fiveDay = Math.ceil(timeDifference / (1000 * 3600 * 24));
    if ((startPhase > cur && fiveDay <= 5) || exPhase.status == 0) {
        // res.json(MessageResponse("Register time closed"));
        return message = "Register time closed";
    }

    const getSemester = await Semester.findOne({
        where: {
            start: { [Op.lte]: exPhase.startDay },
            end: { [Op.gte]: exPhase.endDay }
        }
    })
    if (!getSemester) {
        return message = "Error";
    }

    const user = await User.findOne({
        where: {
            id: lecturerId
        }
    })
    const examiner = await Examiner.findOne({
        where: {
            userId: parseInt(lecturerId),
            semesterId: parseInt(getSemester.id)
        }
    })


    if (examiner && examiner.dataValues.status == 1) {
        const row = await Examiner.update({ status: 0 }, {
            where: {
                userId: lecturerId,
                semesterId: parseInt(getSemester.id)
            }
        })
    }
    if (!examiner) {
        await Examiner.create({
            userId: parseInt(lecturerId),
            typeExaminer: 0,
            semesterId: parseInt(getSemester.id),
            exName: user.name,
            exEmail: user.email,
            status: 0
        })
    }
    const lecToExaminer = await Examiner.findOne({
        where: {
            userId: lecturerId,
            semesterId: parseInt(getSemester.id)
        }
    })

    const timeSlot = await TimeSlot.findOne({
        where: { startTime: startTime, endTime: endTime, semId: getSemester.id }
    })

    const examSlot = await ExamSlot.findOne({
        where: { day: day, timeSlotId: timeSlot.id },
    });

    let subjectInSlot = await SubInSlot.findAll({
        where: { exSlId: examSlot.id },
    });

    let subInSlot2 = [];
    for (const item of subjectInSlot) {
        subInSlot2.push(item);
    }

    if (subInSlot2.length == 0) {
        // res.json(MessageResponse(`Incoming exam phase doesn't have any exam room for this ${startTime} - ${endTime}`));
        return message = `Incoming exam phase doesn't have any exam room for this ${startTime} - ${endTime}`;
    }

    const subInSlotArray = subInSlot2.map(subInSlot => subInSlot.dataValues);
    const idArray = subInSlotArray.map(item => item.id);
    if (idArray.length != 0) {
        const roomsToUpdate = await ExamRoom.findAll({
            where: {
                examinerId: null,
                sSId: {
                    [Op.or]: idArray
                },
            },
        });
        const row = await ExamRoom.findOne({
            where: {
                sSId: {
                    [Op.or]: idArray
                },
                examinerId: lecToExaminer.id,
            }
        })
        if (row) {
            //res.json(MessageResponse(`Examiner ${lecToExaminer.id} is already has room and can't take more`))
            return message = `Examiner ${lecToExaminer.id} is already has room and can't take more`;
        } else {
            const randomIndex = Math.floor(Math.random() * roomsToUpdate.length);
            let i = 0;
            let check = 0;
            for (i; i < roomsToUpdate.length; i++) {
                if (i == randomIndex) {
                    roomsToUpdate[i].update({ examinerId: lecToExaminer.id })
                    check++;
                    // const subSlot = await SubInSlot.findOne({
                    //     where: {
                    //         id: roomsToUpdate[i].dataValues.sSId
                    //     }
                    // })
                    // const course = await Course.findOne({
                    //     where: {
                    //         id: subSlot.courId
                    //     }
                    // })
                    // changeCourseStatus(incomingPhase, course.id)
                }
            }
            if (check != 0) {
                const lecLog = await ExaminerLogTime.create({
                    examinerId: lecToExaminer.id,
                    day: day,
                    timeSlotId: timeSlot.id,
                    semId: parseInt(getSemester.id)
                })
                if (!lecLog) {
                    // res.json(MessageResponse("Error when input examiner to examiner log time."))
                    return message = "Error when input examiner to examiner log time.";
                } else {
                    // res.json(MessageResponse('Examiner added'));
                    return message = 'Examiner added';
                }
            } else {
                // res.json(MessageResponse('All rooms full'));
                return message = 'All rooms full';
            }
        }
    } else {
        // res.json(MessageResponse("This slot hasn't have any subject"));
        return message = "This slot hasn't have any subject";
    }
}

export async function lecUnRegister(lecturerId, startTime, endTime, day, incomingPhase) {
    let message = "";
    const examPhase = await ExamPhase.findOne({
        where: {
            id: incomingPhase,
            alive: 1
        }
    })
    if (examPhase.status == 0) {
        return message = "Can't change on-going or passed schedule";
    }

    const getSemester = await Semester.findOne({
        where: {
            start: { [Op.lte]: examPhase.startDay },
            end: { [Op.gte]: examPhase.endDay }
        }
    })
    if (!getSemester) {
        return message = `Exam phase ${examPhase.ePName} not belong to any semester`;
    }

    const examiner = await Examiner.findOne({
        where: {
            userId: parseInt(lecturerId),
            semesterId: parseInt(getSemester.id)
        }
    })

    const timeSlot = await TimeSlot.findOne({
        where: { startTime: startTime, endTime: endTime, semId: parseInt(getSemester.id) }
    })

    const examSlot = await ExamSlot.findOne({
        where: { day: day, timeSlotId: timeSlot.id },
    });

    let subjectInSlot = await SubInSlot.findAll({
        where: { exSlId: examSlot.id },
    });


    let subInSlot2 = [];
    for (const item of subjectInSlot) {
        subInSlot2.push(item);
    }

    if (subInSlot2.length == 0) {
        // res.json(MessageResponse(`Current semester doesn't have any exam room for this ${startTime} - ${endTime}`));
        return message = `Current examphase doesn't have any exam schedule for this ${startTime} - ${endTime}`;
    }

    const subInSlotArray = subInSlot2.map(subInSlot => subInSlot.dataValues);
    const idArray = subInSlotArray.map(item => item.id);

    if (idArray.length != 0) {
        const roomOccupiedByLecturer = await ExamRoom.findOne({
            where: {
                examinerId: parseInt(examiner.id),
                sSId: {
                    [Op.or]: idArray
                },
            },
        });
        if (roomOccupiedByLecturer) {
            const check = await ExamRoom.update({
                examinerId: null
            }, {
                where: {
                    id: roomOccupiedByLecturer.id
                }
            })
            if (check[0] != 0) {
                const lecLog = await ExaminerLogTime.update({
                    status: 1
                }, {
                    where: {
                        examinerId: parseInt(examiner.id),
                        timeSlotId: timeSlot.id,
                        day: day,
                        semId: parseInt(getSemester.id)
                    }
                })
                if (lecLog) {
                    // res.json(MessageResponse(`Examiner ${examiner.id} is removed from this slot, examiner log time updated`))
                    return message = `Examiner ${examiner.id} is removed from this slot, examiner log time updated`;
                } else {
                    // res.json(MessageResponse("Error when update examiner log time"))
                    return message = "Error when update examiner log time";
                }
            }
        } else {
            // res.json(MessageResponse(`Examiner ${examiner.id} hasn't assigned yet.`))
            return message = `Examiner ${examiner.id} hasn't assigned yet.`;
        }

    }
}

export async function addExaminerForStaff(staffId, id, examinerId) {
    let message = "";
    const examRoomChange = await ExamRoom.findOne({
        where: {
            id: id
        }
    })
    if (!examRoomChange) {
        return message = "Exam Room not found";
    }
    const subSl = await SubInSlot.findOne({
        where: {
            id: examRoomChange.sSId
        }
    })
    const exSl = await ExamSlot.findOne({
        where: {
            id: subSl.exSlId
        }
    })
    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lte]: exSl.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gt]: exSl.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    if (!semester) {
        // res.json(MessageResponse("Table semester hasn't have data for this semester"))
        return message = "Table semester hasn't have data for this semester";
    }

    const examiner = await Examiner.findOne({
        where: {
            id: examinerId
        }
    })

    const timeSlot = await TimeSlot.findOne({
        where: {
            id: parseInt(exSl.timeSlotId),
            semId: semester.id
        }
    })

    if (subSl && exSl && timeSlot) {
        const examRoom = await ExamRoom.update({
            examinerId: parseInt(examiner.id)
        }, {
            where: {
                id: parseInt(id)
            }
        })
        if (examRoom[0] === 0) {
            return message = 'Add Failed !';
        } else {
            const staffLog = await StaffLogChange.create({
                rowId: parseInt(id),
                userId: staffId,
                tableName: 0,
                typeChange: 0
            })

            const addToLecLogTime = await ExaminerLogTime.create({
                examinerId: parseInt(examiner.id),
                timeSlotId: timeSlot.id,
                day: exSl.day,
                semId: parseInt(semester.id)
            })

            if (addToLecLogTime) {
                // res.json(MessageResponse("Add Success to exam room and update examiner log time !"));
                return message = "Add Success to exam room and update examiner log time !";
            } else {
                // res.json(MessageResponse("Error when update examiner log time"));
                return message = "Error when update examiner log time";
            }
        }
    } else {
        // res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
        return message = `Data at exam room id ${id} maybe wrong`;
    }
}

export async function addRoomByStaff(staffId, id, roomId) {
    let message = "";
    const examRoomChange = await ExamRoom.findOne({
        where: {
            id: id
        }
    })
    if (!examRoomChange) {
        return message = "Exam Room not found";
    }
    const subSl = await SubInSlot.findOne({
        where: {
            id: examRoomChange.sSId
        }
    })
    const exSl = await ExamSlot.findOne({
        where: {
            id: subSl.exSlId
        }
    })
    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lte]: exSl.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gt]: exSl.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    if (!semester) {
        // res.json(MessageResponse("Table semester hasn't have data for this semester"))
        return message = "Table semester hasn't have data for this semester";
    }

    const examphase = await ExamPhase.findOne({
        where: {
            id: esSl.ePId,
            alive: 1
        }
    })
    if (examphase.status == 0) {
        // res.json(MessageResponse("Can't add room to passed semester"));
        return message = "Can't add room to passed semester";
    }

    const timeSlot = await TimeSlot.findOne({
        where: {
            id: parseInt(exSl.timeSlotId),
            semId: parseInt(semester.id)
        }
    })
    if (subSl && exSl && timeSlot) {
        const checkRoomLogTime = await RoomLogTime.findOne({
            where: {
                roomId: roomId,
                timeSlotId: timeSlot.id,
                day: exSl.day,
                semId: parseInt(semester.id)
            }
        })
        if (!checkRoomLogTime) {
            const examRoom = ExamRoom.update({
                roomId: roomId
            }, {
                where: {
                    id: id
                }
            })
            if (examRoom[0] === 0) {
                // res.json(MessageResponse('Add Failed !'));
                return message = 'Add Failed !';
            } else {
                const staffLog = await StaffLogChange.create({
                    rowId: id,
                    userId: staffId,
                    tableName: 0,
                    typeChange: 1
                })
                if (!staffLog) {
                    // throw new Error("Create staff log failed");
                    return message = "Create staff log failed";
                }
                const roomLogTime = await RoomLogTime.create({
                    roomId: roomId,
                    timeSlotId: timeSlot.id,
                    day: exSl.day,
                    semId: parseInt(semester.id),
                })
                if (roomLogTime) {
                    // res.json(MessageResponse("Add Success room to exam room and update room log time!"));
                    return message = "Add Success room to exam room and update room log time!";
                } else {
                    // res.json(MessageResponse("Error when update room log time"));
                    return message = "Error when update room log time";
                }
            }
        } else {
            // res.json(MessageResponse(`Room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${examSlot.day}`))
            return message = `Room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${exSl.day}`;
        }
    } else {
        // res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`));
        return message = `Data at exam room id ${id} maybe wrong`;
    }
}

export async function delRoomByStaff(staffId, id) {
    let message = "";
    const examRoomChange = await ExamRoom.findOne({
        where: {
            id: id
        }
    })
    if (!examRoomChange) {
        return message = "Exam Room not found";
    }
    const subSl = await SubInSlot.findOne({
        where: {
            id: examRoomChange.sSId
        }
    })
    const exSl = await ExamSlot.findOne({
        where: {
            id: subSl.exSlId
        }
    })
    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lte]: exSl.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gt]: exSl.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    if (!semester) {
        // res.json(MessageResponse("Table semester hasn't have data for this semester"))
        return message = "Table semester hasn't have data for this semester";
    }

    const examphase = await ExamPhase.findOne({
        where: {
            id: ePId,
            alive: 1
        }
    })
    if (examphase.status == 0) {
        // res.json(MessageResponse("Can't add room to passed semester"));
        return message = "Can't delete room to passed semester";
    }

    const timeSlot = await TimeSlot.findOne({
        where: {
            id: parseInt(exSl.timeSlotId),
            semId: parseInt(semester.id)
        }
    })
    if (subSl && exSl && timeSlot) {
        const examRoom = await ExamRoom.update({
            roomId: null
        }, {
            where: {
                id: id
            }
        })
        if (examRoom[0] != 0) {
            const staffLog = await StaffLogChange.create({
                rowId: id,
                userId: staffId,
                tableName: 0,
                typeChange: 1
            })
            if (!staffLog) {
                // throw new Error("Create staff log failed");
                return message = "Create staff log failed";
            }
            const delRoomLogTime = await RoomLogTime.destroy({
                where: {
                    roomId: examRoomChange.roomId,
                    timeSlotId: timeSlot.id,
                    day: exSl.day,
                    semId: parseInt(semester.id)
                }
            })
            if (delRoomLogTime != 0) {
                // res.json(MessageResponse(`Room ${checkExRoom.roomId} is deleted, room log time updated`))
                return message = `Room ${examRoomChange.roomId} is deleted, room log time updated`;
            } else {
                // res.json(MessageResponse("Error when update room log time"));
                return message = "Error when update room log time";
            }
        } else {
            // res.json(MessageResponse("Error when update exam room"));
            return "Error when update exam room";
        }
    } else {
        // res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
        return `Data at exam room id ${id} maybe wrong`;
    }
}

export async function getAllAvailableExaminerInSlot(staffId, examslotId) {
    let message = "";

    const examslot = await ExamSlot.findOne({
        where: {
            id: examslotId
        }
    })
    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lte]: examslot.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gte]: examslot.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    const timeSlot = await TimeSlot.findOne({
        where: {
            id: examslot.timeSlotId
        }
    })
    if (!timeSlot) {
        // res.json(MessageResponse("This start time and end time dont exist!"));
        return message = "This start time and end time dont exist!";
    }

    const statusMap = new Map([
        ['lecturer', 0],
        ['staff', 1],
        ['volunteer', 2]
    ]);
    const user = await User.findAll({
        where: {
            role: {
                [Op.or]: ['lecturer', 'staff']
            }
        }
    });

    let check = 0;
    for (const item of user) {
        const examiner = await Examiner.findOne({
            where: {
                userId: parseInt(item.dataValues.id),
                semesterId: parseInt(semester.id),
            }
        });

        if (!examiner) {
            const ex = await Examiner.create({
                userId: item.dataValues.id,
                typeExaminer: statusMap.get(item.dataValues.role),
                semesterId: parseInt(semester.id),
                exName: item.dataValues.name,
                exEmail: item.dataValues.email,
                status: 0
            });
            check++;
        } else if (examiner.status === 1) {
            await Examiner.update({ status: 0 }, {
                where: {
                    userId: parseInt(item.dataValues.id),
                    semesterId: parseInt(semester.id),
                }
            });
            check++;
        }
    }

    if (check != 0) {
        await StaffLogChange.create({
            tableName: 5,
            userId: staffId,
            typeChange: 11,
        })
    }

    const allExaminer = await Examiner.findAll({
        where: {
            semesterId: parseInt(semester.id),
        }
    });

    let freeLecList = [];
    for (const ex of allExaminer) {
        const availableLecturerInSlot = await ExaminerLogTime.findOne({
            where: {
                examinerId: ex.dataValues.id,
                timeSlotId: timeSlot.id,
                day: examslot.day,
                semId: parseInt(semester.id)
            }
        })
        if (!availableLecturerInSlot) {
            const lc = {
                examinerId: ex.dataValues.id,
                examinerName: ex.dataValues.exName,
            }
            freeLecList.push(lc);
        }
    }

    if (freeLecList.length == 0) {
        // res.json(MessageResponse(`All examiners are busy at ${startTime} - ${endTime} - ${day}`));
        return message = `All examiners are busy at ${timeSlot.startTime} - ${timeSlot.endTime} - ${examslot.day}`;
    } else {
        // res.json(DataResponse(freeLecList));
        return freeLecList;
    }
}//mới sửa, giờ truyền vô examslotId

export async function getAllCourseOneSlot(exSlotID) {
    let message = "";
    let coursesWithSlot = [];

    const subWithSlot = await SubInSlot.findAll({
        where: {
            exSlId: exSlotID
        }
    })
    for (const item of subWithSlot) {
        const course = await Course.findOne({
            where: {
                id: item.dataValues.courId
            }
        });
        const subject = await Subject.findOne({
            where: {
                id: course.subId
            }
        });
        const cour = {
            courId: course.id,
            subName: subject.name,
            subCode: subject.code,
        };
        coursesWithSlot.push(cour);
    }
    if (coursesWithSlot.length == 0) {
        return message = "Not found";
    } else {
        return coursesWithSlot;
    }
}

export async function getAllCourseAndNumOfStudentOneSlot(exSlotID) {
    let message = "";
    let coursesWithSlot = [];

    const subWithSlot = await SubInSlot.findAll({
        where: {
            exSlId: exSlotID
        }
    })
    for (const item of subWithSlot) {
        const course = await Course.findOne({
            where: {
                id: item.dataValues.courId
            }
        });

        const subject = await Subject.findOne({
            where: {
                id: course.subId
            }
        });

        const exRoom = await ExamRoom.findAll({
            where: {
                sSid: item.dataValues.id
            }
        })

        let count = 0;

        for (const ex of exRoom) {
            const stuExams = await StudentExam.findAll({
                where: {
                    eRId: ex.dataValues.id
                }
            });
            count += stuExams.length;
        }
        const cour = {
            courId: course.id,
            subName: subject.name,
            subCode: subject.code,
            numOfStu: count,
        };
        coursesWithSlot.push(cour);
    }
    if (coursesWithSlot.length == 0) {
        throw new Error("Not found");
    } else {
        return coursesWithSlot;
    }
}

export async function getAllRoomOneSlot(exSlotID) {
    let message = "";
    let roomsWithSlot = [];

    const subWithSlot = await SubInSlot.findAll({
        where: {
            exSlId: exSlotID
        }
    });

    for (const item of subWithSlot) {
        const exRoom = await ExamRoom.findAll({
            where: {
                sSId: item.dataValues.id
            }
        });

        const roomsWithSlotForItem = [];

        for (const ex of exRoom) {
            const room = await Room.findOne({
                where: {
                    id: ex.dataValues.roomId
                }
            });

            const rm = {
                roomId: ex.dataValues.roomId,
                roomNum: room.roomNum,
                location: room.location
            };

            roomsWithSlotForItem.push(rm);
        }

        roomsWithSlot.push(roomsWithSlotForItem);
    }

    // Flattening the nested arrays to get a single array of rooms
    const flattenedRooms = roomsWithSlot.flat();

    if (flattenedRooms.length == 0) {
        return message = "Not Found";
    } else {
        return flattenedRooms;
    }

}

export async function getAllExaminerOneSlot(exSlotID) {
    let message = "";
    let examinersWithSlot = [];

    const subWithSlot = await SubInSlot.findAll({
        where: {
            exSlId: exSlotID
        }
    });

    for (const item of subWithSlot) {
        const exRoom = await ExamRoom.findAll({
            where: {
                sSId: item.dataValues.id,
                examinerId: { [Op.ne]: null }
            }
        });

        for (const ex of exRoom) {
            const examiner = await Examiner.findOne({
                where: {
                    id: ex.dataValues.examinerId,
                }
            });
            if (examiner.typeExaminer == 1 || examiner.typeExaminer == 0) {
                const user = await User.findOne({
                    where: {
                        id: parseInt(examiner.userId)
                    }
                });
                const ex = {
                    examinerId: examiner.id,
                    examinerName: user.name,
                    examinerEmail: user.email
                };
                examinersWithSlot.push(ex);
            } else if (examiner.typeExaminer == 2) {
                const ex = {
                    examinerId: examiner.id,
                    examinerName: examiner.exName,
                    examinerEmail: examiner.exEmail
                };
                examinersWithSlot.push(ex);
            }
        }
    }

    // res.json(DataResponse(examinersWithSlot));
    if (examinersWithSlot.length == 0) {
        return message = "Not Found";
    } else {
        return examinersWithSlot;
    }

}

export async function getDetailScheduleOneExamSlot(examSlotId) {
    let message = [];
    let returnList = [];
    const exSlot = await ExamSlot.findOne({
        where: {
            id: examSlotId
        }
    })
    if (!exSlot) {
        return message = "Exam slot doesn't exist";
    }
    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lte]: exSlot.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gte]: exSlot.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    const exPhase = await ExamPhase.findOne({
        where: {
            startDay: { [Op.lte]: exSlot.day },
            endDay: { [Op.gte]: exSlot.day },
            alive: 1
        }
    })

    const subWithSlot = await SubInSlot.findAll({
        where: {
            exSlId: examSlotId,
        }
    })
    const time = await TimeSlot.findOne({
        where: {
            id: exSlot.timeSlotId,
            semId: parseInt(semester.id)
        }
    })

    for (const item of subWithSlot) {
        const course = await Course.findOne({
            where: {
                id: item.dataValues.courId
            }
        });

        const subject = await Subject.findOne({
            where: {
                id: course.subId
            }
        });

        const exRoom = await ExamRoom.findAll({
            where: {
                sSId: item.dataValues.id,
            }
        })
        for (const ex of exRoom) {
            const room = await Room.findOne({
                where: {
                    id: ex.dataValues.roomId
                }
            })
            const examiner = await Examiner.findOne({
                where: {
                    id: ex.dataValues.examinerId
                }
            })

            const numOfStuEachExRoom = await StudentExam.findAll({
                where: {
                    eRId: ex.dataValues.id
                }
            })
            if (exPhase.status == 1) {
                const a = {
                    examroomId: ex.dataValues.id,
                    subCode: subject.code,
                    day: exSlot.day,
                    startTime: time.startTime,
                    endTime: time.endTime,
                    roomNum: room.roomNum,
                    examiner: examiner == null ? "N/A" : examiner.exName,
                    numOfStu: numOfStuEachExRoom.length,
                    status: 1//được sửa
                }
                returnList.push(a);
            } else if (exPhase.status == 0) {
                const a = {
                    examroomId: ex.dataValues.id,
                    subCode: subject.code,
                    day: exSlot.day,
                    startTime: time.startTime,
                    endTime: time.endTime,
                    roomNum: room.roomNum,
                    examiner: examiner == null ? "N/A" : examiner.exName,
                    numOfStu: numOfStuEachExRoom.length,
                    status: 0//không được sửa
                }
                returnList.push(a);
            }
        }
    }

    return returnList;
}


export async function createExamRoom(sSId, roomId, userId) {
    const user = await User.findOne({
        where: {
            id: userId
        }
    })
    const subInSlot = await SubInSlot.findOne({
        where: {
            id: sSId
        }
    })
    const room = await Room.findOne({
        where: {
            id: roomId
        }
    })
    const examSlot = await ExamSlot.findOne({
        where: {
            id: subInSlot.exSlId
        }
    })
    const timeSlot = await TimeSlot.findOne({
        where: {
            id: examSlot.timeSlotId
        }
    })

    const currentExamPhase = await ExamPhase.findOne({
        where: {
            startDay: {
                [Op.lte]: examSlot.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            endDay: {
                [Op.gte]: examSlot.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
            alive: 1
        }
    })

    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lte]: examSlot.day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            end: {
                [Op.gte]: examSlot.day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    if (currentExamPhase.status == 0) {
        throw new Error("Can't change on-going or passed schedule")
    }
    const examiner = await Examiner.findOne({
        where: {
            userId: userId,
            semesterId: semester.id
        }
    })

    const statusMap = new Map([
        ['lecturer', 0],
        ['staff', 1],
        ['volunteer', 2]
    ]);

    if (!subInSlot || !room || !examSlot || !timeSlot) {
        throw new Error('Not found !')
    } else if (!examiner) {
        const newExaminer = await Examiner.create({
            userId: userId,
            typeExaminer: statusMap.get(user.role),
            semesterId: parseInt(semester.id),
            status: 0
        })
        if (!newExaminer) {
            throw new Error('Error when create new Examiner !')
        } else {
            const checkRoomLogTime = await RoomLogTime.findOne({
                where: {
                    day: examSlot.day,
                    timeSlotId: timeSlot.id,
                    roomId: roomId,
                    semId: parseInt(semester.id),
                }
            })
            if (checkRoomLogTime) {
                throw new Error(`This room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} - ${examSlot.day}`)
            } else {
                const examRoom = await ExamRoom.create({
                    sSId: sSId,
                    roomId: roomId,
                    examinerId: parseInt(newExaminer.id),
                })
                return true
            }
        }
    }
    else {
        const checkLecLogTime = await ExaminerLogTime.findOne({
            where: {
                day: examSlot.day,
                timeSlotId: timeSlot.id,
                examinerId: parseInt(examiner.id),
                semId: parseInt(semester.id)
            }
        })
        const checkRoomLogTime = await RoomLogTime.findOne({
            where: {
                day: examSlot.day,
                timeSlotId: timeSlot.id,
                roomId: roomId,
                semId: parseInt(semester.id)
            }
        })
        if (!checkLecLogTime && !checkRoomLogTime) {
            const examRoom = await ExamRoom.create({
                sSId: sSId,
                roomId: roomId,
                examinerId: parseInt(examiner.id),
            })
            return true;
        } else {
            throw new Error(`This examiner ${examiner.id} or room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} - ${examSlot.day}`)
        }
    }
}// Tạo examroom và fill examiner vào examroom