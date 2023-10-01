import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

let tableName = 'timeSlots'

const TimeSlot = sequelize.define(tableName, {
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },

});

TimeSlot.sync().then(() => {
    console.log(`${tableName} table is created`);
})

export default TimeSlot