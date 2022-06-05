const mongoose = require('mongoose')
const { MONGODB_URI } = require('./utils/config')
const logger = require('./utils/logger')
const Blog = require('./models/blog')

blogLogger = blog => {
  logger.info('\tTitle: ', blog.title)
  logger.info('\tAuthor:', blog.author)
  logger.info('\tURL:   ', blog.url)
  logger.info('\tLikes: ', blog.likes)
  logger.info('-'.repeat(50))
}

const title = process.argv[2]
const author = process.argv[3]
const url = process.argv[4]
const likes = process.argv[5]

mongoose.connect(MONGODB_URI)

if (process.argv.length >= 3) {
  const newBlog = new Blog({
    title: title,
    author: author,
    url: url,
    likes: likes
})
  newBlog.save().then(response => {
  logger.info('New blog created:')
  blogLogger(newBlog)
  mongoose.connection.close()
})
}

else {
  Blog.find({}).then(result => {
    logger.info('Blogs:')
    for (const blog of result) {
      blogLogger(blog)
    }
    mongoose.connection.close()
  })
}
