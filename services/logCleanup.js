const EmailLog = require("../model/emailLogModel");
const SMSLog = require("../model/smsLogModel");
const Company = require("../model/company.model");

// Clean up old logs for free plan companies (older than 30 days)
const cleanupOldLogs = async () => {
  try {
    console.log("🧹 Starting log cleanup for free plan companies...");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all free plan companies
    const freeCompanies = await Company.find({ subscriptionStatus: "free" });
    
    let totalEmailLogsDeleted = 0;
    let totalSMSLogsDeleted = 0;
    
    for (const company of freeCompanies) {
      // Delete old email logs
      const emailDeleteResult = await EmailLog.deleteMany({
        company: company._id,
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      // Delete old SMS logs
      const smsDeleteResult = await SMSLog.deleteMany({
        company: company._id,
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      totalEmailLogsDeleted += emailDeleteResult.deletedCount;
      totalSMSLogsDeleted += smsDeleteResult.deletedCount;
      
      if (emailDeleteResult.deletedCount > 0 || smsDeleteResult.deletedCount > 0) {
        console.log(`Cleaned up ${emailDeleteResult.deletedCount} email logs and ${smsDeleteResult.deletedCount} SMS logs for company: ${company.name}`);
      }
    }
    
    console.log(`✅ Log cleanup completed. Deleted ${totalEmailLogsDeleted} email logs and ${totalSMSLogsDeleted} SMS logs.`);
    
    return {
      success: true,
      emailLogsDeleted: totalEmailLogsDeleted,
      smsLogsDeleted: totalSMSLogsDeleted
    };
    
  } catch (error) {
    console.error("❌ Error during log cleanup:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { cleanupOldLogs };