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
    ePName: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    //1 là hiện ra
    //0 là ko hiện ra
});

Subject.hasMany(Course, { foreignKey: 'subId' })
Course.belongsTo(Subject, { foreignKey: 'subId' })

await Course.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Course