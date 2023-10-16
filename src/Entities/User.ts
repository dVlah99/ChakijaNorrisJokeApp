/* eslint-disable no-mixed-spaces-and-tabs */
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { IsEmail } from 'class-validator'

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
  	id: string

    @Column()
  	firstName: string

    @Column()
  	lastName: string

    @Column({ unique: true })
    @IsEmail()
  	email: string

    @Column()
  	password: string
}
