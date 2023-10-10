import express, { response } from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Room from '../models/Room.js'
import Lecturer from '../models/Lecturer.js'
import SubInSlot from '../models/SubInSlot.js'
import ExamRoom from '../models/ExamRoom.js'
import ExamSlot from '../models/ExamSlot.js'
import TimeSlot from '../models/TimeSlot.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import LecturerLogTime from '../models/LecturerLogTime.js'
import RoomLogTime from '../models/RoomLogTime.js'
import { createNewSemester } from './semester.js'
import { Op } from 'sequelize'


const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    ExamRooms:
 *       type: object
 *       required:
 *          - sSId
 *          - roomId
 *          - lecturerId
 *          - des 
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          sSId:
 *              type: integer
 *              description: Reference to SubInSlot id
 *          lecturerId:
 *              type: integer
 *              description:  Reference to Lecturer id
 *          des: 
 *              type: STRING
 *              description:  FE or PE
 *       example:
 *           id: 1
 *           sSId: 1
 *           lecturerId: 1
 *           des: FE
 */

/**
 * @swagger
 * tags:
 *    name: ExamRooms
 *    description: The ExamRooms managing API
 */
/**
 * @swagger
 * /examRooms/:
 *   post:
 *     summary: Create a new ExamRoom
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sSId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               lecturerId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               des:
 *                 type: String
 *                 example: PE
 *           required:
 *             - sSId
 *             - roomId
 *             - lecturerId
 *             - des
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/auto/:
 *   post:
 *     summary: Auto fill Lecturer to ExamRoom by Staff
 *     tags: [ExamRooms]
 *     responses:
 *       '200':
 *         description: All rooms assigned / Number of lecturers not enough to fill up exam room
 *       '500':
 *         description: Internal Server Error !
 */
/**
 * @swagger
 * /examRooms/lecturer/:
 *   put:
 *     summary: Register to 1 slot in ExamRoom for role Lecturer
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lecturerId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:00
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13
 *           required:
 *             - lecturerId
 *             - startTime
 *             - endTime
 *             - day
 *     responses:
 *       '200':
 *         description: Lecturer added / All rooms full / This slot hasn't have any subject
 *       '500':
 *         description: Internal Server Error !
 */
/**
 * @swagger
 * /examRooms/delLecturer/:
 *   put:
 *     summary: Un-Register to 1 slot in ExamRoom for role Lecturer
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lecturerId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:00
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-13
 *           required:
 *             - lecturerId
 *             - startTime
 *             - endTime
 *             - day
 *     responses:
 *       '200':
 *         description: Lecturer ${lecturerId} is removed, lecturer log time updated
 *       '500':
 *         description: Internal Server Error !
 */
/**
 * @swagger
 * /examRooms/addLecturer/:
 *   put:
 *     summary: Register to 1 slot in ExamRoom for role Staff
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               lecturerId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - id
 *             - lecturerId
 *     responses:
 *       '200':
 *         description: Add Success to exam room and update lecturer log time !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/room/:
 *   put:
 *     summary: Register a room to 1 slot in ExamRoom for role Staff
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *               roomId:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - id
 *             - roomId
 *     responses:
 *       '200':
 *         description: Add Success room to exam room and update room log time!
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/delRoom/:
 *   put:
 *     summary: Un-Register a room to 1 slot in ExamRoom for role Staff
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4, 5
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Room ${checkExRoom.roomId} is deleted, room log time updated
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/:
 *   get:
 *     summary: Get all exam schedule list for role Staff
 *     tags: [ExamRooms]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /examRooms/allFreeLecturersInSlot/:
 *   get:
 *     summary: Return all free lecturer in 1 slot 1 day for Staff role
 *     tags: [ExamRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: TIME
 *                 example: 07:30:00
 *               endTime:
 *                 type: TIME
 *                 example: 09:00:00
 *               day:
 *                 type: DATEONLY
 *                 example: 2023-04-14
 *           required:
 *             - startTime
 *             - endTime
 *             - day
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamRooms'
 *       '500':
 *         description: Internal Server Error !
 */

router.post('/', async (req, res) => {
    const sSId = parseInt(req.body.sSId);
    const roomId = parseInt(req.body.roomId);
    const lecturerId = parseInt(req.body.lecturerId);
    const des = req.body.des;

    try {
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
        const lecturer = await Lecturer.findOne({
            where: {
                id: lecturerId
            }
        })
        if (!subInSlot || !room || !lecturer) {
            res.json(NotFoundResponse());
            return;
        } else {
            const examRoom = await ExamRoom.create({
                sSId: sSId,
                roomId: roomId,
                lecturerId: lecturerId,
                des: des
            })
            console.log(examRoom);
            res.json(MessageResponse("Create Success !"));
            return;
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})
//auto fill lecturer
//loc ra phong nao dang thieu lecturer, sau do truy nguoc lai timeslot, day
//random 1 lecturerId trong mang lecturer sau do nhet id no vo 1 dong bat ki co lecId null trong exam room
//lay thong tin cua dong do qua bang logtime cua lec de xem ko co thi add, co thi random nguoi khac
//tự thêm lec vô examRoom
// PASS
router.post('/auto', async (req, res) => {
    const lecturer = await Lecturer.findAll();
    const lecList = lecturer.map(lec => lec.dataValues);
    const lecIdList = lecList.map(lecL => lecL.id);

    const roomNoLecturer = await ExamRoom.findAll({
        where: {
            lecturerId: null
        }
    });
    if (roomNoLecturer.length == 0) {
        res.json("All rooms assigned");
        return;
    }
    else {
        // const randomLecId = getRandomLecturerId(lecIdList);       
        const roomEmpty = roomNoLecturer.map(examRoom => examRoom.dataValues);
        for (const item of roomEmpty) {
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
            for (i; i < lecIdList.length; i++) {
                const randomLecId = lecIdList[i];
                const checkLecLogTime = await LecturerLogTime.findOne({
                    where: {
                        lecturerId: randomLecId,
                        timeSlotId: timeSlot.id,
                        day: examSlot.day
                    }
                })
                if (!checkLecLogTime) {
                    const examRoom = await ExamRoom.update({
                        lecturerId: randomLecId
                    }, {
                        where: {
                            id: id
                        }
                    })
                    if (examRoom) {
                        const updateLecLogTime = await LecturerLogTime.create({
                            lecturerId: randomLecId,
                            timeSlotId: timeSlot.id,
                            day: examSlot.day
                        })
                        break;
                    }
                }
            }

        }
        const examRoomAtferfill = await ExamRoom.findAll({
            where: {
                lecturerId: null
            }
        })
        if (examRoomAtferfill.length != 0) {
            res.json(MessageResponse("Number of lecturers not enough to fill up exam room"));
            return;
        }else{
            res.json(MessageResponse("All rooms assigned"));
            return;
        }
    }


})
function getRandomLecturerId(array) {
    // hàm lấy random lecId
    let i = 0;
    const randomIndex = Math.floor(Math.random() * array.length);
    for (i; i < array.length; i++) {
        if (i == randomIndex) return array[i];
    }
}


//update lecturerId to 1 examRoom
//có 1 giao diện như cái excel của thầy phương
//nhận từ giao diện về giờ, ngày, lecid => examslotid
//examslotid => sub in slot (tìm được slot đó có môn nào)
//=> xuống exam room xem (mỗi phòng của môn đó trong giờ đã có lecturer chưa, chưa thì filed random lec vô cái)
//thêm giành cho role lecturer | lect tự đăng kí 
//PASS , requireRole('lecturer')
router.put('/lecturer', async (req, res) => {
    //route đăng kí của lecturer
    const lecturerId = req.body.lecturerId;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;
    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    try {
        const timeSlot = await TimeSlot.findOne({
            where: { startTime: startTime, endTime: endTime }
        })

        const examSlot = await ExamSlot.findOne({
            where: { day: day, timeSlotId: timeSlot.id },
        });

        let subjectInSlot = await SubInSlot.findAll({
            where: { exSlId: examSlot.id },
        });

        const subInSlotArray = subjectInSlot.map(subInSlot => subInSlot.dataValues);
        const idArray = subInSlotArray.map(item => item.id);
        // console.log(idArray);
        //ds SSId của 1 examSlot

        // const room = roomsToUpdate.map(r => r.dataValues)
        // console.log(room); //ds empty room 
        if (idArray.length != 0) {
            const roomsToUpdate = await ExamRoom.findAll({
                where: {
                    lecturerId: null,
                    sSId: {
                        [Op.or]: idArray
                    },
                },
            });
            const rows = await ExamRoom.findOne({
                where: {
                    sSId: {
                        [Op.or]: idArray
                    },
                    lecturerId: lecturerId,
                }
            })
            if (rows) {
                res.json(MessageResponse(`Lecturer ${lecturerId} is already has room and can't take more`))
                return;
            } else {
                const randomIndex = Math.floor(Math.random() * roomsToUpdate.length);
                let i = 0;
                let check = 0;
                for (i; i < roomsToUpdate.length; i++) {
                    if (i == randomIndex) {
                        roomsToUpdate[i].update({ lecturerId: lecturerId })
                        check++;
                    }
                }
                if (check != 0) {
                    const lecLog = await LecturerLogTime.create({
                        lecturerId: lecturerId,
                        day: day,
                        timeSlotId: timeSlot.id,
                    })
                    if (!lecLog) {
                        res.json(MessageResponse("Error when input lecturer to lecturer log time."))
                        return;
                    } else {
                        res.json(MessageResponse('Lecturer added'));
                        return;
                    }
                } else {
                    res.json(MessageResponse('All rooms full'));
                    return;
                }
            }
        } else {
            res.json(MessageResponse("This slot hasn't have any subject"));
            return;
        }


    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})
//delete 1 lecturerId from examRoom
//kiểm tra xem giờ đó, ngày đó còn lecturerId đó nữa không
//truy ra id giờ => dựa vào id timeslot và id lecturer xong xóa lecturerid đó trong bảng examRoom
//xóa dành cho role lecturer
// hủy đăng ký
// PASS , requireRole('lecturer')
router.put('/delLecturer', async (req, res) => {
    //hủy đăng kí của 1 lecturer
    const lecturerId = req.body.lecturerId;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;

    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    try {
        const timeSlot = await TimeSlot.findOne({
            where: { startTime: startTime, endTime: endTime }
        })

        const examSlot = await ExamSlot.findOne({
            where: { day: day, timeSlotId: timeSlot.id },
        });

        let subjectInSlot = await SubInSlot.findAll({
            where: { exSlId: examSlot.id },
        });

        const subInSlotArray = subjectInSlot.map(subInSlot => subInSlot.dataValues);
        const idArray = subInSlotArray.map(item => item.id);
        // console.log(idArray);
        //ds SSId của 1 examSlot

        // const room = roomsToUpdate.map(r => r.dataValues)
        // console.log(room); //ds empty room 
        if (idArray.length != 0) {
            const roomOccupiedByLecturer = await ExamRoom.findOne({
                where: {
                    lecturerId: lecturerId,
                    sSId: {
                        [Op.or]: idArray
                    },
                },
            });
            if (roomOccupiedByLecturer) {
                const check = await ExamRoom.update({
                    lecturerId: null
                }, {
                    where: {
                        id: roomOccupiedByLecturer.id
                    }
                })
                if (check[0] != 0) {
                    const lecLog = await LecturerLogTime.destroy({
                        where: {
                            lecturerId: lecturerId,
                            timeSlotId: timeSlot.id,
                            day: day,
                        }
                    })
                    if (lecLog) {
                        res.json(MessageResponse(`Lecturer ${lecturerId} is removed, lecturer log time updated`))
                        return;
                    } else {
                        res.json(MessageResponse("Error when update lecturer log time"))
                        return;
                    }
                }
            } else {
                res.json(MessageResponse(`Lecturer ${lecturerId} hasn't assigned yet.`))
            }

        } else {
            res.json(MessageResponse("This slot hasn't have any subject"));
            return;
        }


    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }



})

//thêm lecturer cho role staff
// add thẳng tay dựa vào id của exam room (dòng cần thay đổi)
// không thông qua giờ như lec tự đăng kí
//, requireRole("staff")
// PASS
router.put('/addLecturer', async (req, res) => {
    //thêm lecturer của staff
    const { id, lecturerId } = req.body;
    if(!lecturerId){
        res.json(MessageResponse("Lecturer id is required"));
        return;
    }
    try {
        const checkExRoom = await ExamRoom.findOne({
            where: {
                id: parseInt(id)
            }
        })
        if (!checkExRoom) {
            res.json(NotFoundResponse());
            return;
        } else {
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
            const timeSlot = await TimeSlot.findOne({
                where: {
                    id: parseInt(examSlot.timeSlotId)
                }
            })
            if (subjectInSlot && examSlot && timeSlot) {
                const checkLecLogTime = await LecturerLogTime.findOne({
                    where: {
                        lecturerId: parseInt(lecturerId),
                        timeSlotId: timeSlot.id,
                        day: examSlot.day
                    }
                })
                if (!checkLecLogTime) {
                    const examRoom = ExamRoom.update({
                        lecturerId: parseInt(lecturerId)
                    }, {
                        where: {
                            id: parseInt(id)
                        }
                    })
                    if (examRoom[0] === 0) {
                        res.json(MessageResponse('Add Failed !'));
                        return;
                    } else {
                        const addToLecLogTime = await LecturerLogTime.create({
                            lecturerId: parseInt(lecturerId),
                            timeSlotId: timeSlot.id,
                            day: examSlot.day
                        })
                        if (addToLecLogTime) {
                            res.json(MessageResponse("Add Success to exam room and update lecturer log time !"));
                            return;
                        } else {
                            res.json(MessageResponse("Error when update lecturer log time"));
                            return;
                        }
                    }
                } else {
                    res.json(MessageResponse(`Lecturer ${lecturerId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${examSlot.day}`))
                    return;
                }
            } else {
                res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }

})


// update roomId to 1 examRoom
//update cái này thêm cập nhật room qua room log time
//role staff , requireRole("staff")
router.put('/room', async (req, res) => {
    //thêm phòng của staff
    const id = parseInt(req.body.id)
    const roomId = parseInt(req.body.roomId)
    try {
        const checkExRoom = await ExamRoom.findOne({
            where: {
                id: id
            }
        })
        if (!checkExRoom) {
            res.json(NotFoundResponse());
            return;
        } else {
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
                        day: examSlot.day
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
                        res.json(MessageResponse('Add Failed !'));
                        return;
                    } else {
                        const roomLogTime = await RoomLogTime.create({
                            roomId: roomId,
                            timeSlotId: timeSlot.id,
                            day: examSlot.day
                        })
                        if(roomLogTime){
                            res.json(MessageResponse("Add Success room to exam room and update room log time!"));
                            return;
                        }else{
                            res.json(MessageResponse("Error when update room log time"));
                            return;
                        }
                    }
                } else {
                    res.json(MessageResponse(`Room ${roomId} is busy at ${timeSlot.startTime} - ${timeSlot.endTime} ${examSlot.day}`))
                    return;
                }
            } else {
                res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//delete 1 roomId from examRoom
//role staff , requireRole("staff")
router.put('/delRoom', async (req, res) => {
    //staff nhìn vô bảng examRoom thấy lỗi chỗ nào bấm
    //client bắt r trả id dòng đó về và update roomId dòng đó thành null
    const id = parseInt(req.body.id)
    try {
        const checkExRoom = await ExamRoom.findOne({
            where: {
                id: id
            }
        })
        if (!checkExRoom) {
            res.json(NotFoundResponse());
            return;
        } else {
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
                    const delRoomLogTime = await RoomLogTime.destroy({
                        where: {
                            roomId: checkExRoom.roomId,
                            timeSlotId: timeSlot.id,
                            day: examSlot.day,
                        }
                    })
                    if (delRoomLogTime != 0) {
                        res.json(MessageResponse(`Room ${checkExRoom.roomId} is deleted, room log time updated`))
                        return;
                    } else {
                        res.json(MessageResponse("Error when update room log time"));
                        return;
                    }
                } else {
                    res.json(MessageResponse("Error when update exam room"));
                    return;
                }
            } else {
                res.json(MessageResponse(`Data at exam room id ${id} maybe wrong`))
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }

    try {
        const rowAffected = await ExamRoom.update(
            {
                roomId: null,
            }, {
            where: {
                id: id,
            }
        })
        if (rowAffected[0] === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse(`Room in row ${id} is removed`))
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//get examList By Staff
router.get('/', async (req, res) => {
    const examRoomList = await ExamRoom.findAll();
    let examList = [];
    let i = 1
    for (const key in examRoomList) {
        let item = {
            no: "",
            startTime: "",
            endTime: "",
            day: "",
            subCode: "",
            subName: "",
            roomCode: "",
            roomLocation: "",
            lecturerCode: "",
        }
        if (Object.hasOwnProperty.call(examRoomList, key)) {
            const element = examRoomList[key];
            const room = await Room.findOne({
                where: {
                    id: element.roomId
                }
            })
            item.roomCode = room.roomNum
            item.roomLocation = room.location
            if (element.lecturerId) {
                const lecturer = await Lecturer.findOne({
                    where: {
                        id: element.lecturerId
                    }
                })
                item.lecturerCode = lecturer.lecId
            }
            const subInSlot = await SubInSlot.findOne({
                where: {
                    id: element.sSId
                }
            })
            const course = await Course.findOne({
                where: {
                    id: subInSlot.courId
                }
            })
            const subject = await Subject.findOne({
                where: {
                    id: course.subId
                }
            })
            item.subCode = subject.code
            item.subName = subject.name
            const examSlot = await ExamSlot.findOne({
                where: {
                    id: subInSlot.exSlId
                }
            })
            item.day = examSlot.day
            const timeSlot = await TimeSlot.findOne({
                where: {
                    id: examSlot.timeSlotId
                }
            })
            item.startTime = timeSlot.startTime
            item.endTime = timeSlot.endTime
            item.id = i++
        }
    }
    console.log(examList);
    if (examList.length === 0) {
        res.json(InternalErrResponse())
    } else {
        res.json(DataResponse(examList))
    }

})

//tất cả lecturer rảnh tại cùng 1 giờ 1 ngày
//role staff
//PASS
router.get('/allFreeLecturersInSlot', async (req, res) => {
    const {startTime, endTime, day} = req.body;

    try {
        const timeSlot = await TimeSlot.findOne({
            where: {
                startTime: startTime,
                endTime: endTime,
            }
        })
        if(!timeSlot){
            res.json(MessageResponse("This start time and end time dont exist!"));
            return;
        }
        // console.log(timeSlot.id);
        
    
        const lecturers = await Lecturer.findAll();
        const lecList = lecturers.map(lec => lec.dataValues);
        const lecIdList = lecList.map(lecL => lecL.id);
        // console.log(lecIdList);
        let i = 0;
        let freeLecList = [];
        for(i; i < lecIdList.length; i++){
            const availableLecturerInSlot = await LecturerLogTime.findOne({
                where: {
                    lecturerId: lecIdList[i],
                    timeSlotId: timeSlot.id,
                    day: day
                }
            })
            if(!availableLecturerInSlot){
                const lc = {
                    lecturerId: lecIdList[i],
                    startTime: startTime,
                    endTime: endTime,
                    day: day
                }
                freeLecList.push(lc);
            }
        }
        console.log(freeLecList);
        if(freeLecList.length == 0){
            res.json(MessageResponse(`All lecturers are busy at ${startTime} - ${endTime} - ${day}`));
            return;
        }else{
            res.json(DataResponse(freeLecList));
            return;
        }    
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})
export default router