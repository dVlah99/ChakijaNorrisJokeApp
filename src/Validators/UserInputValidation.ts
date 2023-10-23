import { User } from '../Entities/User'
import { validate } from 'class-validator'

export class UserValidation{
	static async validateUserInput(userInput: User): Promise<{ errors: Record<string, string[]> | null, isValid: boolean }> {
		const errors: Record<string, string[]> = {}
		const validationErrors = await validate(userInput)
		
		if (validationErrors.length > 0) {
			validationErrors.forEach((error) => {
				const { property, constraints } = error
				errors[property] = Object.values(constraints || {})
			})

			return { errors, isValid: false }
		}
	
		return { errors: null, isValid: true }
	}
	
}