import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Room from "./Room.js";
import SubInSlot from "./SubInSlot.js";
import SQLModel from "../common/SQLModel.js";
import Examiner from "./Examiner.js";

let tableName = 'examRooms'
//nhớ sửa typechange của staff nha quân
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
    examinerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Examiner,
            key: 'id'
        }
    },
    ...SQLModel,
});

Room.hasMany(ExamRoom, { foreignKey: 'roomId' })
ExamRoom.belongsTo(Room, { foreignKey: 'roomId' })

SubInSlot.hasMany(ExamRoom, { foreignKey: 'sSId' })
ExamRoom.belongsTo(SubInSlot, { foreignKey: 'sSId' })

Examiner.hasMany(ExamRoom, { foreignKey: 'examinerId' })
ExamRoom.belongsTo(Examiner, { foreignKey: 'examinerId' })

await ExamRoom.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default ExamRoom