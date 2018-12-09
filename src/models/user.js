const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { notEmpty: true }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { notEmpty: true, isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [7, 42] }
    }
  })

  User.associate = models => {
    User.hasMany(models.Book, { onDelete: 'CASCADE' })
  }

  User.findByLogin = async login => {
    let user = await User.findOne({ where: { username: login } })

    if (!user) {
      user = await User.findOne({ where: { email: login } })
    }

    return user
  }

  return User
}

export default user
