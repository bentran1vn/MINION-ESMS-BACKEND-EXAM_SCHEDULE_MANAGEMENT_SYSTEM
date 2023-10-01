import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import ExamPhase from "./ExamPhase.js";
import TimeSlot from "./TimeSlot.js";

let tableName = 'examSlots'

const ExamSlot = sequelize.define(tableName, {
    ePId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ExamPhase,
            key: 'id'
        }
    },
    day: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    timeSlotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TimeSlot,
            key: 'id'
        }
    },
});

ExamPhase.hasMany(ExamSlot)
ExamSlot.belongsTo(ExamPhase)

TimeSlot.hasMany(ExamSlot)
ExamSlot.belongsTo(TimeSlot)

ExamSlot.sync().then(() => {
    console.log(`${tableName} table is created`);
})

export default ExamSlot