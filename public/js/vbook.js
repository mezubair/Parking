// Replace with your Stripe public key
const stripePublicKey = 'your_stripe_public_key';
const stripe = Stripe(stripePublicKey);

document.getElementById('payNowButton').addEventListener('click', async () => {
  // Get the total charges from the 'charges' field
  const totalCharges = parseFloat(document.getElementById('charges').value) * 100; // Convert to cents

  // Use Stripe to create a payment intent
  const { clientSecret } = await fetch('/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: totalCharges, currency: 'usd' }),
  }).then((response) => response.json());

  // Use Stripe to handle the payment
  const { error } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement, // Replace with your card element
      // Add other payment method details if necessary
    },
  });

  if (error) {
    // Handle payment error (e.g., display an error message)
    console.error(error);
  } else {
    // Payment is successful, proceed to save the reservation data to the database
    document.getElementById('bookButton').click(); // Simulate clicking the 'Book' button to save data
  }
});

////////////////////////////////////



document.getElementById('inTime').addEventListener('change', calculateCharges);
        document.getElementById('outTime').addEventListener('change', calculateCharges);

        function calculateCharges() {
            const inTime = new Date(document.getElementById('inTime').value);
            const outTime = new Date(document.getElementById('outTime').value);
            const ratePerHour = 50; // Change this rate per hour as needed

            const minutes = (outTime - inTime) / (1000 * 60); // Calculate minutes
            const hours = Math.floor(minutes / 60); // Calculate hours
            const remainingMinutes = minutes % 60; // Calculate remaining minutes

            const charges = (hours * ratePerHour) + (remainingMinutes * (ratePerHour / 60));

            if (!isNaN(charges) && charges >= 0) {
                document.getElementById('charges').value = '₹' + charges.toFixed(2); // Display up to 2 decimal places
            } else {
                document.getElementById('charges').value = '';
            }
        }