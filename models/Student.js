import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import User from "./User.js";

let tableName = 'students'

const Student = sequelize.define(tableName, {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    uniId: {
        type: DataTypes.STRING(8),
        allowNull: false,
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    major: {
        type: DataTypes.STRING(30),
        allowNull: false,
    }
});

User.hasOne(Student, { foreignKey: 'userId' });
Student.belongsTo(User, { foreignKey: 'userId' });

await Student.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Student