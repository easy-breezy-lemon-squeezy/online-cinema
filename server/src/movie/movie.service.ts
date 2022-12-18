import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'

import { CreateMovieDto } from './create-movie.dto'
import { MovieModel } from './movie.model'

@Injectable()
export class MovieService {
	constructor(
		@InjectModel(MovieModel) private readonly movieModel: ModelType<MovieModel>
	) {}

	async getAll(searchTerm?: string): Promise<DocumentType<MovieModel>[]> {
		let options = {}

		if (searchTerm) {
			options = {
				$or: [
					{
						title: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}

		return this.movieModel
			.find(options)
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.populate('genres actors')
			.exec()
	}

	async bySlug(slug: string) {
		const doc = await this.movieModel
			.findOne({ slug })
			.populate('genres actors')
			.exec()
		if (!doc) throw new NotFoundException('Movie not found')
		return doc
	}

	async byActor(actorId: Types.ObjectId): Promise<DocumentType<MovieModel>[]> {
		const docs = await this.movieModel.find({ actors: actorId }).exec()
		if (!docs) throw new NotFoundException('Movies not found')
		return docs
	}

	async byGenres(
		genreIds: Types.ObjectId[]
	): Promise<DocumentType<MovieModel>[]> {
		const docs = await this.movieModel
			.find({ genres: { $in: genreIds } })
			.exec()
		if (docs.length == 0) throw new NotFoundException('Movies not found')
		return docs
	}

	async updateCountOpened(slug: string) {
		const doc = await this.movieModel
			.findOneAndUpdate(
				{ slug },
				{ $inc: { countOpened: 1 } },
				{
					new: true,
				}
			)
			.exec()
		if (!doc) throw new NotFoundException('Movies not found')
		return doc
	}

	async getMostPopular(): Promise<DocumentType<MovieModel>[]> {
		return this.movieModel
			.find({ countOpened: { $gt: 0 } })
			.sort({ countOpened: -1 })
			.populate('genres')
			.exec()
	}

	/* Admin area */

	async byId(id: string): Promise<DocumentType<MovieModel>> {
		const doc = await this.movieModel.findById(id).exec()
		if (!doc) throw new NotFoundException('Movie not found')
		return doc
	}

	async create(): Promise<Types.ObjectId> {
		const defaultValue: CreateMovieDto = {
			bigPoster: '',
			actors: [],
			genres: [],
			poster: '',
			title: '',
			videoUrl: '',
			slug: '',
		}
		const movie = await this.movieModel.create(defaultValue)
		return movie._id
	}

	async update(
		id: string,
		dto: CreateMovieDto
	): Promise<DocumentType<MovieModel> | null> {
		const updateDoc = await this.movieModel
			.findByIdAndUpdate(id, dto, { new: true })
			.exec()
		if (!updateDoc) throw new NotFoundException('Movie not found')
		return updateDoc
	}

	async delete(id: string): Promise<DocumentType<MovieModel> | null> {
		const doc = await this.movieModel.findByIdAndDelete(id).exec()
		if (!doc) throw new NotFoundException('Movie not found')
		return doc
	}

	async updateRating(id: string, newRating: number) {
		const doc = await this.movieModel
			.findByIdAndUpdate(id, { rating: newRating }, { new: true })
			.exec()
		if (!doc) throw new NotFoundException('Movie not found')
		return doc
	}
}
