import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Lecturer from "./Lecturer.js";
import TimeSlot from "./TimeSlot.js";

let tableName = 'lecturersLogTimes'

const LecturerLogTime = sequelize.define( tableName , { 
    lecturerId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: Lecturer,
            key: 'id'
        }
    },
    day:{
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    timeSlotId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: TimeSlot,
            key: 'id'
        }
    },
});

Lecturer.hasMany(LecturerLogTime)
LecturerLogTime.belongsTo(Lecturer)

TimeSlot.hasMany(LecturerLogTime)
LecturerLogTime.belongsTo(TimeSlot)

LecturerLogTime.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default LecturerLogTime