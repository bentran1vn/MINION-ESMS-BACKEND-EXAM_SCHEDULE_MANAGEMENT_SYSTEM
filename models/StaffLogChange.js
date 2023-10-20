import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import SQLModel from "../common/SQLModel.js";
import User from "./User.js";

let tableName = 'staffLogChanges'

const StaffLogChange = sequelize.define(tableName, {
    rowId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    tableName: {
        type: DataTypes.INTEGER,
        allowNull: false
        // 0 table ExamRoom
        // 1 table StudentCourse
        // 2 table ExamPhase
        // 3 table Student Exam
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    typeChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // 0 Xóa Full 1 Row in ExamRoom
        // 1 Update Room in ExamRoom
        // 2 Update Lecturer in ExamRoom
        // 3 Update Student Status in StudentExam
        // 4 Update ExamPhase in ExamPhase
        // 5 Auto generate Lec to Exam Room
        // 6 Auto generate student to student exam
        // 7 Auto Generate Exam Room
        // 8 Add an exam phase
        // 9 Delete 1 row in exam phase
    },
    ...SQLModel
});

User.hasMany(StaffLogChange, { foreignKey: 'userId' })
StaffLogChange.belongsTo(User, { foreignKey: 'userId' })


await StaffLogChange.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default StaffLogChange