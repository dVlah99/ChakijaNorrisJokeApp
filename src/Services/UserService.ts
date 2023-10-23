import { User } from '../Entities/User'
import * as bcrypt from 'bcrypt'
import { UserSignupInput } from '../Inputs/UserSignupInput'
import { v4 } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { LoginInput } from '../Inputs/LoginInput'
import { Response } from 'express'
import { UserRefreshToken } from '../Entities/UserRefreshToken'
import { UserValidation } from '../Validators/UserInputValidation'

export class UserService {
	private static DoesUserExist(user: UserRefreshToken | User | null, res: Response): boolean {
		if (!user) {
			res.status(404).json({ message: 'User not found!'})
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

			if(!this.DoesUserExist(userFromDb, res)){
				return false
			}
			
			const isPasswordValid = await bcrypt.compare(password, userFromDb.password)
		
			if (!isPasswordValid){
				res.status(404).json({ message: 'Invalid password!'})
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
			res.status(500).json({ message: 'Internal server error' })
		}
	}
	
	public static async SignUp (
		input: UserSignupInput,
		res: Response
	): Promise<boolean> {
		try {
			const userFromDb = await User.findOne({ where: { email: input.email } })
			if (userFromDb) {
				res.status(400).json({ message: 'User already exists' })
				return false
			}
	
			const hashedPassword = await bcrypt.hash(input.password, 10)
			const newUser = new User()
	
			newUser.id = v4()
			newUser.firstName = input.firstName
			newUser.lastName = input.lastName
			newUser.email = input.email
			newUser.password = input.password
	
			const errorList = await UserValidation.validateUserInput(newUser)
		
			if (!errorList.isValid) {
				res.status(400).json({ message: 'Validation failed', errors: errorList.errors })
				return false
			}
	
			newUser.password = hashedPassword
			await newUser.save()
	
			res.status(201).json({ message: 'User created successfully' })
			return true
		} catch (error) {
			res.status(500).json({ message: 'Internal server error', error: error.message })
			return false
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
			
			if(!this.DoesUserExist(userFromDb, res)){
				return false
			}
			
			jwt.verify(
				userFromDb.refreshToken,
				process.env.JWT_SECRET_KEY_REFRESH,
				(error) => {
					if (error) {
						res.sendStatus(403)
						return false
					}
					const accessToken = jwt.sign(
						{ email: userFromDb.user.email },
						process.env.JWT_SECRET_KEY_ACCESS,
						{ expiresIn: '30s' }
					)
					
					res.json({ accessToken })
					return true
				}
			)

			return true
		} catch (error) {
			res.status(500).json({ message: 'Internal server error' })
		}
	}
}