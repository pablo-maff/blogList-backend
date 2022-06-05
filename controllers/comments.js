const commentsRouter = require('express').Router()

const Comment = require('../models/comment')
const Blog = require('../models/blog')

commentsRouter.get('/', (req, res) => {
  Comment.find({}).then((comments) => {
    res.json(comments)
  })
})

commentsRouter.post('/', async (req, res) => {
  const body = req.body

  const id = body.blogID
  const commentedBlog = await Blog.findById(id)

  if (!commentedBlog) return res.status(404).end()

  const comment = new Comment({
    content: body.content,
    blogID: body.blogID,
  })

  const savedComment = await comment.save()
  commentedBlog.comments = commentedBlog.comments.concat(savedComment)
  await commentedBlog.save()
  res.json(savedComment)
})

module.exports = commentsRouter
