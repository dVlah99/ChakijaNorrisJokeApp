export class UserDoesNotExistsError extends Error{
	constructor(message: string){
		super(message)
		this.name = 'UserDoesNotExistsError'
	}
}