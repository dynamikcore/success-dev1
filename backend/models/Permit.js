module.exports = (sequelize, DataTypes) => {
  const Permit = sequelize.define('Permit', {
    permitId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `PER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Shops',
        key: 'shopId',
      },
    },
    permitType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Permit type cannot be empty.' },
      },
    },
    permitFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    issuedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Issuer name cannot be empty.' },
      },
    },
    permitStatus: {
      type: DataTypes.ENUM('Active', 'Expired', 'Suspended', 'Pending'),
      allowNull: false,
      defaultValue: 'Active',
    },
    documentPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
  Permit.associate = (db) => {
    Permit.belongsTo(db.Shop, { foreignKey: 'shopId' });
  };

  return Permit;
};