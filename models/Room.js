import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

let tableName = 'rooms'

const Room = sequelize.define(tableName, {
    roomNum: {
        type: DataTypes.STRING(3),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    note: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    status:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    //1 là hiện ra
    //0 là ẩn
});

await Room.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Room