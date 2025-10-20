const birthdayEmailTemplate = (company, customer) => {
  const subject = `Happy Birthday, ${customer.name}! 🎉`;

  const message =
    company.customEmailMessage && company.customEmailMessage.trim() !== ""
      ? company.customEmailMessage
      : `Dear ${customer.name},\n\nAll of us at ${company.name} wish you a very Happy Birthday! 🥳\n\nWarm regards,\n${company.name}`;

  return { subject, message };
};

const birthdaySMSTemplate = (company, customer) => {
  return company.customSMSMessage && company.customSMSMessage.trim() !== ""
    ? company.customSMSMessage
        .replace("{name}", customer.name)
        .replace("{company}", company.name)
    : `Happy Birthday ${customer.name}! 🎉 Warm wishes from all of us at ${company.name}`;
};

module.exports = { birthdayEmailTemplate, birthdaySMSTemplate };
