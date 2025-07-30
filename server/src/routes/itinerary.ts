import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ItinerarySchema, ItineraryUpdateSchema } from '../schemas';
import { validateRequest } from '../middleware/validate';
import { Itinerary } from '../types';

const router = Router();
const itineraries: Itinerary[] = [];

// Create
router.post('/', validateRequest(ItinerarySchema), (req, res) => {
  const itinerary: Itinerary = {
    id: uuidv4(),
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
router.put('/:id', validateRequest(ItineraryUpdateSchema), (req, res) => {
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

export default router; 