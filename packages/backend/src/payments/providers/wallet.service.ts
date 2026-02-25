import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWalletTransactionDto } from '../dto/payment.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async getWalletBalance(userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        const newWallet = await this.prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            currency: 'USD',
            isActive: true,
          },
        });

        return {
          success: true,
          data: {
            balance: newWallet.balance,
            currency: newWallet.currency,
            isActive: newWallet.isActive,
          },
        };
      }

      return {
        success: true,
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          isActive: wallet.isActive,
        },
      };
    } catch (error) {
      this.logger.error('Error getting wallet balance:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createTransaction(transactionData: CreateWalletTransactionDto) {
    try {
      const { userId, amount, type, description, referenceId, recipientId } = transactionData;

      // Get user's wallet
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found',
        };
      }

      if (!wallet.isActive) {
        return {
          success: false,
          error: 'Wallet is not active',
        };
      }

      // Check balance for withdrawals and transfers
      if (type === 'withdraw' || type === 'transfer') {
        if (wallet.balance < amount) {
          return {
            success: false,
            error: 'Insufficient balance',
          };
        }
      }

      // For transfers, check recipient wallet
      let recipientWallet = null;
      if (type === 'transfer') {
        if (!recipientId) {
          return {
            success: false,
            error: 'Recipient ID is required for transfers',
          };
        }

        recipientWallet = await this.prisma.wallet.findUnique({
          where: { userId: recipientId },
        });

        if (!recipientWallet) {
          return {
            success: false,
            error: 'Recipient wallet not found',
          };
        }

        if (!recipientWallet.isActive) {
          return {
            success: false,
            error: 'Recipient wallet is not active',
          };
        }
      }

      // Create transaction record
      const transaction = await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          balance: wallet.balance,
          description,
          referenceId,
          recipientId,
          status: 'completed',
        },
      });

      // Update wallet balance
      let newBalance = wallet.balance;
      if (type === 'deposit') {
        newBalance += amount;
      } else if (type === 'withdraw' || type === 'transfer') {
        newBalance -= amount;
      }

      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // For transfers, update recipient wallet and create recipient transaction
      if (type === 'transfer' && recipientWallet) {
        const recipientNewBalance = recipientWallet.balance + amount;

        await this.prisma.wallet.update({
          where: { id: recipientWallet.id },
          data: { balance: recipientNewBalance },
        });

        // Create recipient transaction record
        await this.prisma.walletTransaction.create({
          data: {
            walletId: recipientWallet.id,
            type: 'receive',
            amount,
            balance: recipientWallet.balance,
            description: `Transfer from ${userId}`,
            referenceId: transaction.id,
            senderId: userId,
            status: 'completed',
          },
        });
      }

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          balance: newBalance,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
      };
    } catch (error) {
      this.logger.error('Error creating wallet transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found',
        };
      }

      const skip = (page - 1) * limit;

      const transactions = await this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      });

      return {
        success: true,
        data: {
          transactions: transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            balance: t.balance,
            description: t.description,
            status: t.status,
            referenceId: t.referenceId,
            recipientId: t.recipientId,
            senderId: t.senderId,
            createdAt: t.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error('Error getting transaction history:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTransactionDetails(transactionId: string, userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found',
        };
      }

      const transaction = await this.prisma.walletTransaction.findFirst({
        where: {
          id: transactionId,
          walletId: wallet.id,
        },
      });

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          balance: transaction.balance,
          description: transaction.description,
          status: transaction.status,
          referenceId: transaction.referenceId,
          recipientId: transaction.recipientId,
          senderId: transaction.senderId,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error('Error getting transaction details:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async activateWallet(userId: string) {
    try {
      const wallet = await this.prisma.wallet.update({
        where: { userId },
        data: { isActive: true },
      });

      return {
        success: true,
        data: {
          userId: wallet.userId,
          isActive: wallet.isActive,
        },
      };
    } catch (error) {
      this.logger.error('Error activating wallet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deactivateWallet(userId: string) {
    try {
      const wallet = await this.prisma.wallet.update({
        where: { userId },
        data: { isActive: false },
      });

      return {
        success: true,
        data: {
          userId: wallet.userId,
          isActive: wallet.isActive,
        },
      };
    } catch (error) {
      this.logger.error('Error deactivating wallet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async freezeWallet(userId: string, reason: string) {
    try {
      const wallet = await this.prisma.wallet.update({
        where: { userId },
        data: { 
          isActive: false,
          freezeReason: reason,
        },
      });

      return {
        success: true,
        data: {
          userId: wallet.userId,
          isActive: wallet.isActive,
          freezeReason: wallet.freezeReason,
        },
      };
    } catch (error) {
      this.logger.error('Error freezing wallet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async unfreezeWallet(userId: string) {
    try {
      const wallet = await this.prisma.wallet.update({
        where: { userId },
        data: { 
          isActive: true,
          freezeReason: null,
        },
      });

      return {
        success: true,
        data: {
          userId: wallet.userId,
          isActive: wallet.isActive,
          freezeReason: wallet.freezeReason,
        },
      };
    } catch (error) {
      this.logger.error('Error unfreezing wallet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getWalletStats(userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found',
        };
      }

      const totalDeposits = await this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: 'deposit',
          status: 'completed',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const totalWithdrawals = await this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: 'withdraw',
          status: 'completed',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const totalTransfersSent = await this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: 'transfer',
          status: 'completed',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const totalTransfersReceived = await this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: 'receive',
          status: 'completed',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      return {
        success: true,
        data: {
          currentBalance: wallet.balance,
          totalDeposits: totalDeposits._sum.amount || 0,
          depositCount: totalDeposits._count.id,
          totalWithdrawals: totalWithdrawals._sum.amount || 0,
          withdrawalCount: totalWithdrawals._count.id,
          totalTransfersSent: totalTransfersSent._sum.amount || 0,
          transfersSentCount: totalTransfersSent._count.id,
          totalTransfersReceived: totalTransfersReceived._sum.amount || 0,
          transfersReceivedCount: totalTransfersReceived._count.id,
          isActive: wallet.isActive,
          createdAt: wallet.createdAt,
        },
      };
    } catch (error) {
      this.logger.error('Error getting wallet stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}