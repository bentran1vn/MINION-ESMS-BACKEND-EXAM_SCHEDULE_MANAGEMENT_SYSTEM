import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Examiner from "./Examiner.js";
import TimeSlot from "./TimeSlot.js";
import Semester from "./Semester.js";

let tableName = 'examinersLogTimes'

const ExaminerLogTime = sequelize.define( tableName , { 
    examinerId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: Examiner,
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
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
    }// khi hủy đk thì update thành 1
    //ngta k muốn đi coi thi giờ đó
    //tránh case hủy rồi lại bị xếp vô lại
});

Examiner.hasMany(ExaminerLogTime, { foreignKey: 'examinerId' })
ExaminerLogTime.belongsTo(Examiner, { foreignKey: 'examinerId' })

TimeSlot.hasMany(ExaminerLogTime, { foreignKey: 'timeSlotId' })
ExaminerLogTime.belongsTo(TimeSlot, { foreignKey: 'timeSlotId' })

Semester.hasMany(ExaminerLogTime, { foreignKey: 'semId' })
ExaminerLogTime.belongsTo(Semester, { foreignKey: 'semId' })

await ExaminerLogTime.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default ExaminerLogTime