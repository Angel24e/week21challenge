const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth')

const resolvers = {
  Query: {
    me: async (parent, context) => {
      try {
        if (context.user) {
          const userData = await User.findOne({ _id: context.user._id })
            .select('-__v -password');
          return userData;
        }
      } catch (err) {
        throw new AuthenticationError();
      }
    }
  },
  Mutation: {
    createUser: async (parent, { username, email, password }) => {
      try {
        const user = User.create({ username, email, password });
        const authToken = signToken(user);

        return { authToken, user }
      } catch (err) {
        console.log("Failed to add user")
      }
    },
    login: async (parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new AuthenticationError('Incorrect email or password');
        }
        const passwordCheck = await user.isCorrectPassword(password);
        if (!passwordCheck) {
          throw new AuthenticationError('Incorrect email or password');
        }
        const authToken = signToken(user);
        return { authToken, user };
      } catch (err) {
        throw new AuthenticationError('Failed to login');
      }
    },
    saveBook: async (parent, { input }, context) => {
      try {
        const updatedUser = User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: { savedBooks: input }
          },
          {
            new: true,
            runValidators: true,
          }
        );
        return updatedUser;
      } catch (err) {
        console.log("Failed to save book")
      }
    },
    deleteBook: async (parent, { bookId }, context) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          {_id: context.user._id},
          {$pull: {savedBooks: {bookId}}},
          {new:true}
        );     
        return updatedUser;
      } catch (err) {
        console.log("Failed to delete book")
      }
    },
  },
};

module.exports = resolvers;
