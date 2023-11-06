import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Semester from "./Semester.js";

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
    ePName: {
        type: DataTypes.STRING,
        allowNull: false,
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
        defaultValue: 1,
    },//1 is pending //0 is finish
    des: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // 0 is Nor
    // 1 is Cour
    alive: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
    },
    // 1 is alive
    // 0 is dead
    
});

Semester.hasMany(ExamPhase, { foreignKey: 'semId' })
ExamPhase.belongsTo(Semester, { foreignKey: 'semId' })

await ExamPhase.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default ExamPhase