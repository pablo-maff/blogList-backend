const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    for (let user of helper.initialUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10)

      const newUser = new User({
        username: user.username,
        name: user.name,
        passwordHash,
      })

      await newUser.save()
    }
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = helper.postNewUser

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with statuscode 400 and proper error message if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'root user',
      password: 'password',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Username must be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails with statuscode 400 and proper error if username and password are not at least 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUserBadUsername = {
      username: 'ro',
      name: 'root user',
      password: 'password',
    }

    const result1 = await api
      .post('/api/users')
      .send(newUserBadUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result1.body.error).toContain(
      'Username and Password must be provided and they must be at least 3 characters long'
    )

    const newUserBadPassword = {
      username: 'rooot',
      name: 'root user',
      password: 'pa',
    }

    const result2 = await api
      .post('/api/users')
      .send(newUserBadPassword)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result2.body.error).toContain(
      'Username and Password must be provided and they must be at least 3 characters long'
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails with statuscode 400 and proper error message if username and password are not provided', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUserNoUsername = {
      name: 'root user',
      password: 'password',
    }

    const result1 = await api
      .post('/api/users')
      .send(newUserNoUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result1.body.error).toContain(
      'Username and Password must be provided and they must be at least 3 characters long'
    )

    const newUserNoPassword = {
      username: 'rooot',
      name: 'root user',
    }

    const result2 = await api
      .post('/api/users')
      .send(newUserNoPassword)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result2.body.error).toContain(
      'Username and Password must be provided and they must be at least 3 characters long'
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})
