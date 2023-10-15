import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import SQLModel from "../common/SQLModel.js";
import ExamRoom from "./ExamRoom.js";
import User from "./User.js";

let tableName = 'staffLogChanges'

const StaffLogChange = sequelize.define(tableName, {
    rowId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tableName: {
        type: DataTypes.INTEGER,
        allowNull: false
        // 0 table ExamRoom
        // 1 table StudentCourse
        // 2 table ExamPhase
    },
    staffId: {
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
        // 3 Update Student Status in StudentCourse
        // 4 Update ExamPhase in ExamPhase

            // Update ở đây có thể là thêm xóa sửa
    },
    ...SQLModel
});

User.hasMany(StaffLogChange, { foreignKey: 'staffId' })
StaffLogChange.belongsTo(User, { foreignKey: 'staffId' })


await StaffLogChange.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default StaffLogChange