import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Subject from "./Subject.js";
import ExamPhase from "./ExamPhase.js";

let tableName = 'courses'

const Course = sequelize.define(tableName, {
    subId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Subject,
            key: 'id'
        }
    },
    numOfStu: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ePId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ExamPhase,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    //1 là pending
    //0 là finished
});

ExamPhase.hasMany(Course, { foreignKey: 'ePId' })
Course.belongsTo(ExamPhase, { foreignKey: 'ePId' })

Subject.hasMany(Course, { foreignKey: 'subId' })
Course.belongsTo(Subject, { foreignKey: 'subId' })

await Course.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Course