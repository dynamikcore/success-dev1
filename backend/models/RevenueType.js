module.exports = (sequelize, DataTypes) => {
  const RevenueType = sequelize.define('RevenueType', {
    typeId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    typeName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Revenue type name cannot be empty.' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    baseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    calculationMethod: {
      type: DataTypes.ENUM('Fixed', 'Percentage', 'Variable'),
      allowNull: false,
      defaultValue: 'Fixed',
    },
    frequency: {
      type: DataTypes.ENUM('Annual', 'Monthly', 'Quarterly', 'One-time'),
      allowNull: false,
      defaultValue: 'Annual',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  RevenueType.associate = (db) => {
    RevenueType.hasMany(db.Payment, { foreignKey: 'revenueTypeId' });
  };

  return RevenueType;
};