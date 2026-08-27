module.exports = async (_req, res) => {
  const paymentLink = process.env.AI_REVIEW_PAYMENT_LINK;

  if (!paymentLink) {
    return res.redirect(302, '/contact?enquiry=ai-website-review');
  }

  return res.redirect(302, paymentLink);
};
