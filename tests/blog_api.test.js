const mongoose = require('mongoose')
//import { agent as supertest } from 'supertest'
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const Blog = require('../models/blog')
const { describe } = require('eslint/lib/rule-tester/rule-tester')

const api = supertest.agent(app)

beforeAll(async () => {
  const response = await api.post('/api/login').send({
    username: 'pmaff',
    password: 'pabpass',
  })
  api.auth(response.body.token, { type: 'bearer' })
})

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObject = helper.initialBlogs
  const promiseArray = blogObject.map((blog) =>
    api.post('/api/blogs').send(blog)
  )
  await Promise.all(promiseArray)
})

describe('When there are blogs already saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs').expect(200)

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('identifier is named "id"', async () => {
    const response = await api.get('/api/blogs').expect(200)

    expect(response.body[0].id).toBeDefined()
  })
})

describe('Adding a new blog post', () => {
  test('is succesfully created', async () => {
    await api.post('/api/blogs').send(helper.postNewBlog).expect(201)

    expect(await helper.blogsInDb()).toHaveLength(
      helper.initialBlogs.length + 1
    )
  })

  test('saves its content', async () => {
    await api
      .post('/api/blogs')
      .send(helper.postNewBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()
    delete blogs.at(-1).id
    delete blogs.at(-1).user
    expect(blogs).toContainEqual(helper.postNewBlog)
  })

  test('if likes property is missing, default value is 0', async () => {
    let toPost = helper.postNewBlog
    delete toPost.likes

    await api.post('/api/blogs').send(toPost).expect(201)

    const blogs = await helper.blogsInDb()
    expect(blogs.at(-1)).toHaveProperty('likes', 0)
  })

  test('if title and url properties are missing, return 400 Bad Request', async () => {
    let toPost = helper.postNewBlog
    delete toPost.title
    delete toPost.url

    await api.post('/api/blogs').send(toPost).expect(400)
  })
})

describe('Deleting a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api.delete(`/api/blogs/${invalidId}`).expect(400)
  })

  test('blog is effectively deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api.delete(`/api/blogs/${blogToDelete.id}`)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
    expect(blogsAtEnd).not.toContainEqual(blogToDelete)
  })
})

describe('Viewing a specific blog', () => {
  test('succeeds if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = {
      ...blogsAtStart[0],
      user: blogsAtStart[0].user.toString(),
    }

    const reqBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const resBlog = { ...reqBlog.body, user: reqBlog.body.user.toString() }

    expect(blogToView).toEqual(resBlog)
  })

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingId()

    await api.get(`/api/blogs/${validNonExistingId}`).expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api.get(`/api/blogs/${invalidId}`).expect(400)
  })
})

describe('Updating a blog', () => {
  test('succeed with statuscode 200 if blog is succesfully updated', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = {
      ...blogsAtStart[0],
      user: blogsAtStart[0].user.toString(),
      likes: 23,
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const updatedBlog = {
      ...blogsAtEnd[0],
      user: blogsAtStart[0].user.toString(),
    }

    expect(updatedBlog).toEqual(blogToUpdate)
  })

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingId()
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    await api
      .put(`/api/blogs/${validNonExistingId}`)
      .send(blogToUpdate)
      .expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    await api.put(`/api/blogs/${invalidId}`).send(blogToUpdate).expect(400)
  })
})

describe('Author', () => {
  test('with most blogs', async () => {
    const blogs = await helper.blogsInDb()
    const mostBlogs = helper.mostBlogs(blogs)

    expect(mostBlogs).toMatchObject({
      author: 'Dummy author',
      blogs: 2,
    })
  })

  test('with most likes', async () => {
    const blogs = await helper.blogsInDb()
    const mostLikes = helper.mostLikes(blogs)

    expect(mostLikes).toMatchObject({
      author: 'Dummy author',
      likes: 12,
    })
  })
})

afterAll(() => {
  mongoose.connection.close()
})
