import Semester from "../models/Semester.js";

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
    if (!result) {
        throw new Error("Can not delete Semester!")
    } else {
        return result
    }
}

export async function findAllSemester(value, filterBy, pageNo, limit) {
    let whereClause
    let semesterList
    // if (filterBy === "year") {
    //     whereClause = { year: parseInt(value) }
    // } else if (filterBy === "season") {
    //     whereClause = { season: value }
    // } else if (filterBy === "status") {
    //     whereClause = { status: parseInt(value) }
    // } else {
    //     semesterList = await Semester.findAll({
    //         limit: limit || 1,
    //         offset: (pageNo - 1) * limit
    //     });
    //     return semesterList;
    // }
    semesterList = await Semester.findAll({
        // where: whereClause,
        // limit: limit || 1,
        // offset: (pageNo - 1) * limit
    });

    if (semesterList == null || semesterList.length === 0) {
        throw new Error("Can not find the List Of Semester!");
    } else {
        return semesterList;
    }
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
    const semester = await Semester.findAll();
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
    const newSemester = await Semester.create({
        season: season,
        year: year,
        start: start,
        end: end
    })

    const semester = await Semester.findOne({
        where: {
            season: season,
            year: year,
            start: start,
            end: end
        }
    })
    let oldsemId = parseInt(semester.id) - 1;
    let standardTimeSlot = [
        { startTime: "07:30:00", endTime: "09:00:00", semId: `${semester.id}`, des: 0 },
        { startTime: "09:15:00", endTime: "10:45:00", semId: `${semester.id}`, des: 0 },
        { startTime: "11:00:00", endTime: "12:30:00", semId: `${semester.id}`, des: 0 },
        { startTime: "12:45:00", endTime: "14:15:00", semId: `${semester.id}`, des: 0 },
        { startTime: "14:30:00", endTime: "16:00:00", semId: `${semester.id}`, des: 0 },
        { startTime: "16:15:00", endTime: "17:45:00", semId: `${semester.id}`, des: 0 },
        { startTime: "07:30:00", endTime: "10:00:00", semId: `${semester.id}`, des: 1 },
        { startTime: "10:15:00", endTime: "12:45:00", semId: `${semester.id}`, des: 1 },
        { startTime: "13:30:00", endTime: "15:30:00", semId: `${semester.id}`, des: 1 },
        { startTime: "15:45:00", endTime: "18:15:00", semId: `${semester.id}`, des: 1 }
    ]
    let check = 0;
    if (oldsemId == 0) {
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
    }
    if (check != 0) {
        return "Add time slot success";
    }
    const oldtimeslot = await TimeSlot.findAll({
        where: {
            semId: oldsemId
        }
    })
    for (const time of oldtimeslot) {
        const newtimeslot = await TimeSlot.create({
            startTime: time.dataValues.startTime,
            endTime: time.dataValues.endTime,
            semId: parseInt(semester.id),
            des: time.dataValues.des
        })
    }
    return "Add new timeslot success";
}