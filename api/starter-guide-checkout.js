module.exports = async (_req, res) => {
  const paymentLink = process.env.AI_STARTER_GUIDE_PAYMENT_LINK;

  if (!paymentLink) {
    return res.redirect(302, '/contact?enquiry=ai-starter-guide');
  }

  return res.redirect(302, paymentLink);
};
