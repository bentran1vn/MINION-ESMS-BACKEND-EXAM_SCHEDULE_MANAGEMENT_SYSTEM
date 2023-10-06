import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Room from "./Room.js";
import SubInSlot from "./SubInSlot.js";
import Lecturer from "./Lecturer.js"
import SQLModel from "../common/SQLModel.js";

let tableName = 'examRooms'

const ExamRoom = sequelize.define(tableName, {
    sSId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: SubInSlot,
            key: 'id'
        }
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Room,
            key: 'id'
        }
    },
    lecturerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Lecturer,
            key: 'id'
        }
    },
    ...SQLModel,
});

Room.hasMany(ExamRoom, { foreignKey: 'roomId' })
ExamRoom.belongsTo(Room, { foreignKey: 'roomId' })

SubInSlot.hasMany(ExamRoom, { foreignKey: 'sSId' })
ExamRoom.belongsTo(SubInSlot, { foreignKey: 'sSId' })

Lecturer.hasMany(ExamRoom, { foreignKey: 'lecturerId' })
ExamRoom.belongsTo(Lecturer, { foreignKey: 'lecturerId' })

ExamRoom.sync().then(() => {
    console.log(`${tableName} table is created`);
})

export default ExamRoom