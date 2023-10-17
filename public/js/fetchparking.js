document.getElementById('location-form').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const location = document.getElementById('location').value;
    fetch(`/api/parking-lots?location=${location}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            if (data.error) {
                displayErrorMessage(data.error);
            } else {
                displayParkingLots(data.parkingLots);
            }
        })
        .catch((error) => {
            console.error(error);
            displayErrorMessage('No parking lots found');
        });
});

function displayParkingLots(parkingLots) {
    const parkingLotsDiv = document.getElementById('parking-lots');
    parkingLotsDiv.innerHTML = ''; // Clear previous results

    if (parkingLots.length === 0) {
        parkingLotsDiv.innerHTML = 'No parking lots found.';
        return;
    }

    const list = document.createElement('ul');
    parkingLots.forEach((lot) => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${lot.name}</strong> - Location: ${lot.location}, Available Spots: ${lot.availableSpots}/${lot.totalSpots}, Price: $${lot.price} <button onclick="redirectToRegistration(${lot.id})">Book Now</button>`;
        list.appendChild(item);
    });

    parkingLotsDiv.appendChild(list);
}

function displayErrorMessage(message) {
    const parkingLotsDiv = document.getElementById('parking-lots');
    parkingLotsDiv.innerHTML = `<p>${message}</p>`;
}

function redirectToRegistration(lotId) {
    // Redirect the user to the registration form with the parking lot ID as a query parameter
    window.location.href = `/vbook?lotId=${lotId}`;
}

//--------------------------------------------------------------------------------------------------------------------

 // JavaScript code to handle form submission
 const urlParams = new URLSearchParams(window.location.search);
 const lotId = urlParams.get('lotId');
 document.getElementById('lotId').value = lotId;

 document.getElementById('registration-form').addEventListener('submit', function (e) {
     e.preventDefault();

     const formData = new FormData(this);

     // Send the registration data to the server for processing
     // You should implement server-side logic to handle the form data
     // Example: Use fetch() to send a POST request to your server endpoint.
     // Replace the URL below with your actual server endpoint.
     fetch('/api/register', {
         method: 'POST',
         body: formData
     })
     .then((response) => {
         if (!response.ok) {
             throw new Error('Network response was not ok');
         }
         return response.json();
     })
     .then((data) => {
         // Handle the response from the server (e.g., display a success message)
         console.log('Registration successful:', data.message);
     })
     .catch((error) => {
         console.error(error);
         // Handle any errors (e.g., display an error message to the user)
         alert('An error occurred during registration.');
     });
 });