import express, { response } from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
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
import { getDetailScheduleOneExamSlot, addExaminerForStaff, addRoomByStaff, autoFillLecturerToExamRoom, delRoomByStaff, getAllAvailableExaminerInSlot, getAllCourseOneSlot, getAllExaminerOneSlot, getAllRoomOneSlot, lecRegister, lecUnRegister, getAllCourseAndNumOfStudentOneSlot } from '../services/examRoomService.js'

const router = express.Router()


export default router