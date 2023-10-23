import { User } from '../Entities/User'
import * as bcrypt from 'bcrypt'
import { UserSignupInput } from '../Inputs/UserSignupInput'
import { v4 } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { LoginInput } from '../Inputs/LoginInput'
import { UserRefreshToken } from '../Entities/UserRefreshToken'
import { UserValidation } from '../Validators/UserInputValidation'
import { UserExistsError } from '../Errors/UserExistsError'
import { UserSignUpValidationError } from '../Errors/UserSignUpValidationError'
import { UserDoesNotExistsError } from '../Errors/UserDoesNotExistError'
import { Tokens } from '../Types/2faTokens'
import { InvalidPasswordError } from '../Errors/InvalidPasswordError'

export class UserService {
	private static DoesUserExist(user: UserRefreshToken | User | null): boolean {
		if (!user) {
			return false
		}
		return true
	}

	public static async Login (
		{ email, password }: LoginInput,
	): Promise<Tokens | Error> {
		try {
			const userFromDb = await User.findOne({ where: { email } })

			if(!this.DoesUserExist(userFromDb)){
				return new UserDoesNotExistsError('User does not exist')
			}
			
			const isPasswordValid = await bcrypt.compare(password, userFromDb.password)
		
			if (!isPasswordValid){
				return new InvalidPasswordError('Invalid password!')
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

			const tokens: Tokens = {
				accessToken: accessToken,
				refreshToken: refreshToken
			}

			return tokens
		} catch (error) {
			return new Error( error ) 
		}
	}
	
	public static async SignUp (
		input: UserSignupInput,
	): Promise<User | Error> {
		try {
			const userFromDb = await User.findOne({ where: { email: input.email } })
	
			if (userFromDb) {
				return new UserExistsError('User exists')
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
				return new UserSignUpValidationError('Validation failed', errorList.errors)
			}
	
			newUser.password = hashedPassword

			await newUser.save()
	
			return newUser
		} catch (error) {
			return new Error( error ) 
		}
	}
	

	public static async Token (
		refreshTokenFromRequest: string
	): Promise<{accessToken: string} | Error> {
		let accessTokenRet: string = ''
		try {
			const userFromDb = await UserRefreshToken.findOne({
				relations: ['user'],
				where: { refreshToken: refreshTokenFromRequest },
			})
			
			if(!this.DoesUserExist(userFromDb)){
				return new UserDoesNotExistsError('User does not exist')
			}
			
			jwt.verify(
				userFromDb.refreshToken,
				process.env.JWT_SECRET_KEY_REFRESH,
				(error) => {
					if (error) {
						return new Error('Token error')
					}
					const accessToken = jwt.sign(
						{ email: userFromDb.user.email },
						process.env.JWT_SECRET_KEY_ACCESS,
						{ expiresIn: '30s' }
					)
					accessTokenRet = accessToken
				}
			)

			return {accessToken: accessTokenRet}
		} catch (error) {
			return new Error(error)
		}
	}
}