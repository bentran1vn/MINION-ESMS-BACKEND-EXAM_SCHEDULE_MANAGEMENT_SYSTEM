import sequelize from "../database/database.js";
import { DataTypes, INTEGER } from "sequelize";
import Semester from "./Semester.js";
import ExamPhase from "./ExamPhase.js";
import { Sequence } from "mysql2/typings/mysql/lib/protocol/sequences/Sequence.js";

let tableName = 'timeSlots'

const TimeSlot = sequelize.define(tableName, {
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    semId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        Reference: {
            model: Semester,
            key: 'id'
        }
    },
    des: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }//0 là nor, 1 là cour

});

await TimeSlot.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default TimeSlot