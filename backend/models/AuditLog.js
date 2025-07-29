module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    logId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for system actions
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Action cannot be empty.' },
      },
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., 'Shop', 'Payment', 'Permit'
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true, // ID of the affected entity
    },
    oldValues: {
      type: DataTypes.JSON,
      allowNull: true, // Previous values before change
    },
    newValues: {
      type: DataTypes.JSON,
      allowNull: true, // New values after change
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    indexes: [
      { unique: true, fields: ['logId'] },
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['entityType'] },
      { fields: ['timestamp'] },
    ],
  });

  return AuditLog;
};