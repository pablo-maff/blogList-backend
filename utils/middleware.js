const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Blog = require('../models/blog')

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'Unknwonw endpoint' })
}

const errorHandler = (error, req, res, next) => {
  if (error.name === 'CastError') {
    return res.status(400).send({
      error: 'malformatted id',
    })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: error.message,
    })
  } else if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'invalid token',
    })
  } else if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'token expired',
    })
  }

  logger.error(error.message)

  next(error)
}

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    const token = authorization.substring(7)

    req.token = jwt.verify(token, process.env.SECRET) // Verify token validity and decode token (returns the Object which the token was based on)
    if (!req.token.id) {
      return res.status(401).json({ error: 'Token missing or invalid' })
    }

    next()
  } else next()
}

const userExtractor = async (req, res, next) => {
  req.user = await User.findById(req.token.id)

  next()
}

const blogExtractor = async (req, res, next) => {
  req.blog = await Blog.findById(req.params.id)

  next()
}

module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  blogExtractor,
}
