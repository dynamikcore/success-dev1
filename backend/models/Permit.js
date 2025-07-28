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
  }, {
    hooks: {
      beforeCreate: (permit) => {
        // Calculate expiry status based on dates
        const now = new Date();
        const expiryDate = new Date(permit.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          permit.permitStatus = 'Expired';
        } else if (daysUntilExpiry <= 30) {
          permit.permitStatus = 'Active'; // Will be marked as expiring soon in frontend
        }
      }
    },
    indexes: [
      { unique: true, fields: ['permitId'] },
      { fields: ['shopId'] },
      { fields: ['permitType'] },
      { fields: ['issueDate'] },
      { fields: ['expiryDate'] },
      { fields: ['permitStatus'] },
    ],
  });
  Permit.associate = (db) => {
    Permit.belongsTo(db.Shop, { foreignKey: 'shopId' });
  };

  return Permit;
};