export class UserSignUpValidationError extends Error{
	private errorList: Record<string, string[]>
	constructor(message: string, errorList: Record<string, string[]>){
		super(message)
		this.name = 'UserSignUpValidationError'
		this.errorList = errorList
	}
}