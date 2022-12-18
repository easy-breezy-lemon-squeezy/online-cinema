import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { CreateGenreDto } from './dto/create-genre.dto'
import { GenreModel } from './genre.model'
import { ICollection } from './interfaces/genre.interface'

@Injectable()
export class GenreService {
	constructor(
		@InjectModel(GenreModel) private readonly genreModel: ModelType<GenreModel>
	) {}

	async getAll(searchTerm?: string): Promise<DocumentType<GenreModel>[]> {
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
					{
						description: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}

		return this.genreModel
			.find(options)
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.exec()
	}

	async bySlug(slug: string): Promise<DocumentType<GenreModel>> {
		const genre = await this.genreModel.findOne({ slug }).exec()
		if (!genre) throw new NotFoundException('Genre not found')
		return genre
	}

	async getPopular(): Promise<DocumentType<GenreModel>[]> {
		return this.genreModel
			.find()
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.exec()
	}

	async getCollections() {
		const genres = await this.getAll()

		const collections = genres
		return collections
	}

	/* Admin area */

	async byId(id: string): Promise<DocumentType<GenreModel>> {
		const genre = await this.genreModel.findById(id)

		if (!genre) throw new NotFoundException('Genre not found')
		return genre
	}

	async create(): Promise<Types.ObjectId> {
		const defaultValue: CreateGenreDto = {
			description: '',
			icon: '',
			name: '',
			slug: '',
		}
		const genre = await this.genreModel.create(defaultValue)
		return genre._id
	}

	async update(
		id: string,
		dto: CreateGenreDto
	): Promise<DocumentType<GenreModel> | null> {
		const updateDoc = await this.genreModel
			.findByIdAndUpdate(id, dto, { new: true })
			.exec()
		if (!updateDoc) throw new NotFoundException('Genre not found')
		return updateDoc
	}

	async delete(id: string): Promise<DocumentType<GenreModel> | null> {
		const doc = await this.genreModel.findByIdAndDelete(id).exec()
		if (!doc) throw new NotFoundException('Genre not found')
		return doc
	}
}
