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
    if (navigator.geolocation) {
        const districtDropdown = document.getElementById('districtDropdown');
        const localityDropdown = document.getElementById('localityDropdown');
        const city = districtDropdown.options[districtDropdown.selectedIndex].value;
        const locality = localityDropdown.options[localityDropdown.selectedIndex].value;

        navigator.geolocation.getCurrentPosition(function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Send the location to the server using fetch or XMLHttpRequest
            // Example using fetch:
            fetch('/slotBooking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userLatitude: latitude, userLongitude: longitude, city: city, locality: locality })
            })
                .then(response => {
                    return response.json();
              
                })
                .catch(error => {
                    console.error('Error fetching parking lots:', error);
                    alert("Error while fetching parking lots. Please try again later.");
                });
        }, function (error) {
            console.error(error);
            alert("Unable to retrieve your location. Please enable location access and try again.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}



