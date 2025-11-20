"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const schemas_1 = require("../schemas");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
const itineraries = [];
// Create
router.post('/', (0, validate_1.validateRequest)(schemas_1.ItinerarySchema), (req, res) => {
    const itinerary = {
        id: (0, uuid_1.v4)(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    itineraries.push(itinerary);
    res.status(201).json(itinerary);
});
// Read all
router.get('/', (req, res) => {
    res.json(itineraries);
});
// Read one
router.get('/:id', (req, res) => {
    const itinerary = itineraries.find(i => i.id === req.params.id);
    if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
    }
    res.json(itinerary);
});
// Update
router.put('/:id', (0, validate_1.validateRequest)(schemas_1.ItineraryUpdateSchema), (req, res) => {
    const index = itineraries.findIndex(i => i.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'Itinerary not found' });
    }
    itineraries[index] = {
        ...itineraries[index],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    res.json(itineraries[index]);
});
// Delete
router.delete('/:id', (req, res) => {
    const index = itineraries.findIndex(i => i.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'Itinerary not found' });
    }
    itineraries.splice(index, 1);
    res.status(204).send();
});
exports.default = router;
