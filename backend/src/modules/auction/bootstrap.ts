import AuctionRepository from './repositories/auction.repository';
import AuctionService from './services/auction.service';

const auctionRepository = new AuctionRepository();
export const auctionService = new AuctionService(auctionRepository);
