import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Semester from "./Semester.js";
import ExamType from "./ExamType.js";

let tableName = 'examPhases'

const ExamPhase = sequelize.define(tableName, {
    semId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
            key: 'id'
        }
    },
    eTId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
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
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
    }   
    //0 is pending
    //1 is finish
});

Semester.hasMany(ExamPhase, { foreignKey: 'semId' })
ExamPhase.belongsTo(Semester, { foreignKey: 'semId' })

ExamType.hasMany(ExamPhase, { foreignKey: 'eTId' })
ExamPhase.belongsTo(ExamType, { foreignKey: 'eTId' })

await ExamPhase.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default ExamPhase