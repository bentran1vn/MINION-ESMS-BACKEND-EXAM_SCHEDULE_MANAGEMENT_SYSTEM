import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Semester from "./Semester.js";
import ExamType from "./ExamType.js";

let tableName = 'examPhases'

const ExamPhase = sequelize.define( tableName , {
    semId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: Semester,
            key: 'id'
        }
    },
    eTId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references:{
            model: ExamType,
            key: 'id'
        },
    },
    startDay: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    endDay: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
});

Semester.hasMany(ExamPhase)
ExamPhase.belongsTo(Semester)

ExamType.hasMany(ExamPhase)
ExamPhase.belongsTo(ExamType)

ExamPhase.sync().then(()=> {
    console.log(`${tableName} table is created`);
})

export default ExamPhase