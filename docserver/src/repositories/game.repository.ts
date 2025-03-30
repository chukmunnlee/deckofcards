import {Injectable} from "@nestjs/common";
import {FactoryRepository} from "./factory.repository";
import {Collection } from "mongodb";
import {Game} from "src/models/game";

const GAME_COLLECTION = 'games'

@Injectable()
export class GameRepository {

  private colGames: Collection

  constructor(private factoryRepo: FactoryRepository) { 
    this.colGames = this.factoryRepo.collection(GAME_COLLECTION)
    this.colGames.countDocuments()
      .then(count => {
        if (count <= 0)
          this.colGames.createIndex({ gameId: 1 })
      })
  }

  cleanInativeGame(duration: number) {
    const past = Date.now() - duration
    this.colGames.deleteMany({
      lastUpdate: { $lte: past }
    })
  }

  insertGame(game: Game): Promise<any> {
    return this.colGames.insertOne(game)
  }

  getGameById(gameId: string) {
    return this.colGames.findOne({ gameId })
  }

  deleteGameById(gameId: string) {
    return this.colGames.deleteOne({ gameId })
  }

  updateGameById(game: Game, lastUpdate: number) {
    game.lastUpdate = Date.now()
    return this.colGames.replaceOne({ lastUpdate }, game)
      .then(result => ((result.matchedCount > 0) && (result.modifiedCount > 0)))
  }

  getGameIds(): Promise<any[]> {
    return this.colGames.find()
        .project({ gameId: 1, createOn: 1, lastUpdate: 1, _id: 0 })
        .sort({ lastUpdate: -1 })
        .toArray()
  }
  
}
