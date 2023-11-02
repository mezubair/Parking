// city selection.js
function populateLocalities() {
    var districtDropdown = document.getElementById('districtDropdown');
    var localityDropdown = document.getElementById('localityDropdown');
    var district = districtDropdown.options[districtDropdown.selectedIndex].value;

    // Clear existing options
    localityDropdown.innerHTML = '';

    // Add new options based on the selected district
    if (district === 'Anantnag') {
        var localities = ['Locality 1', 'Locality 2', 'Locality 3', 'Locality 4', 'Locality 5'];
    } else if (district === 'Budgam') {
        var localities = ['Budgam', 'Chadoora', 'Humhama', 'Kralpora', 'Panzan'];
    } else if (district === 'Srinagar') {
        var localities = ['Batamaloo', 'Chanapora', 'Iqbal Park', 'Jahangir Chowk', 'Lal Chowk'];
    }

    // Add the new options to the locality dropdown
    for (var i = 0; i < localities.length; i++) {
        var option = document.createElement('option');
        option.text = localities[i];
        option.value = localities[i];
        localityDropdown.add(option);
    }
}

function requestLocationAccess() {
    // Show the loading message
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'block';

    if (navigator.geolocation) {
        const districtDropdown = document.getElementById('districtDropdown');
        const localityDropdown = document.getElementById('localityDropdown');
        const city = districtDropdown.options[districtDropdown.selectedIndex].value;
        const locality = localityDropdown.options[localityDropdown.selectedIndex].value;

        navigator.geolocation.getCurrentPosition(function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Send the location to the server using fetch
            fetch('/slotBooking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userLatitude: latitude, userLongitude: longitude, city: city, locality: locality })
            })
                .then(response => response.json())
                .then(data => {
                    // Hide the loading message
                    loadingMessage.style.display = 'none';

                    // Display the data on your page
                    displayParkingLots(data);
                })
                .catch(error => {
                    console.error('Error fetching parking lots:', error);
                    alert("Error while fetching parking lots. Please try again later.");
                    // Hide the loading message in case of an error
                    loadingMessage.style.display = 'none';
                });
        }, function (error) {
            console.error(error);
            alert("Unable to retrieve your location. Please enable location access and try again.");
            // Hide the loading message in case of an error
            loadingMessage.style.display = 'none';
        });
    } else {
        alert("Geolocation is not supported by this browser.");
        // Hide the loading message in case of an error
        loadingMessage.style.display = 'none';
    }
}


function displayParkingLots(data) {
    const nearbyParkingLots = document.getElementById('nearbyParkingLots');
    nearbyParkingLots.innerHTML = ''; // Clear existing content

    if (data.parkingLots.length > 0) {
        const table = document.createElement('table');
        table.className = 'table';

        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['S.No.', 'Parking Lot Name', 'Price', 'Distance', 'Action'];

        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.innerText = headerText;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        data.parkingLots.forEach((lot, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${lot.name}</td>
                <td>${lot.chargesPerHour}</td>
                <td>${lot.distance}</td>
                <td><button onclick="bookNow('${lot.id}')" class="btn btn-primary">Book Now</button></td>
            `;
        });

        nearbyParkingLots.appendChild(table);
    } else {
        nearbyParkingLots.innerText = 'No parking lots found';
    }
}
