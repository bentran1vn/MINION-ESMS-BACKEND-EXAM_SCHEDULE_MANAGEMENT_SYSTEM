import Semester from "../models/Semester.js";
import TimeSlot from "../models/TimeSlot.js";
import ExamPhase from "../models/ExamPhase.js";
import { Op } from 'sequelize'

export async function createNewSemesterS(season, year, start, end) {
    const semester = await Semester.findOne({
        where: {
            [Op.or]: [
                {
                    start: { [Op.between]: [start, end] },
                },
                {
                    end: { [Op.between]: [start, end] },
                },
            ],
        },
    });
    const existingSemesters = await Semester.findOne({
        where: {
            [Op.and]: {
                year: year,
                season: season
            }
        }
    });
    if (existingSemesters || semester) {
        return "Collision to others semester"
    } else {
        const semester = await Semester.create({
            year: year,
            season: season,
            start: start,
            end: end
        })
        if (semester != null) {
            return "Create new semester successfully!"
        }
    }
}

export async function deleteSemesterById(semId) {
    const result = await Semester.update({
        status: 0
    }, {
        where: {
            id: semId
        }
    })
    if (result[0] == 0) {
        throw new Error("Can not delete Semester!")
    } else {
        return true
    }
}

export async function findAllSemester() {
    let semList = [];
    const current = new Date().toISOString().slice(0, 10);
    const semesterList = await Semester.findAll();
    if (semesterList.length == 0) {
        throw new Error('Not found !')
    }

    for (const sem of semesterList) {
        const phase = await ExamPhase.findOne({
            where: {
                semId: sem.dataValues.id
            }
        })
        if (sem.dataValues.start > current && sem.dataValues.status == 1 && !phase) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 1, //ĐC XÓA
                time: "FUTURE"
            }
            semList.push(s);
        } else if (sem.dataValues.start > current && sem.dataValues.status == 1 && phase) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "FUTURE"
            }
            semList.push(s);
        } else if (sem.dataValues.start > current && sem.dataValues.status == 0) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "FUTURE"
            }
            semList.push(s);
        } else if (sem.dataValues.start <= current && current <= sem.dataValues.end) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "ONGOING"
            }
            semList.push(s);
        } else if (sem.dataValues.end < current) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "PASSED"
            }
            semList.push(s);
        }
    }
    return semList;
}

export async function findAllSemesterVer2() {
    let semList = [];
    const current = new Date().toISOString().slice(0, 10);
    const semesterList = await Semester.findAll({
        where: {
            status: 1
        }
    });

    for (const sem of semesterList) {
        const phase = await ExamPhase.findOne({
            where: {
                semId: sem.dataValues.id
            }
        })
        if (sem.dataValues.start > current && sem.dataValues.status == 1 && !phase) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 1, //ĐC XÓA
                time: "FUTURE"
            }
            semList.push(s);
        } else if (sem.dataValues.start > current && sem.dataValues.status == 1 && phase) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "FUTURE"
            }
            semList.push(s);
        } else if (sem.dataValues.start > current && sem.dataValues.status == 0) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "FUTURE"
            }
            semList.push(s);
        } else if (sem.dataValues.start <= current && current <= sem.dataValues.end) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "ONGOING"
            }
            semList.push(s);
        } else if (sem.dataValues.end < current) {
            const s = {
                id: sem.dataValues.id,
                season: sem.dataValues.season,
                year: sem.dataValues.year,
                start: sem.dataValues.start,
                end: sem.dataValues.end,
                status: sem.dataValues.status,
                delete: 0, //KO
                time: "PASSED"
            }
            semList.push(s);
        }
    }
    return semList;
}

export async function findOneSemester(valueList, typeList) {
    let whereClause = []
    for (let i = 0; i < typeList.length; i++) {
        const value = valueList[i];
        const type = typeList[i];
        whereClause.push({
            [type]: value
        })
    }

    const semester = await Semester.findOne({ where: { whereClause } });

    if (semester == null) {
        throw new Error("Can not find the Semester!");
    } else {
        return semester;
    }
}

export async function validateYearAndSeason(year, season) {
    const currentYear = new Date().getFullYear();

    if (isNaN(year) || year < currentYear || year.toString().length !== 4) {
        return false;
    }

    if (season !== 'SPRING' && season !== 'SUMMER' && season !== 'FALL') {
        return false;
    }

    const currentMonth = new Date().getMonth() + 1;
    if ((season === 'SPRING' && (currentMonth < 0 || currentMonth >= 5)) ||
        (season === 'SUMMER' && (currentMonth < 5 || currentMonth >= 9)) ||
        (season === 'FALL' && (currentMonth < 9 || currentMonth >= 12))) {
        return false;
    } else {
        return true
    }
}

export async function getSemesterAndStatus() {
    let final = [];
    const semester = await Semester.findAll({
        where: {
            status: 1
        }
    });
    const time = new Date() //ngày hiện tại
    var timeFormatted = time.toISOString().slice(0, 10)
    semester.forEach(async (item) => {
        if (timeFormatted >= item.dataValues.start && timeFormatted <= item.dataValues.end) {
            const c = {
                start: item.dataValues.start,
                end: item.dataValues.end,
                season: `${item.dataValues.season.toUpperCase()}_${item.dataValues.year}`,
                cur: 1,//ongoing
            }
            final.push(c);
        } else if (timeFormatted < item.dataValues.start) {
            const c = {
                start: item.dataValues.start,
                end: item.dataValues.end,
                season: `${item.dataValues.season.toUpperCase()}_${item.dataValues.year}`,
                cur: 2,//future
            }
            final.push(c);
        } else {
            const c = {
                start: item.dataValues.start,
                end: item.dataValues.end,
                season: `${item.dataValues.season.toUpperCase()}_${item.dataValues.year}`,
                cur: 0,//close
            }
            final.push(c);
        }
    });
    return final
}

export async function autoCreateTimeSlotWhenCreateSemester(year, season, start, end) {
    const semester = await Semester.findOne({
        where: {
            [Op.or]: [
                {
                    start: { [Op.between]: [start, end] },
                },
                {
                    end: { [Op.between]: [start, end] },
                },
            ],
            status: 1
        },
    });
    if (semester) {
        throw new Error("Collision to other Semester start, end")
    } else {
        const newSemester = await Semester.create({
            season: season,
            year: year,
            start: start,
            end: end
        })
        let standardTimeSlot = [
            { startTime: "07:30:00", endTime: "09:00:00", semId: `${newSemester.id}`, des: 0 },
            { startTime: "09:15:00", endTime: "10:45:00", semId: `${newSemester.id}`, des: 0 },
            { startTime: "11:00:00", endTime: "12:30:00", semId: `${newSemester.id}`, des: 0 },
            { startTime: "12:45:00", endTime: "14:15:00", semId: `${newSemester.id}`, des: 0 },
            { startTime: "14:30:00", endTime: "16:00:00", semId: `${newSemester.id}`, des: 0 },
            { startTime: "16:15:00", endTime: "17:45:00", semId: `${newSemester.id}`, des: 0 },
            { startTime: "07:30:00", endTime: "10:00:00", semId: `${newSemester.id}`, des: 1 },
            { startTime: "10:15:00", endTime: "12:45:00", semId: `${newSemester.id}`, des: 1 },
            { startTime: "13:30:00", endTime: "15:30:00", semId: `${newSemester.id}`, des: 1 },
            { startTime: "15:45:00", endTime: "18:15:00", semId: `${newSemester.id}`, des: 1 }
        ]
        let check = 0;
        for (const item of standardTimeSlot) {
            const time = await TimeSlot.create({
                startTime: item.startTime,
                endTime: item.endTime,
                semId: item.semId,
                des: item.des
            })
            if (time) {
                check++;
            }
        }
        if (check != 0) {
            return "Add time slot success";
        }
    }
}