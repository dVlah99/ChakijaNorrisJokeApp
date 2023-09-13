import { User } from '../Entities/User'
import * as bcrypt from 'bcrypt'
import { UserInputType } from '../Inputs/UserInput'
import { v4 } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { LoginInput } from '../Inputs/LoginInput'
import { Response } from 'express'
import { UserRefreshToken } from '../Entities/UserRefreshToken'

export class UserService {
  public static Login = async (
    { email, password }: LoginInput,
    res: Response
  ) => {
    const userFromDb = await User.findOne({ where: { email } })
    if (!userFromDb) return res.status(404).json({ message: 'User not found' })
    const isPasswordValid = await bcrypt.compare(password, userFromDb.password)
    if (!isPasswordValid)
      return res.status(401).json({ message: 'Invalid password' })

    const accessToken = jwt.sign({email}, process.env.JWT_SECRET_KEY_ACCESS, {
      expiresIn: '20s',
    })
    const refreshToken = jwt.sign(email, process.env.JWT_SECRET_KEY_REFRESH)
    const newRefreshToken = new UserRefreshToken()
    newRefreshToken.id = v4()
    newRefreshToken.refreshToken = refreshToken
    newRefreshToken.userFk = userFromDb.id

    await newRefreshToken.save()

    res.status(201).json({ accessToken, refreshToken })
  }

  public static SignUp = async (
    { firstName, lastName, email, password }: UserInputType,
    res: Response
  ) => {
    try {
      const userFromDb = await User.findOne({ where: { email } })
      if (userFromDb)
        return res.status(400).json({ message: 'User already exists' })

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = new User()
      newUser.id = v4()
      newUser.firstName = firstName
      newUser.lastName = lastName
      newUser.email = email
      newUser.password = hashedPassword

      await newUser.save()

      res.status(201).json({ message: 'User created successfully' })
    } catch (error) {
      console.error('Error signing up:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }

  public static Token = async (
    res: Response,
    refreshTokenFromRequest: string
  ) => {
    jwt.verify(
      refreshTokenFromRequest,
      process.env.JWT_SECRET_KEY_REFRESH,
      (error, user: any) => {
        if (error) return res.sendStatus(403)
        const accessToken = jwt.sign(
          { email: user.email },
          process.env.JWT_SECRET_KEY_ACCESS,
          {expiresIn: '30s'}
        )
        res.json({ accessToken })
      }
    )
  }
}
