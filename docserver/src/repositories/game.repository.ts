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

  insertGame(game: Game): Promise<any> {
    return this.colGames.insertOne(game)
  }
  
}
