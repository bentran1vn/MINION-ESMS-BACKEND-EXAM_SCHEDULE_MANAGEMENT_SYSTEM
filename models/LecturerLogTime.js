import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Lecturer from "./Lecturer.js";
import TimeSlot from "./TimeSlot.js";
import Semester from "./Semester.js";

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
    semId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
            key: 'id'
        }
    },
});

Lecturer.hasMany(LecturerLogTime, { foreignKey: 'lecturerId' })
LecturerLogTime.belongsTo(Lecturer, { foreignKey: 'lecturerId' })

TimeSlot.hasMany(LecturerLogTime, { foreignKey: 'timeSlotId' })
LecturerLogTime.belongsTo(TimeSlot, { foreignKey: 'timeSlotId' })

Semester.hasMany(LecturerLogTime, { foreignKey: 'semId' })
LecturerLogTime.belongsTo(Semester, { foreignKey: 'semId' })

await LecturerLogTime.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default LecturerLogTime