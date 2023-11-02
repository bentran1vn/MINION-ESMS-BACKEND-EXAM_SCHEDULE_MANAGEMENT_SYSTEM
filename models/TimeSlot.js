import sequelize from "../database/database.js";
import { DataTypes} from "sequelize";
import Semester from "./Semester.js";

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
    semId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        Reference: {
            model: Semester,
            key: 'id'
        }
    },
    des: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }//0 là nor, 1 là cour

});

Semester.hasMany(TimeSlot, { foreignKey: 'semId' })
TimeSlot.belongsTo(Semester, { foreignKey: 'semId' })

await TimeSlot.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default TimeSlot