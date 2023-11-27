
/* eslint-disable no-mixed-spaces-and-tabs */
import { IsEmail, Length, IsDefined } from 'class-validator'

export class LoginInput {
    @IsEmail(undefined, {always: true, message: 'Please enter a valid email'})
	@IsDefined()
  	email!: string

    @Length(8, 20)
	@IsDefined()
  	password!: string
}