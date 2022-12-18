import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { ActorModel } from './actor.model'
import { CreateActorDto } from './actor.dto'

@Injectable()
export class ActorService {
	constructor(
		@InjectModel(ActorModel)
		private readonly actorModel: ModelType<ActorModel>
	) {}

	async getAll(searchTerm?: string): Promise<DocumentType<ActorModel>[]> {
		let options = {}

		if (searchTerm) {
			options = {
				$or: [
					{
						name: new RegExp(searchTerm, 'i'),
					},
					{
						slug: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}

		return this.actorModel
			.find()
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.exec()
	}

	async bySlug(slug: string): Promise<DocumentType<ActorModel>> {
		const actor = await this.actorModel.findOne({ slug }).exec()
		if (!actor) throw new NotFoundException('Actor not found')
		return actor
	}

	/* Admin area */
	async byId(id: string): Promise<DocumentType<ActorModel>> {
		const actor = await this.actorModel.findById(id)

		if (!actor) throw new NotFoundException('Actor not found')
		return actor
	}

	async create(): Promise<Types.ObjectId> {
		const defaultValue: CreateActorDto = {
			name: '',
			photo: '',
			slug: '',
		}
		const actor = await this.actorModel.create(defaultValue)
		return actor._id
	}

	async update(
		id: string,
		dto: CreateActorDto
	): Promise<DocumentType<ActorModel> | null> {
		const doc = await this.actorModel
			.findByIdAndUpdate(id, dto, { new: true })
			.exec()
		if (!doc) throw new NotFoundException('Actor not found')
		return doc
	}

	async delete(id: string): Promise<DocumentType<ActorModel> | null> {
		const doc = await this.actorModel.findByIdAndDelete(id).exec()
		if (!doc) throw new NotFoundException('Actor not found')
		return doc
	}
}
