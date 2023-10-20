import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import User from "./User.js";

let tableName = 'staffs'

const Staff = sequelize.define( tableName , {
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: User,
            key: 'id'
        }
    }, 
    staffId:{
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

User.hasOne(Staff, { foreignKey: 'userId' });
Staff.belongsTo(User, { foreignKey: 'userId' });

await Staff.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default Staff