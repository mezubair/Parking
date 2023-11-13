// razorpay.js

document.getElementById('payNowButton').addEventListener('click', async function() {
    // Fetch the amount from the charges input field
    var amount = document.getElementById('charges').value;
    document.getElementById('payNowButton').value = 'js';

    // Create a Razorpay order on the server side and get the order ID
    // Replace 'YOUR_SERVER_ENDPOINT' with the actual endpoint on your server
    try {
        const response = await fetch('/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                
                amount: amount,
            }),
        });

        const order = await response.json();

        // Open Razorpay checkout with the obtained order ID
        var options = {
            key: 'rzp_test_esJ9zn2E77SUXk', // Replace with your Razorpay API key
            amount: order.amount,
            currency: order.currency,
            name: 'ParKing',
            description: 'Parking Lot Registration',
            order_id: order.id,
            handler: function(response) {
                // Handle the success callback here

                console.log(response);

                // After successful payment, submit the payment form
                document.getElementById('paymentForm').submit();
            },
        };

        var rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
    }
});
