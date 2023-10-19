import { Op } from "sequelize"
import Semester from "../models/Semester.js"

export async function findSemesterPresentTime() {
    const date = new Date()
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    const d = year + "-" + month + "-" + day;

    const semester = await Semester.findOne({
        where: {
            start: {
                [Op.lt]: d
            },
            end: {
                [Op.gt]: d
            }
        }
    })
    if(semester !== null){
        return semester.id
    } else {
        throw new Error("Can not find the appropriate semester!")
    }
}