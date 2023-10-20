import { User } from '../Entities/User'
import * as bcrypt from 'bcrypt'
import { UserSignupInput } from '../Inputs/UserSignupInput'
import { v4 } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { LoginInput } from '../Inputs/LoginInput'
import { Response } from 'express'
import { UserRefreshToken } from '../Entities/UserRefreshToken'

export class UserService {
	private static UserExists(user: UserRefreshToken | User): boolean{
		if(!user){
			return false
		}

		return true
	} 

	public static async Login (
		{ email, password }: LoginInput,
		res: Response
	): Promise<boolean> {
		try {
			const userFromDb = await User.findOne({ where: { email } })

			this.UserExists(userFromDb) ? true : res.status(404).json({ message: 'User not found' })

			const isPasswordValid = await bcrypt.compare(password, userFromDb.password)
			if (!isPasswordValid){
				res.status(401).json({ message: 'Invalid password' })
				return false
			}
		
			const accessToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY_ACCESS, {
				expiresIn: '20s',
			})

			const refreshToken = jwt.sign(email, process.env.JWT_SECRET_KEY_REFRESH)
			const refreshTokenFromDb = await UserRefreshToken.findOne({
				where: { refreshToken: refreshToken },
			})

			if (!refreshTokenFromDb) {
				const newRefreshToken = new UserRefreshToken()
				newRefreshToken.id = v4()
				newRefreshToken.refreshToken = refreshToken
				newRefreshToken.userId = userFromDb.id

				await newRefreshToken.save()
			}
			res.status(201).json({ accessToken, refreshToken })

			return true
		} catch (error) {
			console.error('Error logging in:', error)
			res.status(500).json({ message: 'Internal server error' })
		}
	}

	public static async SignUp (
		{ firstName, lastName, email, password }: UserSignupInput,
		res: Response
	): Promise<boolean>{
		try {
			const userFromDb = await User.findOne({ where: { email } })
			if (userFromDb){
				res.status(400).json({ message: 'User already exists' })

				return false
			}
				
			const hashedPassword = await bcrypt.hash(password, 10)
			const newUser = new User()

			newUser.id = v4()
			newUser.firstName = firstName
			newUser.lastName = lastName
			newUser.email = email
			newUser.password = hashedPassword
			await newUser.save()
			res.status(201).json({ message: 'User created successfully' })

			return true
		} catch (error) {
			console.error('Error signing up:', error)
			res.status(500).json({ message: 'Internal server error' })
		}
	}

	public static async Token (
		res: Response,
		refreshTokenFromRequest: string
	): Promise<boolean> {
		try {
			const userFromDb = await UserRefreshToken.findOne({
				relations: ['user'],
				where: { refreshToken: refreshTokenFromRequest },
			})

			this.UserExists(userFromDb) ? true : res.status(404).json({ message: 'User not found' })
			jwt.verify(
				userFromDb.refreshToken,
				process.env.JWT_SECRET_KEY_REFRESH,
				(error) => {
					if (error) return res.sendStatus(403)
					const accessToken = jwt.sign(
						{ email: userFromDb.user.email },
						process.env.JWT_SECRET_KEY_ACCESS,
						{ expiresIn: '30s' }
					)
					res.json({ accessToken })
				}
			)
			res.status(201).json({ message: 'User created successfully' })

			return true
		} catch (error) {
			console.error('Verification error: ', error)
			res.status(500).json({ message: 'Internal server error' })

		}
	}
}