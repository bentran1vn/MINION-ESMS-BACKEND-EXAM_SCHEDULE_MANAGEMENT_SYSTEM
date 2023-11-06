import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import TimeSlot from '../models/TimeSlot.js'
import { Op } from 'sequelize'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'

export async function createTimeSlot(timeSlotDatas, semId) {
    const semester = await Semester.findOne({
        where: {
            id: semId
        }
    })
    if (!semester) {
        res.json(MessageResponse("Semester doesn't exist"));
        return;
    }

    const timeSlot = await TimeSlot.create({
        startTime: timeSlotDatas.startTime,
        endTime: timeSlotDatas.endTime,
        semId: parseInt(semester.id),
        des: parseInt(timeSlotDatas.des),
    })
    if (timeSlot) {
        return "Create success !";
    } else {
        return "Create fail"
    }
}

export async function getTimeByDesOfPhase(examphaseId, semesterId) {
    const curSemester = await Semester.findOne({
        where: {
            id: semesterId
        }
    })
    const curExamPhase = await ExamPhase.findOne({
        where: {
            id: examphaseId,
            alive: 1
        }
    })
    if (!curSemester || !curExamPhase) {
        return "Not found semester or examphase"
    }
    const slot = await TimeSlot.findAll({
        where: {
            semId: semesterId,
            des: parseInt(curExamPhase.des)
        }
    })
    if (slot) {
        return slot;
    }
}

export async function getAllTimeSlotOneSem(semId) {
    const timeSlots = await TimeSlot.findAll({
        where: {
            semId: semId
        }
    });
    if (!timeSlots) {
        return "The time slot table has no data of this semester!";
    } else {
        return timeSlots
    }
}

export async function delTimeSlot(id) {
    const rowAffected = await TimeSlot.destroy({
        where: {
            id: id
        }
    })
    if (rowAffected === 0) {
        return "Not found"
    } else {
        return 'Delete Success !';
    }

}

export async function updateTime(id, timeSlotData){
    const rowAffected = await TimeSlot.update(timeSlotData, {
        where: {
            id: id,
        }
    })
    if (rowAffected[0] === 0) {
        return "Not found"
    } else {
        return "Update success !"
    }
}