import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class UserRefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  refreshToken: string

  @Column()
  userFk: string
}
