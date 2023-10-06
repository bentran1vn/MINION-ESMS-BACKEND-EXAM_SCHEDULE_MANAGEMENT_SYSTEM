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
import { createNewSemester } from './semester.js'
import { Op } from 'sequelize'

const router = express.Router()

router.post('/create', async (req, res) => {
    const sSId = parseInt(req.body.sSId);
    const roomId = parseInt(req.body.roomId);
    const lecturerId = parseInt(req.body.lecturerId);
    const regisTime = req.body.regisTime

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
                regisTime: regisTime
            })
            console.log(examRoom);
            res.json(DataResponse(examRoom))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

//update lecturerId to 1 examRoom
//có 1 giao diện như cái excel của thầy phương
//nhận từ giao diện về giờ, ngày, lecid => examslotid
//examslotid => sub in slot (tìm được slot đó có môn nào)
//=> xuống exam room xem (mỗi phòng của môn đó trong giờ đã có lecturer chưa, chưa thì filed random lec vô cái)

router.put('/lecturer', async (req, res) => {
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

        const roomsToUpdate = await ExamRoom.findAll({
            where: {
                lecturerId: null,
                sSId: {
                    [Op.or]: idArray
                },
            },
        });
        // const room = roomsToUpdate.map(r => r.dataValues)
        // console.log(room); //ds empty room 
        if (idArray != []) {
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
            }
        }

        const randomIndex = Math.floor(Math.random() * roomsToUpdate.length);
        let i = 0;
        let check = 0;
        for (i; i < roomsToUpdate.length; i++) {
            if (i == randomIndex) {
                roomsToUpdate[i].update({ lecturerId: lecturerId })
                check++;
            }
        }
        if (check) {
            res.json(MessageResponse('Lecturer added'));
            return;
        } else {
            res.json(MessageResponse('All rooms full'));
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

router.put('/delLecturer', async (req, res) => {
    const lecturerId = req.body.lecturerId;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const day = req.body.day;

    // Bước 1: Lấy timeSlotId từ bảng timeSlot dựa vào startTime và endTime
    TimeSlot.findOne({
        where: { startTime: startTime, endTime: endTime },
    })
        .then((timeSlot) => {
            // Bước 2: Lấy examSlotId từ bảng examSlot dựa vào day và timeSlotId
            return ExamSlot.findOne({
                where: { day: day, timeSlotId: timeSlot.id },
            });
        })
        .then((examSlot) => {
            // Bước 3: Lấy SubWhichSlotId từ bảng SubInSlot dựa vào examSlotId
            return SubInSlot.findOne({
                where: { exSlId: examSlot.id },
            });
        })
        .then((subjectInSlot) => {
            // Bước 4: Tìm phòng có SubWhichSlotId trùng với SubWhichSlotId từ subjectInSlot và lecturerId bằng lecturerId cần xóa
            return ExamRoom.findOne({
                where: { sSId: subjectInSlot.id, lecturerId: lecturerId },
            });
        })
        .then(async (roomOccupiedByLecturer) => {
            // Bước 5: Xóa lecturerId khỏi phòng
            //cùng 1 giờ, 1 ngày thi thì không thể xuất hiện 1 lecturerId với 2 SubWhichSlotId đc
            if (!roomOccupiedByLecturer) {
                res.json(NotFoundResponse())
            } else {
                const row = await roomOccupiedByLecturer.update({ lecturerId: null });
                if (row != 0) {
                    res.json(MessageResponse(`${lecturerId} is removed`))
                    return;
                }
            }
        })
        .catch((error) => {
            console.error(error);
            res.json(InternalErrResponse());
        });
})

// update roomId to 1 examRoom
router.put('/room', async (req, res) => {

    const id = parseInt(req.body.id)
    const roomId = parseInt(req.body.roomId)

    try {
        const rowAffected = await ExamRoom.update(
            {
                roomId: roomId,
            }, {
            where: {
                id: id,
            }
        })
        if (rowAffected[0] === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse(`Room id in row ${id} is update to ${roomId}`))
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

//delete 1 roomId from examRoom
//
router.put('/delRoom', async (req, res) => {
    //staff nhìn vô bảng examRoom thấy lỗi chỗ nào bấm
    //client bắt r trả id dòng đó về và update roomId dòng đó thành null
    const id = parseInt(req.body.id)

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

export default router