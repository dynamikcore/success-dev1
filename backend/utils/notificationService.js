const { Permit, Shop } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  static async checkExpiringPermits(daysAhead = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiringPermits = await Permit.findAll({
        where: {
          expiryDate: {
            [Op.between]: [new Date(), futureDate],
          },
          permitStatus: 'Active',
        },
        include: [
          { model: Shop, attributes: ['businessName', 'ownerName', 'ownerPhone'] }
        ],
      });

      return expiringPermits.map(permit => ({
        type: 'permit_expiry',
        permitId: permit.permitId,
        shopName: permit.Shop?.businessName,
        ownerName: permit.Shop?.ownerName,
        ownerPhone: permit.Shop?.ownerPhone,
        permitType: permit.permitType,
        expiryDate: permit.expiryDate,
        daysUntilExpiry: Math.ceil((new Date(permit.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
        message: `Your ${permit.permitType} permit expires on ${permit.expiryDate.toDateString()}. Please renew to avoid penalties.`
      }));
    } catch (error) {
      console.error('Error checking expiring permits:', error);
      return [];
    }
  }

  static async checkOverduePayments() {
    try {
      // This would require a more complex query to check for overdue payments
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error checking overdue payments:', error);
      return [];
    }
  }

  static async sendNotification(notification) {
    // In a real implementation, this would send SMS, email, or push notifications
    console.log('Notification:', notification);

    // For now, just log the notification
    // In production, integrate with SMS gateway, email service, etc.
    return {
      success: true,
      message: 'Notification logged',
      notification
    };
  }

  static async processAllNotifications() {
    try {
      const expiringPermits = await this.checkExpiringPermits();
      const overduePayments = await this.checkOverduePayments();

      const allNotifications = [...expiringPermits, ...overduePayments];

      for (const notification of allNotifications) {
        await this.sendNotification(notification);
      }

      return {
        success: true,
        processed: allNotifications.length,
        notifications: allNotifications
      };
    } catch (error) {
      console.error('Error processing notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = NotificationService;