import Sequelize from 'sequelize'
import { combineResolvers } from 'graphql-resolvers'

import { isAuthenticated, isBookOwner } from './authorization'

const toCursorHash = string => Buffer.from(string).toString('base64')

const fromCursorHash = string => Buffer.from(string, 'base64').toString('ascii')

export default {
  Query: {
    myBooks: combineResolvers(
      isAuthenticated,
      async (
        _root,
        { input: { cursor, limit = 10 } },
        { user: { id }, models: { User, Book } }
      ) => {
        const fieldsObj = { userId: id }
        if (cursor) {
          fieldsObj['createdAt'] = { [Sequelize.Op.lt]: fromCursorHash(cursor) }
        }

        const bookCount = await Book.count({ where: { userId: id } })

        if (bookCount === 0) {
          return { bookCount }
        }

        const books = await Book.findAll({
          order: [['createdAt', 'DESC']],
          limit: limit + 1,
          where: fieldsObj
        })

        const hasNextPage = books.length > limit
        const edges = hasNextPage ? books.slice(0, -1) : books

        return {
          edges,
          pageInfo: {
            endCursor: toCursorHash(
              edges[edges.length - 1].createdAt.toString()
            ),
            hasNextPage
          },
          bookCount
        }
      }
    ),
    books: async (
      _root,
      { input: { cursor, limit = 50 } },
      { models: { Book } }
    ) => {
      const bookCount = await Book.count()

      const books = await Book.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        where: cursor
          ? { createdAt: { [Sequelize.Op.lt]: fromCursorHash(cursor) } }
          : null
      })

      const hasNextPage = books.length > limit
      const edges = hasNextPage ? books.slice(0, -1) : books

      return {
        edges,
        pageInfo: {
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString()),
          hasNextPage
        },
        bookCount
      }
    },
    book: async (_root, { id }, { models: { Book } }) => await Book.findByPk(id)
  },

  Mutation: {
    createBook: combineResolvers(
      isAuthenticated,
      async (
        _root,
        { input: { title, author, category, pages, chapters } },
        { user: { id }, models: { Book } }
      ) =>
        await Book.create({
          title,
          author,
          category,
          pages,
          chapters,
          userId: id
        })
    ),

    deleteBook: combineResolvers(
      isAuthenticated,
      isBookOwner,
      async (_root, { input: { id } }, { models: { Book } }) =>
        await Book.destroy({ where: { id } })
    ),

    editBook: combineResolvers(
      isAuthenticated,
      isBookOwner,
      async (_root, { input }, { models: { Book } }) => {
        const book = await Book.findOne({
          where: { id: input.id }
        })

        const {
          title: oldTitle,
          author: oldAuthor,
          category: oldCategory,
          chapters: oldChapters,
          pages: oldPages
        } = book._previousDataValues

        const {
          id,
          title = oldTitle,
          author = oldAuthor,
          category = oldCategory,
          chapters = oldChapters,
          pages = oldPages
        } = input

        return await book.update(
          {
            title,
            author,
            category,
            chapters,
            pages
          },
          { where: { id }, returning: true }
        )
      }
    ),
    updateBookMark: combineResolvers(
      isAuthenticated,
      isBookOwner,
      async (_root, { input }, { models: { Book } }) => {
        const book = await Book.findOne({
          where: { id: input.id }
        })

        const {
          currentPage: oldCurrentPage,
          currentChapter: oldCurrentChapter
        } = book._previousDataValues

        const {
          id,
          currentChapter = oldCurrentChapter,
          currentPage = oldCurrentPage
        } = input

        return await book.update(
          {
            currentChapter,
            currentPage
          },
          { where: { id }, returning: true }
        )
      }
    )
  },

  Book: {
    user: async (book, _args, { loaders: { user }, models: { User } }) =>
      await user.load(book.userId)
  }
}
