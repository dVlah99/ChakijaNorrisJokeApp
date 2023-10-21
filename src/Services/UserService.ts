import { User } from '../Entities/User'
import * as bcrypt from 'bcrypt'
import { UserSignupInput } from '../Inputs/UserSignupInput'
import { v4 } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { LoginInput } from '../Inputs/LoginInput'
import { Response } from 'express'
import { UserRefreshToken } from '../Entities/UserRefreshToken'
import { UserValidation } from '../Validators/UserInputValidation'
import { isObject } from 'class-validator'

export class UserService {
	private static DoesUserExists(user: UserRefreshToken | User | null): boolean{
		if(!user){
			throw new Error('User not found!')
		}

		return true
	} 

	public static async Login (
		{ email, password }: LoginInput,
		res: Response
	): Promise<boolean> {
		try {
			const userFromDb = await User.findOne({ where: { email } })

			this.DoesUserExists(userFromDb)
			
			const isPasswordValid = await bcrypt.compare(password, userFromDb.password)
		
			if (!isPasswordValid){
				throw new Error('Invalid password!')
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
			if(error == 'Error: User not found!') {
				res.status(404).json({ message: 'User not found!'})
			} else if (error == 'Error: Invalid password!') {
				res.status(404).json({ message: 'Invalid password!'})
			} else {
				res.status(500).json({ message: 'Internal server error' })
			}
		}
	}

	public static async SignUp (
		input: UserSignupInput,
		res: Response
	): Promise<boolean>{
		try {
			const userFromDb = await User.findOne({ where: { email: input.email } })
			if (userFromDb){
				res.status(400).json({ message: 'User already exists' })

				return false
			}
			
			const hashedPassword = await bcrypt.hash(input.password, 10)
			const newUser = new User()

			newUser.id = v4()
			newUser.firstName = input.firstName
			newUser.lastName = input.lastName
			newUser.email = input.email
			newUser.password = hashedPassword
			await UserValidation.userValidation(newUser)

			await newUser.save()

			res.status(201).json({ message: 'User created successfully' })

			return true
		} catch (error) {
			if(isObject(error)) {
				res.status(500).json(JSON.stringify(error, null, 2))
			} else {
				res.status(500).json(JSON.stringify(error))
			}
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
			
			this.DoesUserExists(userFromDb)
			
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
			if(error == 'Error: User not found!') {
				res.status(404).json({ message: 'User not found!'})
			} else {
				res.status(500).json({ message: 'Internal server error' })
			}
		}
	}
}