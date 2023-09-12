import {Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique} from 'typeorm'
import {IsEmail} from 'class-validator'
import { v4 as uuid } from 'uuid'
@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({unique: true})
    @IsEmail()
    email: string

    @Column()
    password: string
}