import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { MovieService } from 'src/movie/movie.service'
import { CreateGenreDto } from './dto/create-genre.dto'
import { GenreModel } from './genre.model'
import { ICollection } from './interfaces/genre.interface'
const { ObjectId } = require('mongodb')

@Injectable()
export class GenreService {
	constructor(
		@InjectModel(GenreModel) private readonly genreModel: ModelType<GenreModel>,
		private readonly movieService: MovieService
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

	async getCollections(): Promise<ICollection[]> {
		const genres = await this.getAll()

		const collections = await Promise.all(
			genres.map(async (genre) => {
				const _id = ObjectId(genre._id)

				const moviesByGenre = await this.movieService.byGenres(_id)

				if (moviesByGenre[0]) {
					const bigPosterImage = moviesByGenre[0].bigPoster

					const result: ICollection = {
						_id: String(genre._id),
						title: genre.name,
						slug: genre.slug,
						image: bigPosterImage,
					}

					return result
				} else {
					const result: ICollection = {
						_id: String(genre._id),
						title: genre.name,
						slug: genre.slug,
						image: '',
					}

					return result
				}
			})
		)
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
