import cors from 'cors'
import express from 'express'
import { ApolloServer, gql } from 'apollo-server-express'

const app = express()
app.use(cors())

const schema = gql`
  type Query {
    user(id: ID!): User
    users: [User!]
    books: [Book!]!
    book(id: ID!): Book
  }

  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
  }

  type Book {
    id: ID!
    author: String!
    title: String!
    currentChapter: Int!
    chapters: Int!
    currentPage: Int!
    pages: Int!
  }
`

const users = {
  sdjlafjsd: {
    id: 'sdjlafjsd',
    username: 'spinelli',
    email: 'spinell@gmail.com',
    password: 'spinellitortellini'
  },
  ldsjafjls: {
    id: 'ldsjafjls',
    username: 'vlassel',
    email: 'spinell@gmail.com',
    password: 'lasseltassel'
  }
}

const books = {
  sdjlafjsd: {
    id: 'sdjlafjsd',
    author: 'Ashley Spinell',
    title: '4th Grade War Stories',
    currentChapter: 5,
    chapters: 12,
    currentPage: 79,
    pages: 231
  },
  ldsjafjls: {
    id: 'ldsjafjls',
    author: 'Vince Lassel',
    title: 'School Legend',
    currentChapter: 8,
    chapters: 15,
    currentPage: 153,
    pages: 275
  }
}

const resolvers = {
  Query: {
    user: (parent, args) => users[args.id],
    users: () => Object.values(users),
    books: () => Object.values(books),
    book: (parent, args) => books[args.id]
  }
}

const server = new ApolloServer({
  typeDefs: schema,
  resolvers
})

server.applyMiddleware({ app, path: '/graphql' })

app.listen({ port: 8000 }, () => {
  console.log('Apollo Server on https://localhost:8000/graphql')
})
