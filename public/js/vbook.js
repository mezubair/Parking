

document.getElementById('inTime').addEventListener('change', calculateCharges);
document.getElementById('outTime').addEventListener('change', calculateCharges);

function calculateCharges() {



    fetch('/vbook', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },


    })
        .then(response => response.json())
        .then(data => {

            const inTime = new Date(document.getElementById('inTime').value);
            const outTime = new Date(document.getElementById('outTime').value);
            const ratePerHour = data.ratePerHour;// Change this rate per hour as needed

            const minutes = (outTime - inTime) / (1000 * 60); // Calculate minutes
            const hours = Math.floor(minutes / 60); // Calculate hours
            const remainingMinutes = minutes % 60; // Calculate remaining minutes

            const charge = (hours * ratePerHour) + (remainingMinutes * (ratePerHour / 60));
            const charges = Math.floor(charge);

            if (!isNaN(charges) && charges >= 0) {
                document.getElementById('charges').value = charges.toFixed(2); // Display up to 2 decimal places
            } else {
                document.getElementById('charges').value = '';
            }

        });


}