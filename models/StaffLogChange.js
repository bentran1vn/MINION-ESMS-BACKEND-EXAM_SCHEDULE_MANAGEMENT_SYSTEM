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
        // 1 table StudentSubject
        // 2 table StudentExam
        // 3 table examSlot
        // 4 table user
        // 5 table Examiner
        // 6 table Examphase
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
        // 0 thay đổi dữ liệu Examiner 1 row trong examRoom (ghi nhận rowId)
        // 1 thay đổi dữ liệu nhiều Examiner row trong examRoom
        // 2 thay đổi dữ liệu 1 row trong studentSubject (ghi nhận rowId)
        // 3 thay đổi dữ liệu nhiều row trong studentSubject
        // 4 thay đổi dữ liệu 1 row trong studentExam (ghi nhận rowId)
        // 5 thay đổi dữ liệu nhiều row trong studentExam
        // 6 thay đổi dữ liệu 1 row trong examSlot (ghi nhận rowId)
        // 7 thay đổi dữ liệu nhiều row trong examSlot
        // 8 thêm mới CTV
        // 9 chỉnh sửa status CTV
        // 10 thay đổi 1 row trong table Examiner (ghi nhận rowId)
        // 11 thay đổi nhiều row trong table Examiner
        // 12 tạo mới 1 ExamRoom
        // 13 tạo mới 1 ExamPhase
        // 14 thay đổi 1 row trong ExamPhase (ghi nhận rowId)
        // 15 xóa một ExamPhase
        // 16 tạo mới 1 subInSlot
        // 17 tạo mới 1 User
        // 18 xóa 1 User
        // 19 tạo mới 1 ExamSlot
        // 20 tạo mới nhiều ExamRoom

    },
    ...SQLModel
});

User.hasMany(StaffLogChange, { foreignKey: 'userId' })
StaffLogChange.belongsTo(User, { foreignKey: 'userId' })


await StaffLogChange.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default StaffLogChange