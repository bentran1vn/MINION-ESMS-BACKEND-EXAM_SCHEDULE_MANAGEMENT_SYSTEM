import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import User from "./User.js";

let tableName = 'lecturers'

const Lecturer = sequelize.define( tableName , {
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: User,
            key: 'id'
        }
    }, 
    lecId:{
        type: DataTypes.STRING(8),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
    }   
    //0 is not busy
    //1 is busy
});

User.hasOne(Lecturer, { foreignKey: 'userId' });
Lecturer.belongsTo(User, { foreignKey: 'userId' });

await Lecturer.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default Lecturer