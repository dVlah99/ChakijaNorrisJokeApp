/* eslint-disable no-mixed-spaces-and-tabs */
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { IsEmail, Length } from 'class-validator'
import { UserSignupInput } from '../Inputs/UserSignupInput'


@Entity()
export class User extends BaseEntity {
/* 	constructor(input: UserSignupInput){
		super()
		this.firstName = input.firstName
		this.lastName = input.lastName
		this.email = input.email
		this.password = input.password
	} */

    @PrimaryGeneratedColumn('uuid')
  	id: string

    @Column()
  	firstName: string

    @Column()
  	lastName: string

    @Column({ unique: true })
    @IsEmail(undefined, {always: true, message: 'Please enter a valid email'})
  	email: string

    @Column()
    @Length(8, 20)
  	password: string
}
