import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Room from "./Room.js";
import TimeSlot from "./TimeSlot.js";

let tableName = 'roomLogTimes'

const RoomLogTime = sequelize.define(tableName, {
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Room,
            key: 'id'
        }
    },
    day: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    timeSlotId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: TimeSlot,
            key: 'id'
        }
    },
});

Room.hasMany(RoomLogTime)
RoomLogTime.belongsTo(Room)

TimeSlot.hasMany(RoomLogTime)
RoomLogTime.belongsTo(TimeSlot)

RoomLogTime.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default RoomLogTime