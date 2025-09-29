import express from 'express';

import { authenticateUser } from './middleware/auth.js';

const router = express.Router();

// GET route
router.get('/users', async (req, res) => {
  try {
    const users = await getUsersFromDatabase();
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST route with middleware
router.post('/users', authenticateUser, async (req, res) => {
  try {
    const newUser = await createUser(req.body);
    res.status(201).json(newUser);
  } catch {
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// PUT route
router.put('/users/:id', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updatedUser = await updateUser(userId, req.body);
    res.json(updatedUser);
  } catch {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// DELETE route
router.delete('/users/:id', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await deleteUser(userId);
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

export default router;
