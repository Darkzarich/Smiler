const router = require('express').Router();
const commentsController = require('../../controllers/comments');
const auth = require('../auth');

router.get('/', commentsController.getComment);

router.post('/', auth.required, commentsController.createComment);

router.put('/:id', auth.required, commentsController.editComment);

router.delete('/:id', auth.required, commentsController.deleteComment);

module.exports = router;
