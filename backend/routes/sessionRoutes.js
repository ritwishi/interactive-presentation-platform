const express = require('express');
const router = express.Router();
const {
  createSession,
  joinSession,
  getSession,
  endSession,
} = require('../controllers/sessionController');

router.post('/create', createSession);
router.post('/join', joinSession);
router.get('/:code', getSession);
router.post('/:code/end', endSession);

module.exports = router;
