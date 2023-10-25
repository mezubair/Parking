// routes.js

const express = require('express');
const router = express.Router();

// Sample parking lot data (replace with your data source)
const parkingLots = [
    {
        id: 1,
        name: 'Parking Lot A',
        location: 'Srinagar lalchowk',
        availableSpots: 10,
        totalSpots: 20,
        price: 10.0,
    },
    {
        id: 2,
        name: 'Parking Lot B',
        location: 'Srinagar batamaloo',
        availableSpots: 5,
        totalSpots: 15,
        price: 8.0,
    },
    // Add more parking lot data as needed
];

// Define a route to get parking lot data by location
router.get('/api/parking-lots', (req, res) => {
    const location = req.query.location;
    if (!location) {
        res.status(400).json({ error: 'Location is required' });
        return;
    }

    // Replace with your logic to fetch parking lot data by location
    const matchingLots = parkingLots.filter((lot) =>
        lot.location.toLowerCase().includes(location.toLowerCase())
    );

    if (matchingLots.length === 0) {
        res.status(404).json({ error: 'No matching parking lots found' });
    } else {
        res.json({ parkingLots: matchingLots });
    }
});

// Define a route to get parking lot details by ID
router.get('/api/parking-lots/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const parkingLot = parkingLots.find((lot) => lot.id === id);

    if (!parkingLot) {
        res.status(404).json({ error: 'Parking lot not found' });
    } else {
        res.json({ parkingLot });
    }
});

module.exports = router;
