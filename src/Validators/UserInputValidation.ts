import { User } from '../Entities/User'
import { validate, ValidationError } from 'class-validator'

export class UserValidation{
	public static async userValidation(user: User): Promise<boolean | ValidationError[]>{
		await validate(user).then(errors => {
			if (errors.length > 0) {
				const errorArray = errors.map((err) => err)

				console.log(errorArray)
				throw new Error(JSON.stringify(errorArray, null, 2))    
			}
		})

		return true
	}
}