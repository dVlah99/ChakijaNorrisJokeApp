import 'reflect-metadata'
/* eslint-disable no-mixed-spaces-and-tabs */
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { IsEmail, Length, IsDefined } from 'class-validator'


@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
  	id!: string

    @Column({nullable: false})
	@Length(3, 20)
	@IsDefined()
  	firstName!: string

	@Column({nullable: false})
	@Length(3, 20)
	@IsDefined()
  	lastName!: string

    @Column({ unique: true, nullable: false })
    @IsEmail({}, { always: true, message: 'Please enter a valid email' })
	@IsDefined()
  	email!: string

	@Column({nullable: false})
    @Length(8, 20)
	@IsDefined()
  	password!: string
}
