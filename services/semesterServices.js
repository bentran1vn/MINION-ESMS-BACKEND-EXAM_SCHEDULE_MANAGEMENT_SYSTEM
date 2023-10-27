import Semester from "../models/Semester.js";

export async function createNewSemesterS(season, year, startDay, endDay) {
    const semester = await Semester.create({
        season: season,
        year: year,
        start: startDay,
        end: endDay,
    })
    if (semester == null) {
        throw new Error("Can not create new Semester!")
    } else {
        return semester
    }
}

export async function deleteSemesterById(semId) {
    const result = await Semester.update({
        status: 0
    },
        {
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
    if (filterBy === "year") {
        whereClause = { year: parseInt(value) }
    } else if (filterBy === "season") {
        whereClause = { season: value }
    } else if (filterBy === "status") {
        whereClause = { status: parseInt(value) }
    } else {
        semesterList = await Semester.findAll({
            limit: limit || 1,
            offset: (pageNo - 1) * limit
        });
        return semesterList;
    }
    semesterList = await Semester.findAll({
        where: whereClause,
        limit: limit || 1,
        offset: (pageNo - 1) * limit
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

export function validateYearAndSeason(year, season) {
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