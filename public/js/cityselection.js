function populateLocalities() {
    var districtDropdown = document.getElementById('districtDropdown');
    var localityDropdown = document.getElementById('localityDropdown');
    var district = districtDropdown.options[districtDropdown.selectedIndex].value;

    // Clear existing options
    localityDropdown.innerHTML = '';

    // Add new options based on the selected district
    if (district === 'district1') {
        var localities = ['Locality 1', 'Locality 2','Locality 3','Locality 4','Locality 5'];
    } else if (district === 'district2') {
        var localities = ['Budgam','Chadoora','Humhama','Kralpora','Panzan'];
    } else if (district === 'district3') {
        var localities = ['Batamaloo', 'Chanapora','Iqbal Park','Jahangir Chowk','Lal Chowk'];
    }

    // Add the new options to the locality dropdown
    for (var i = 0; i < localities.length; i++) {
        var option = document.createElement('option');
        option.text = localities[i];
        option.value = localities[i];
        localityDropdown.add(option);
    }
}

document.getElementById('searchButton').addEventListener('click', function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

function showPosition(position) {
    alert('Latitude: ' + position.coords.latitude + '\nLongitude: ' + position.coords.longitude);
    // You can perform further actions based on the user's location here.
}

// Populate the localities dropdown on page load if necessary
populateLocalities();


    document.getElementById('searchButton').addEventListener('click', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const selectedCity = document.getElementById('districtDropdown').value;
                const selectedLocality = document.getElementById('localityDropdown').value;
    
                // Send a request to the server
                fetch('/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ city: selectedCity, locality: selectedLocality })
                })
                .then(response => response.json())
                .then(data => {
                    // Use the data received from the server to display the list of parking lots
                    const parkingLotsTable = document.getElementById('parkingLotsTable');
                    parkingLotsTable.innerHTML = '';
            
                    data.forEach((parkingLot, index) => {
                        const row = `<tr>
                                        <td>${index + 1}</td>
                                        <td>${parkingLot.parkingLotName}</td>
                                        <td>${parkingLot.chargesPerHour}</td>
                                        <td>${calculateDistance(parkingLot.location.latitude, parkingLot.location.longitude, latitude, longitude)} km</td>
                                        <td><button onclick="bookNow('${parkingLot.id}')" class="btn btn-primary">Book Now</button></td>
                                    </tr>`;
                        parkingLotsTable.innerHTML += row;
                    });
                })
                .catch(error => console.error('Error:', error));
    });
    
    // Function to calculate the distance between two points
    function calculateDistance(lat1, lon1, lat2, lon2) {
        // Implement your logic to calculate the distance here
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)).toFixed(2);
    }
    
    // Function to handle the booking process
    function bookNow(parkingLotId) {
        // Implement your logic to handle the booking process here
        console.log(`Booking parking lot with id: ${parkingLotId}`);
    }
    
