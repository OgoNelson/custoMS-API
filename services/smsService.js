const africastalking = require("africastalking");
const SMSLog = require("../model/smsLogModel");
const CryptoHelper = require("../utils/cryptoHelper");

const sendSMS = async (company, customer, message) => {
  try {
    if (!company.smsEnabled || !company.smsApiKey || !company.smsUsername) {
      throw new Error("SMS not enabled for this company");
    }

    //Decrypting the apikey
    const smsApiKey = CryptoHelper.decrypt(company.smsApiKey);

    const at = africastalking({
      apiKey: smsApiKey,
      username: company.smsUsername,
    });

    const sms = at.SMS;

    await sms.send({
      to: [customer.phone],
      message,
    });

    await SMSLog.create({
      company: company._id,
      customer: customer._id,
      message,
      status: "sent",
    });

    return { success: true };
  } catch (error) {
    console.error("SMS sending failed:", error);

    await SMSLog.create({
      company: company._id,
      customer: customer._id,
      message,
      status: "failed",
    });

    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
