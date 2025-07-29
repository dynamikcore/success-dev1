const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Ensure all associations are properly set up
if (db.Payment && db.Shop) {
  db.Payment.belongsTo(db.Shop, { foreignKey: 'shopId' });
  db.Shop.hasMany(db.Payment, { foreignKey: 'shopId' });
}

if (db.Payment && db.RevenueType) {
  db.Payment.belongsTo(db.RevenueType, { foreignKey: 'revenueTypeId' });
  db.RevenueType.hasMany(db.Payment, { foreignKey: 'revenueTypeId' });
}

if (db.Permit && db.Shop) {
  db.Permit.belongsTo(db.Shop, { foreignKey: 'shopId' });
  db.Shop.hasMany(db.Permit, { foreignKey: 'shopId' });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;