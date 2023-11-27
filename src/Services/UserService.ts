import 'reflect-metadata'
import { User } from '../Entities/User.js'
import * as bcrypt from 'bcrypt'
import { UserSignupInput } from '../Inputs/UserSignupInput.js'
import { v4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { LoginInput } from '../Inputs/LoginInput.js'
import { UserRefreshToken } from '../Entities/UserRefreshToken.js'
import { UserValidation } from '../Validators/UserInputValidation.js'
import { UserExistsError } from '../Errors/UserExistsError.js'
import { UserSignUpValidationError } from '../Errors/UserSignUpValidationError.js'
import { UserDoesNotExistsError } from '../Errors/UserDoesNotExistError.js'
import { Tokens } from '../Types/2faTokens.js'
import { InvalidPasswordError } from '../Errors/InvalidPasswordError.js'

export class UserService {
	private static DoesUserExist(user: UserRefreshToken | User | null): boolean {
		if (!user) {
			return false
		}
		return true
	}

	public static async Login (
		input: LoginInput,
	): Promise<Tokens | Error> {
		try {
			let accessToken 
			const errorList = await UserValidation.validateUserInput(input)
			if (!errorList.isValid && errorList.errors !== null) {
				return new UserSignUpValidationError('Validation failed', errorList.errors)
			}
			const userFromDb = await User.findOne({ where: { email: input.email } })
			if(!this.DoesUserExist(userFromDb)){
				return new UserDoesNotExistsError('User does not exist')
			}
			const isPasswordValid = await bcrypt.compare(input.password, <string>userFromDb?.password)
			if (!isPasswordValid){
				return new InvalidPasswordError('Invalid password!')
			}
			console.log('7', userFromDb)
			try {
				accessToken = jwt.sign({ email: input.email }, 'SIKRETKAMUFLADZICBOSANSKITAJNIAGENT', {
					expiresIn: '20s',
				})
			} catch (error) {
				console.log(error)
			}
			console.log('accessToken: ', accessToken)
			
			const refreshToken = jwt.sign(input.email, <jwt.Secret>'SIKRETKAMUFLADZICBOSANSKITAJNIAGENTTTT')

			const refreshTokenFromDb = await UserRefreshToken.findOne({
				where: { refreshToken: refreshToken },
			})

			if (!refreshTokenFromDb) {
				const newRefreshToken = new UserRefreshToken()
				newRefreshToken.id = v4()
				newRefreshToken.refreshToken = refreshToken
				newRefreshToken.userId = <string>userFromDb?.id

				await newRefreshToken.save()
			}

			return {
				accessToken: accessToken,
				refreshToken: refreshToken,
			}
		} catch (error) {
			return new Error( <string>error ) 
		}
	}

	private static validateLogInInput(input: LoginInput){
		console.log(input)
		if(!input){
			return false
		}
		if(input.email === undefined || input.password === undefined){
			return false
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

			if (!errorList.isValid && errorList.errors !== null) {
				return new UserSignUpValidationError('Validation failed', errorList.errors)
			}
	
			newUser.password = hashedPassword

			await newUser.save()
	
			return newUser
		} catch (error) {
			return new Error( <string>error ) 
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
				<string>userFromDb?.refreshToken,
				<jwt.Secret>'SIKRETKAMUFLADZICBOSANSKITAJNIAGENTTTT',
				(error) => {
					if (error) {
						return new Error('Token error')
					}
					const accessToken = jwt.sign(
						{ email: userFromDb?.user.email },
						<jwt.Secret>'SIKRETKAMUFLADZICBOSANSKITAJNIAGENT',
						{ expiresIn: '30s' }
					)
					accessTokenRet = accessToken
				}
			)

			return {accessToken: accessTokenRet}
		} catch (error) {
			return new Error( <string>error )
		}
	}
}