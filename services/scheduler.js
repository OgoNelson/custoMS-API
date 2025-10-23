const cron = require("node-cron");
const Company = require("../model/company.model");
const Customer = require("../model/customer.model");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const {
  birthdayEmailTemplate,
  birthdaySMSTemplate,
} = require("./birthdayTemplate");

// Runs every day at 8 AM
cron.schedule("0 8 * * *", async () => {
  console.log("🎂 Birthday scheduler running...");

  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();

  try {
    const companies = await Company.find();

    for (const company of companies) {
      const customers = await Customer.find({
        companyId: company._id,
        $expr: {
          $and: [
            { $eq: [{ $dayOfMonth: "$birthday" }, day] },
            { $eq: [{ $month: "$birthday" }, month + 1] },
          ],
        },
      });

      for (const customer of customers) {
        if (company.gmailRefreshToken) {
          const { subject, message } = birthdayEmailTemplate(company, customer);
          await sendEmail(company, customer, subject, message);
        }

        if (company.smsEnabled) {
          const message = birthdaySMSTemplate(company, customer);
          await sendSMS(company, customer, message);
        }
      }
    }
  } catch (error) {
    console.error("Scheduler error:", error);
  }
});
