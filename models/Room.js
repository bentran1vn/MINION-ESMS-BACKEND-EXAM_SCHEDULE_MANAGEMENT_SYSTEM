import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

let tableName = 'rooms'

const Room = sequelize.define(tableName, {
    roomNum: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false,
    }
});
Room.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Room