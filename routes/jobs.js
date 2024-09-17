const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// In-memory job storage (to be replaced with a database later)
const jobs = [];

// POST route to create a new job
router.post('/post', authenticateToken, (req, res) => {
  const { title, description, location } = req.body;
  const newJob = {
    id: jobs.length + 1,
    title,
    description,
    location,
    postedBy: req.user.username
  };
  jobs.push(newJob);
  res.status(201).json(newJob);
});

// GET route to get all jobs
router.get('/', (req, res) => {
  res.json(jobs);
});

// GET route to get a specific job by ID
router.get('/:id', (req, res) => {
  const job = jobs.find(job => job.id === parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json(job);
});

module.exports = router;
