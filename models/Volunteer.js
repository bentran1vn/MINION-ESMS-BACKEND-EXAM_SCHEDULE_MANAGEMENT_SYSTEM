import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

let tableName = 'volunteers'

const Volunteer = sequelize.define( tableName , {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }, 
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
});

await Volunteer.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default Volunteer