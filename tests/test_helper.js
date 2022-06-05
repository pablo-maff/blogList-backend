const Blog = require('../models/blog')
const User = require('../models/user')
const _ = require('lodash')

const initialBlogs = [
  {
    title: 'First Dummy',
    author: 'Dummy author',
    url: 'https://dummy.com',
    likes: 5,
  },
  {
    title: 'Second Dummy',
    author: 'Second dummy author',
    url: 'https://dummy2.com',
    likes: 10,
  },
  {
    title: 'Third Dummy',
    author: 'Dummy author',
    url: 'https://dummy3.com',
    likes: 7,
  },
]

const postNewBlog = {
  title: 'New blog post',
  author: 'New author',
  url: 'https://new-post.com',
  likes: 2,
}

const nonExistingId = async () => {
  const blog = new Blog({ content: 'willremovethissoon' })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map((blog) => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map((u) => u.toJSON())
}

const initialUsers = [
  {
    username: 'root',
    name: 'root user',
    password: 'rootpass',
  },
  {
    username: 'pmaff',
    name: 'Pablo Maffioli',
    password: 'pabpass',
  },
]

const postNewUser = {
  username: 'nonSensePoetry',
  name: 'Edward Lear',
  password: 'Pobble',
}

const mostBlogs = (blogs) => {
  const topAuthor = _.chain(blogs)
    .groupBy('author')
    .map((group, author) => {
      return { author: author, blogs: group.length }
    })
    .maxBy((object) => object.blogs)
    .value()

  return topAuthor
}

const mostLikes = (blogs) => {
  const topAuthor = _.chain(blogs)
    .groupBy('author')
    .map((group, author) => {
      return {
        author: author,
        likes: group.reduce((prev, next) => {
          return (prev += next.likes)
        }, 0),
      }
    })
    .maxBy((object) => object.likes)
    .value()

  return topAuthor
}

module.exports = {
  initialBlogs,
  blogsInDb,
  nonExistingId,
  postNewBlog,
  usersInDb,
  initialUsers,
  postNewUser,
  mostBlogs,
  mostLikes,
}
