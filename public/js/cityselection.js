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

// JavaScript code in your existing .js file
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

                    const table = document.getElementById('parkingLotsTable');

                    // Find the table body where rows will be added
                    const tbody = table.querySelector('tbody');

                    if (data.parkingLots.length > 0) {
                        // Clear existing content
                        tbody.innerHTML = '';

                        data.parkingLots.forEach((lot, index) => {
                            const row = tbody.insertRow();
                            const availableSpots = lot.totalSpots > 0 ? lot.totalSpots : "No spots available"; // Determine the available spots
                            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${lot.name}</td>
                <td>${lot.chargesPerHour}</td>
                <td>${lot.distance} km</td>
                <td>${availableSpots}</td>
                <td>
                ${lot.totalSpots > 0 ? `<a href="/vbook?lotId=${lot._id}" class="btn-outline-reg">Book Now</a>` : ''}
              </td>
            
            `;
                        });

                        // Show the table
                        table.style.display = 'table';
                    } else {
                        // If no parking lots found, hide the table and display a message
                        table.style.display = 'table';
                        tbody.innerHTML = `
            <tr>
                <td  colspan="5" rowspan="2">No parking lots found</td>
            </tr>
        `;
                    }
                    // Hide the loading message
                    loadingMessage.style.display = 'none';

                    // Populate the table with the fetched data

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
