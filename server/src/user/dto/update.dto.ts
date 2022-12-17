import { IsEmail, IsString } from 'class-validator'

export class UpdateDto {
	@IsEmail()
	email: string

	password?: string
	isAdmin?: boolean
}
