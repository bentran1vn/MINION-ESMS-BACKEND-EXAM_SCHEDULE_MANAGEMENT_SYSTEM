import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import SQLModel from "../common/SQLModel.js";
import ExamRoom from "./ExamRoom.js";
import User from "./User.js";

let tableName = 'staffLogChanges'

const StaffLogChange = sequelize.define(tableName, {
    examRoomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ExamRoom,
            key: 'id'
        }
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
        // 0 Xóa Full
        // 1 Update Room
        // 2 Update Lecturer
            // Update ở đây có thể là thêm xóa sửa
    },
    ...SQLModel
});

User.hasMany(StaffLogChange, { foreignKey: 'staffId' })
StaffLogChange.belongsTo(User, { foreignKey: 'staffId' })

ExamRoom.hasMany(StaffLogChange, { foreignKey: 'examRoomId' })
StaffLogChange.belongsTo(ExamRoom, { foreignKey: 'examRoomId' })

await StaffLogChange.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default StaffLogChange