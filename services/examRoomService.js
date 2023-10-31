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

export async function lecRegister(lecturerId, startTime, endTime, day, incomingPhase) {
    let message = "";
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)

    const exPhase = await ExamPhase.findOne({
        where: {
            id: incomingPhase
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
    const user = await User.findOne({
        where: {
            id: lecturerId
        }
    })
    const examiner = await Examiner.findOne({
        where: {
            userId: parseInt(lecturerId),
            semesterId: parseInt(semester.id)
        }
    })
    if (examiner && examiner.dataValues.status == 1) {
        const row = await Examiner.update({ status: 0 }, {
            where: {
                userId: lecturerId,
                semesterId: parseInt(semester.id)
            }
        })
    }
    if (!examiner) {
        await Examiner.create({
            userId: parseInt(lecturerId),
            typeExaminer: 0,
            semesterId: parseInt(semester.id),
            exName: user.name,
            exEmail: user.email,
            status: 0
        })
    }
    const lecToExaminer = await Examiner.findOne({
        where: {
            userId: lecturerId,
            semester: parseInt(semester.id)
        }
    })
    const timeSlot = await TimeSlot.findOne({
        where: { startTime: startTime, endTime: endTime }
    })

    const examSlot = await ExamSlot.findOne({
        where: { day: day, timeSlotId: timeSlot.id },
    });

    let subjectInSlot = await SubInSlot.findAll({
        where: { exSlId: examSlot.id },
    });

    let subInSlot2 = [];
    for (const item of subjectInSlot) {
        const examSlot = await ExamSlot.findOne({
            id: item.dataValues.exSlId
        });
        if (examSlot.day > timeFormatted) { // thay đổi thành exPh
            subInSlot2.push(item);
        }
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
                }
            }
            if (check != 0) {
                const lecLog = await ExaminerLogTime.create({
                    examinerId: lecToExaminer.id,
                    day: day,
                    timeSlotId: timeSlot.id,
                    semId: parseInt(semester.id)
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

export async function lecUnRegister(lecturerId, startTime, endTime, day) {
    let message = "";
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)
    const examPhase = await ExamPhase.findOne({
        where: {
            startDay: {
                [Op.lte]: day, // Kiểm tra nếu ngày bắt đầu kỳ học nhỏ hơn ngày cần kiểm tra
            },
            endDay: {
                [Op.gte]: day, // Kiểm tra nếu ngày kết thúc kỳ học lớn hơn ngày cần kiểm tra
            },
        }
    })
    if (examPhase.status == 0) {
        return message = "Can't change on-going or passed schedule";
    }
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
    const examiner = await Examiner.findOne({
        where: {
            userId: parseInt(lecturerId),
            semesterId: parseInt(semester.id)
        }
    })
    const timeSlot = await TimeSlot.findOne({
        where: { startTime: startTime, endTime: endTime }
    })

    const examSlot = await ExamSlot.findOne({
        where: { day: day, timeSlotId: timeSlot.id },
    });

    let subjectInSlot = await SubInSlot.findAll({
        where: { exSlId: examSlot.id },
    });

    let subInSlot2 = [];
    subjectInSlot.forEach(async (item) => {
        const examSlot = await ExamSlot.findOne({
            id: item.dataValues.exSlId
        })
        if (examSlot.day > timeFormatted) {
            subInSlot2.push(item);
        }
    });

    if (subInSlot2.length == 0) {
        // res.json(MessageResponse(`Current semester doesn't have any exam room for this ${startTime} - ${endTime}`));
        return message = `Current semester doesn't have any exam room for this ${startTime} - ${endTime}`;
    }

    const subInSlotArray = subInSlot2.map(subInSlot => subInSlot.dataValues);
    const idArray = subInSlotArray.map(item => item.id);
    // console.log(idArray);
    //ds SSId của 1 examSlot

    // const room = roomsToUpdate.map(r => r.dataValues)
    // console.log(room); //ds empty room 
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
                        semId: parseInt(semester.id)
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

    } else {
        // res.json(MessageResponse("This slot hasn't have any subject"));
        return message = "This slot hasn't have any subject";
    }
}

export async function addExaminerForStaff(staffId, id, userId) {
    let message = "";
    if (!userId) {
        // res.json(MessageResponse("User id is required"));
        return message = "User id is required";
    }
    const statusMap = new Map([
        ['lecturer', 0],
        ['staff', 1],
        ['volunteer', 2]
    ]);

    const user = await User.findOne({
        id: parseInt(userId)
    })
    if (!user) {
        // res.json(MessageResponse("This user ID doesn't exist"));
        return message = "This user ID doesn't exist";
    }
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
    const examiner = await Examiner.findOne({
        userId: parseInt(userId),
        semesterId: parseInt(semester.id)
    })
    if (examiner.status == 1) {
        await Examiner.update({ status: 0 }, {
            where: {
                userId: parseInt(userId),
                semesterId: parseInt(semester.id)
            }
        })
        await StaffLogChange.create({
            rowId: parseInt(examiner.id),
            tableName: 5,
            userId: staffId,
            typeChange: 10
        })
    } else {
        const e = await Examiner.create({
            userId: parseInt(userId),
            semesterId: parseInt(semester.id),
            status: 0,
            typeExaminer: statusMap.get(user.role)
        })
        await StaffLogChange.create({
            rowId: parseInt(e.id),
            tableName: 5,
            userId: staffId,
            typeChange: 10
        })
    }
    const lecToExaminer = await Examiner.findOne({
        where: {
            userId: parseInt(userId),
            semesterId: parseInt(semester.id)
        }
    })

    const checkExRoom = await ExamRoom.findOne({
        where: {
            id: parseInt(id)
        }
    })
    if (!checkExRoom) {
        res.json(NotFoundResponse());
        return;
    }

    const subSlot = await SubInSlot.findOne({
        where: {
            id: checkExRoom.sSId
        }
    })
    const exSlot = await ExamSlot.findOne({
        where: {
            id: subSlot.exSlId
        }
    })
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
    if ((!currentExamPhase && exSlot.day < timeFormatted) || (currentExamPhase && (currentExamPhase.endDay >= exSlot.day))) {
        // res.json(MessageResponse("Can't change on-going or passed schedule"));
        return message = "Can't change on-going or passed schedule";
    }

    const timeSlot = await TimeSlot.findOne({
        where: {
            id: parseInt(exSlot.timeSlotId)
        }
    })
    if (subSlot && exSlot && timeSlot) {
        const checkLecLogTime = await ExaminerLogTime.findOne({
            where: {
                examinerId: parseInt(lecToExaminer.id),
                timeSlotId: timeSlot.id,
                day: exSlot.day,
                semId: parseInt(semester.id)
            }
        })
        if (!checkLecLogTime) {
            const examRoom = ExamRoom.update({
                examinerId: parseInt(lecToExaminer.id)
            }, {
                where: {
                    id: parseInt(id)
                }
            })
            if (examRoom[0] === 0) {
                // res.json(MessageResponse('Add Failed !'));
                return message = 'Add Failed !';
            } else {
                const staffLog = await StaffLogChange.create({
                    rowId: parseInt(id),
                    staffId: staffId,
                    tableName: 0,
                    typeChange: 0
                })

                const addToLecLogTime = await ExaminerLogTime.create({
                    examinerId: parseInt(lecToExaminer.id),
                    timeSlotId: timeSlot.id,
                    day: exSlot.day,
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
            // res.json(MessageResponse(`Examiner ${lecToExaminer.id} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${exSlot.day}`))
            return message = `Examiner ${lecToExaminer.id} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${exSlot.day}`;
        }
    } else {
        // res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
        return message = `Data at exam room id ${id} maybe wrong`;
    }
}

export async function addRoomByStaff(staffId, id, roomId) {
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

    const checkExRoom = await ExamRoom.findOne({
        where: {
            id: id
        }
    })
    if (!checkExRoom) {
        // res.json(MessageResponse("Not found exam room"));
        return message = "Not found exam room";
    }
    const subjectInSlot = await SubInSlot.findOne({
        where: {
            id: parseInt(checkExRoom.sSId)
        }
    })
    const examSlot = await ExamSlot.findOne({
        where: {
            id: parseInt(subjectInSlot.exSlId)
        }
    })
    if (examSlot.day < semester.startDay) {
        // res.json(MessageResponse("Can't add room to passed semester"));
        return message = "Can't add room to passed semester";
    }

    const timeSlot = await TimeSlot.findOne({
        where: {
            id: parseInt(examSlot.timeSlotId)
        }
    })
    if (subjectInSlot && examSlot && timeSlot) {
        const checkRoomLogTime = await RoomLogTime.findOne({
            where: {
                roomId: roomId,
                timeSlotId: timeSlot.id,
                day: examSlot.day,
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
                    staffId: staffId,
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
                    day: examSlot.day,
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
            return message = `Room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${examSlot.day}`;
        }
    } else {
        // res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`));
        return message = `Data at exam room id ${id} maybe wrong`;
    }
}

export async function delRoomByStaff(staffId, id) {
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
    const checkExRoom = await ExamRoom.findOne({
        where: {
            id: id
        }
    })
    if (!checkExRoom) {
        // res.json(MessageResponse("Table semester hasn't have data for this semester"));
        return message = "Table semester hasn't have data for this semester";
    }

    const subjectInSlot = await SubInSlot.findOne({
        where: {
            id: parseInt(checkExRoom.sSId)
        }
    })
    const examSlot = await ExamSlot.findOne({
        where: {
            id: parseInt(subjectInSlot.exSlId)
        }
    })
    if (examSlot.day < semester.startDay) {
        // res.json(MessageResponse("Can't delete room of passed semester"));
        return message = "Can't delete room of passed semester";
    }
    const timeSlot = await TimeSlot.findOne({
        where: {
            id: parseInt(examSlot.timeSlotId)
        }
    })
    if (subjectInSlot && examSlot && timeSlot) {
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
                staffId: staffId,
                tableName: 0,
                typeChange: 1
            })
            if (!staffLog) {
                // throw new Error("Create staff log failed");
                return message = "Create staff log failed";
            }
            const delRoomLogTime = await RoomLogTime.destroy({
                where: {
                    roomId: checkExRoom.roomId,
                    timeSlotId: timeSlot.id,
                    day: examSlot.day,
                    semId: parseInt(semester.id)
                }
            })
            if (delRoomLogTime != 0) {
                // res.json(MessageResponse(`Room ${checkExRoom.roomId} is deleted, room log time updated`))
                return message = `Room ${checkExRoom.roomId} is deleted, room log time updated`;
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

export async function getAllAvailableExaminerInSlot(staffId, startTime, endTime, day) {
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
    const timeSlot = await TimeSlot.findOne({
        where: {
            startTime: startTime,
            endTime: endTime,
        }
    })
    if (!timeSlot) {
        // res.json(MessageResponse("This start time and end time dont exist!"));
        return message = "This start time and end time dont exist!";
    }
    // console.log(timeSlot.id);

    const statusMap = new Map([
        ['lecturer', 0],
        ['staff', 1],
        ['volunteer', 2]
    ]);
    const user = await User.findAll({
        where: {
            role: {
                [Op.or]: ['lecturer', 'staff', 'volunteer']
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
    const examinerList = allExaminer.map(ex => ex.dataValues);
    const exIdList = examinerList.map(exL => exL.id);
    // console.log(lecIdList);
    let i = 0;
    let freeLecList = [];
    for (i; i < exIdList.length; i++) {
        const availableLecturerInSlot = await ExaminerLogTime.findOne({
            where: {
                examinerId: exIdList[i],
                timeSlotId: timeSlot.id,
                day: day,
                semId: parseInt(semester.id)
            }
        })
        if (!availableLecturerInSlot) {
            const lc = {
                examinerId: exIdList[i],
                startTime: startTime,
                endTime: endTime,
                day: day
            }
            freeLecList.push(lc);
        }
    }
    console.log(freeLecList);
    if (freeLecList.length == 0) {
        // res.json(MessageResponse(`All examiners are busy at ${startTime} - ${endTime} - ${day}`));
        return message = `All examiners are busy at ${startTime} - ${endTime} - ${day}`;
    } else {
        // res.json(DataResponse(freeLecList));
        return freeLecList;
    }
}

export async function getAllCourseOneSlot(exSlotID) {
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
            subCode: subject.code,
            numOfStu: course.numOfStu,
        };

        coursesWithSlot.push(cour);
    }
    return coursesWithSlot;
}

export async function getAllRoomOneSlot(exSlotID) {
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

    // res.json(DataResponse(flattenedRooms));
    return flattenedRooms;

}

export async function getAllExaminerOneSlot(exSlotID) {
    let examinersWithSlot = [];

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
    return examinersWithSlot;
}