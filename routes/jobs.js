const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

const pool = require('../config/db');

// In-memory job storage (to be replaced with a database later)
const jobs = [];

// POST route to create a new job
router.post('/post', authenticateToken, async (req, res) => {
  const { title, description, location } = req.body;
  const userId = req.user.id;

  try {
    const newJob = await pool.query(
      'INSERT INTO jobs (title, description, location, posted_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, location, userId]
    );
    res.status(201).json(newJob.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET route to get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await pool.query('SELECT * FROM jobs');
    res.json(jobs.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET route to get a specific job by ID
router.get('/:id', async (req, res) => {
  const jobId = parseInt(req.params.id);

  try {
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    );

    const job = jobResult.rows[0];

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
