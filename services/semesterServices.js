import Semester from "../models/Semester.js";

export async function findAllSemesterByStatus(sesStatus) {
    const semesterList = await Semester.findAll({
        where: {
            status : sesStatus
        }
    });
    if(semesterList == null || semesterList.length == 0) {
        throw new Error("Can not find the List Of Semester!")
    } else {
        return semesterList
    }
}

export async function createNewSemesterS(season, year, startDay, endDay){
    const semester = await Semester.create({
        season: season,
        year: year,
        start: startDay,
        end: endDay,
    })
    if(semester == null) {
        throw new Error("Can not create new Semester!")
    } else {
        return semester
    }
}

export async function deleteSemesterById(semId){
    const result = await Semester.update({
        status: 0
    },
    {
        where : {
            id : semId
        }
    })
    if(!result) {
        throw new Error("Can not delete Semester!")
    } else {
        return result
    }
}