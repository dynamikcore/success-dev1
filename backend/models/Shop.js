const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Shop = sequelize.define('Shop', {
    shopId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Business name cannot be empty.' },
      },
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Owner name cannot be empty.' },
      },
    },
    ownerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Owner phone cannot be empty.' },
        is: { // Nigerian phone number format validation (basic example)
          args: /^(\+234|0)\d{10}$/,
          msg: 'Invalid Nigerian phone number format. Must be 0XXXXXXXXXX or +234XXXXXXXXXX.',
        },
      },
    },
    ownerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: { msg: 'Invalid email format.' },
      },
    },
    shopAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Shop address cannot be empty.' },
      },
    },
    ward: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Ward cannot be empty.' },
        // You might want to add a custom validator here to check against a list of valid Uvwie LGA wards
      },
    },
    businessType: {
      type: DataTypes.ENUM("Retail", "Restaurant", "Services", "Pharmacy", "Electronics", "Clothing", "Grocery", "Supermarket", "Bank", "Other"),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Business type cannot be empty.' },
      },
    },
    shopSizeCategory: {
      type: DataTypes.ENUM("Small", "Medium", "Large"),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Shop size category cannot be empty.' },
      },
    },
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    complianceStatus: {
      type: DataTypes.ENUM("Compliant", "Defaulter", "New"),
      allowNull: false,
      defaultValue: "New",
    },
    totalRevenuePaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
  }, {
    hooks: {
      beforeCreate: async (shop, options) => {
        const currentYear = new Date().getFullYear();
        const prefix = 'UVW/SHOP';
        // Find the last shopId for the current year to determine the next sequence number
        const lastShop = await Shop.findOne({
          order: [['shopId', 'DESC']],
          where: { shopId: { [DataTypes.Op.like]: `${prefix}/%/${currentYear}` } },
          paranoid: false // Include soft-deleted records if applicable
        });

        let nextSequence = 1;
        if (lastShop) {
          const lastIdParts = lastShop.shopId.split('/');
          const lastSequence = parseInt(lastIdParts[2], 10);
          if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
          }
        }
        const formattedSequence = String(nextSequence).padStart(3, '0');
        shop.shopId = `${prefix}/${formattedSequence}/${currentYear}`;
      },
    },
    indexes: [
      { unique: true, fields: ['shopId'] },
      { fields: ['businessName'] },
      { fields: ['ownerPhone'] },
      { fields: ['ownerEmail'] },
      { fields: ['ward'] },
      { fields: ['businessType'] },
      { fields: ['complianceStatus'] },
    ],
  });

  // Associations (example - no other models yet)
  // Shop.associate = (models) => {
  //   Shop.hasMany(models.Payment, { foreignKey: 'shopId' });
  // };

  return Shop;
};