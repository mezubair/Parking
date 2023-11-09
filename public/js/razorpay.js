// Function to calculate the payment amount based on the "Total Charges" field

function calculatePaymentAmount() {
    var totalChargesInput = document.getElementById('charges');
    var totalCharges = parseFloat(totalChargesInput.value) * 100; // Convert to paise
    if (isNaN(totalCharges) || totalCharges <= 0) {
        return 0;
    }
    return totalCharges;
}

// Function to initiate the Razorpay payment
function initiatePayment() {
    var calculatedAmount = calculatePaymentAmount();
    if (calculatedAmount === 0) {
        alert("Invalid payment amount. Please check the 'Total Charges' field.");
    } else {
        var options = {
            key: "rzp_test_05YP5NQEWOkIUp", // Replace with your Razorpay key
            amount: calculatedAmount,
            currency: "INR",
            name: "Your Company Name",
            description: "Payment for Services",
            image: "https://example.com/your_logo.png",
            order_id: "order_DaaS6LOUAASb7Y", // Replace with the actual order ID
            handler: function (response) {
                // Handle the response after payment
                // You can submit the form or perform other actions here
                document.getElementById('myForm').submit(); // Submit the form
            },
            prefill: {
                name: "User Name",
                email: "user@example.com",
                contact: "1234567890",
            },
        };

        var rzp = new Razorpay(options);
        rzp.open();
    }
}

// Add an event listener to the "Pay Now" button
document.getElementById('payNowButton').addEventListener('click', function (e) {
    e.preventDefault();
    initiatePayment();
});
